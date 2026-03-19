import { NextRequest, NextResponse } from "next/server";
import { validateForkName, type Fork } from "@/lib/types";

/**
 * POST /api/forks
 *
 * Creates a new fork (Railway deployment).
 * Full implementation is covered in WO-2 (Backend API Route).
 * This stub handles validation and returns appropriate error shapes
 * so the frontend can be developed and tested independently.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, chain } = body;

    // Validate fork name
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Fork name is required" }, { status: 400 });
    }
    const nameError = validateForkName(name);
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 });
    }

    // Validate chain
    const validChains = [
      "base-mainnet",
      "opt-mainnet",
      "eth-mainnet",
      "arb-mainnet",
      "polygon-mainnet",
      "zksync-mainnet",
    ];
    if (!chain || !validChains.includes(chain)) {
      return NextResponse.json({ error: "Invalid chain selection" }, { status: 400 });
    }

    // TODO (WO-2): Call Railway API to create a new service/deployment
    // For now, return a stub response so the UI can be tested end-to-end
    const fork: Fork = {
      id: `fork-${Date.now()}`,
      name,
      chain,
      status: "deploying",
      dashboardUrl: `https://${name}.up.railway.app`,
      rpcUrl: `https://${name}.up.railway.app/rpc`,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ fork }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/forks
 *
 * Lists all forks.
 * Full implementation is covered in WO-2 (Backend API Route).
 */
export async function GET() {
  // TODO (WO-2): Fetch list of Railway deployments
  return NextResponse.json({ forks: [] }, { status: 200 });
}
