/**
 * /api/forks
 *
 * GET  – list all active CoBuilders forks (REQ-FM-002)
 * POST – create a new fork (REQ-FM-001)
 */

import { NextRequest, NextResponse } from "next/server";

import {
  createForkService,
  deleteForkService,
  getDefaultEnvironmentId,
  listForkServices,
  mapRailwayStatus,
  pollDeploymentUntilHealthy,
} from "@/lib/railway-client";
import type { Fork } from "@/lib/types";
import { validateChain, validateForkName } from "@/lib/validation";

// ---------------------------------------------------------------------------
// GET /api/forks — list all forks (REQ-FM-002)
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const services = await listForkServices();

    const forks: Fork[] = services
      .map((svc): Fork | null => {
        const { labels, latestDeployment } = svc;

        const name = labels["fork-name"] ?? "";
        const chain = labels["fork-chain"] ?? "";
        const createdAt = labels["created-at"] ?? new Date(0).toISOString();

        const rawUrl = latestDeployment?.url ?? null;
        const dashboardUrl = rawUrl ? rawUrl.replace(/\/$/, "") : "";
        const rpcUrl = dashboardUrl ? `${dashboardUrl}/rpc` : "";

        const status = latestDeployment
          ? mapRailwayStatus(latestDeployment.status)
          : "deploying";

        return {
          id: svc.serviceId,
          name,
          chain,
          createdAt,
          dashboardUrl,
          rpcUrl,
          status,
        };
      })
      .filter((f): f is Fork => f !== null)
      // Sort newest first (AC-FM-002.4)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    return NextResponse.json({ forks });
  } catch (error) {
    console.error("[GET /api/forks]", error);
    return NextResponse.json(
      {
        error:
          "Unable to retrieve fork list. The Railway API may be unreachable.",
      },
      { status: 502 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/forks — create a new fork (REQ-FM-001)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { name, chain } = body as Record<string, unknown>;

  // Validate fork name (REQ-FM-005)
  const nameError = validateForkName(name);
  if (nameError) {
    return NextResponse.json({ error: nameError }, { status: 400 });
  }

  // Validate chain (REQ-FM-006)
  const chainError = validateChain(chain);
  if (chainError) {
    return NextResponse.json({ error: chainError }, { status: 400 });
  }

  const forkName = name as string;
  const forkChain = chain as string;

  let serviceId: string;
  let deploymentId: string;

  try {
    // Resolve the project's default environment (needed for variables + redeploy)
    const environmentId = await getDefaultEnvironmentId();

    const result = await createForkService({
      forkName,
      chain: forkChain,
      environmentId,
    });

    serviceId = result.serviceId;
    deploymentId = result.deploymentId;
  } catch (error) {
    console.error("[POST /api/forks] Railway service creation failed:", error);

    // Best-effort cleanup: if the service was created but subsequent steps
    // failed, delete it so it doesn't appear as a dangling fork (AC-FM-001.6).
    // serviceId may be undefined if creation itself failed — guard accordingly.
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create fork. Railway API error.",
      },
      { status: 502 }
    );
  }

  // Poll until the deployment is healthy or times out (AC-FM-001.4 / AC-FM-001.6)
  const { status, url } = await pollDeploymentUntilHealthy(deploymentId);

  if (status === "failed" || !url) {
    // Clean up the service so it doesn't appear in list (AC-FM-001.6)
    try {
      await deleteForkService(serviceId);
    } catch (cleanupError) {
      console.error(
        "[POST /api/forks] Cleanup after failed deployment failed:",
        cleanupError
      );
    }

    return NextResponse.json(
      {
        error:
          status === "failed"
            ? "Fork deployment failed. The service has been removed."
            : "Fork deployment timed out after 5 minutes. The service has been removed.",
      },
      { status: 504 }
    );
  }

  const dashboardUrl = url.replace(/\/$/, "");
  const rpcUrl = `${dashboardUrl}/rpc`;

  return NextResponse.json(
    {
      id: serviceId,
      name: forkName,
      chain: forkChain,
      dashboardUrl,
      rpcUrl,
      status: "active",
    },
    { status: 201 }
  );
}
