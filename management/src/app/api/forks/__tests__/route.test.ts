/**
 * Tests for GET /api/forks and POST /api/forks
 */

// ---------------------------------------------------------------------------
// Mock next/server before importing anything that uses it
// ---------------------------------------------------------------------------
jest.mock("next/server", () => {
  const actual = jest.requireActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    NextResponse: {
      json: (body: unknown, init?: ResponseInit) => ({
        _body: body,
        status: init?.status ?? 200,
        json: async () => body,
      }),
    },
  };
});

// ---------------------------------------------------------------------------
// Mock the Railway client
// ---------------------------------------------------------------------------
jest.mock("@/lib/railway-client", () => ({
  listForkServices: jest.fn(),
  createForkService: jest.fn(),
  deleteForkService: jest.fn(),
  getDefaultEnvironmentId: jest.fn(),
  pollDeploymentUntilHealthy: jest.fn(),
  mapRailwayStatus: jest.fn((s: string) => {
    const map: Record<string, string> = {
      SUCCESS: "active",
      ACTIVE: "active",
      BUILDING: "deploying",
      CRASHED: "failed",
    };
    return map[s.toUpperCase()] ?? "deploying";
  }),
}));

import { GET, POST } from "../route";
import * as railwayClient from "@/lib/railway-client";

// Helpers to get typed mocks
const mockListForkServices = railwayClient.listForkServices as jest.MockedFunction<typeof railwayClient.listForkServices>;
const mockCreateForkService = railwayClient.createForkService as jest.MockedFunction<typeof railwayClient.createForkService>;
const mockDeleteForkService = railwayClient.deleteForkService as jest.MockedFunction<typeof railwayClient.deleteForkService>;
const mockGetDefaultEnvironmentId = railwayClient.getDefaultEnvironmentId as jest.MockedFunction<typeof railwayClient.getDefaultEnvironmentId>;
const mockPollDeploymentUntilHealthy = railwayClient.pollDeploymentUntilHealthy as jest.MockedFunction<typeof railwayClient.pollDeploymentUntilHealthy>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown) {
  return {
    json: async () => body,
  } as unknown as import("next/server").NextRequest;
}

// ---------------------------------------------------------------------------
// GET /api/forks
// ---------------------------------------------------------------------------

describe("GET /api/forks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty fork list when no fork services exist", async () => {
    mockListForkServices.mockResolvedValue([]);
    const res = await GET();
    expect((res as any)._body).toEqual({ forks: [] });
    expect((res as any).status).toBe(200);
  });

  it("maps service labels to fork fields", async () => {
    mockListForkServices.mockResolvedValue([
      {
        serviceId: "svc-1",
        labels: {
          "fork-name": "my-fork",
          "fork-chain": "base-mainnet",
          "created-at": "2024-01-01T00:00:00.000Z",
        },
        latestDeployment: {
          id: "dep-1",
          status: "SUCCESS",
          url: "https://my-fork.up.railway.app",
        },
      },
    ]);

    const res = await GET();
    const { forks } = (res as any)._body;
    expect(forks).toHaveLength(1);
    expect(forks[0]).toMatchObject({
      id: "svc-1",
      name: "my-fork",
      chain: "base-mainnet",
      createdAt: "2024-01-01T00:00:00.000Z",
      dashboardUrl: "https://my-fork.up.railway.app",
      rpcUrl: "https://my-fork.up.railway.app/rpc",
      status: "active",
    });
  });

  it("strips trailing slash from dashboard URL", async () => {
    mockListForkServices.mockResolvedValue([
      {
        serviceId: "svc-2",
        labels: { "fork-name": "f", "fork-chain": "eth-mainnet", "created-at": "2024-01-02T00:00:00.000Z" },
        latestDeployment: { id: "dep-2", status: "ACTIVE", url: "https://f.railway.app/" },
      },
    ]);
    const res = await GET();
    const { forks } = (res as any)._body;
    expect(forks[0].dashboardUrl).toBe("https://f.railway.app");
    expect(forks[0].rpcUrl).toBe("https://f.railway.app/rpc");
  });

  it("sorts forks newest-first by created-at", async () => {
    mockListForkServices.mockResolvedValue([
      {
        serviceId: "old",
        labels: { "fork-name": "old", "fork-chain": "eth-mainnet", "created-at": "2024-01-01T00:00:00.000Z" },
        latestDeployment: { id: "d1", status: "ACTIVE", url: "https://old.railway.app" },
      },
      {
        serviceId: "new",
        labels: { "fork-name": "new", "fork-chain": "eth-mainnet", "created-at": "2024-06-01T00:00:00.000Z" },
        latestDeployment: { id: "d2", status: "ACTIVE", url: "https://new.railway.app" },
      },
    ]);
    const res = await GET();
    const { forks } = (res as any)._body;
    expect(forks[0].id).toBe("new");
    expect(forks[1].id).toBe("old");
  });

  it("returns 502 when Railway API throws", async () => {
    mockListForkServices.mockRejectedValue(new Error("network error"));
    const res = await GET();
    expect((res as any).status).toBe(502);
    expect((res as any)._body).toHaveProperty("error");
  });
});

// ---------------------------------------------------------------------------
// POST /api/forks
// ---------------------------------------------------------------------------

describe("POST /api/forks", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 for invalid fork name", async () => {
    const res = await POST(makeRequest({ name: "BAD NAME!", chain: "base-mainnet" }));
    expect((res as any).status).toBe(400);
    expect((res as any)._body.error).toMatch(/lowercase|hyphen/i);
  });

  it("returns 400 for fork name shorter than 3 chars", async () => {
    const res = await POST(makeRequest({ name: "ab", chain: "base-mainnet" }));
    expect((res as any).status).toBe(400);
  });

  it("returns 400 for fork name longer than 32 chars", async () => {
    const res = await POST(makeRequest({ name: "a".repeat(33), chain: "base-mainnet" }));
    expect((res as any).status).toBe(400);
  });

  it("returns 400 for unsupported chain", async () => {
    const res = await POST(makeRequest({ name: "my-fork", chain: "solana-mainnet" }));
    expect((res as any).status).toBe(400);
    expect((res as any)._body.error).toMatch(/supported chains/i);
  });

  it("returns 400 when chain is missing", async () => {
    const res = await POST(makeRequest({ name: "my-fork" }));
    expect((res as any).status).toBe(400);
  });

  it("returns 400 when body is not valid JSON", async () => {
    const badReq = { json: async () => { throw new SyntaxError("bad json"); } } as unknown as import("next/server").NextRequest;
    const res = await POST(badReq);
    expect((res as any).status).toBe(400);
  });

  it("returns 502 when Railway service creation fails", async () => {
    mockGetDefaultEnvironmentId.mockResolvedValue("env-1");
    mockCreateForkService.mockRejectedValue(new Error("Railway API error"));
    const res = await POST(makeRequest({ name: "my-fork", chain: "base-mainnet" }));
    expect((res as any).status).toBe(502);
    expect((res as any)._body.error).toContain("Railway API error");
  });

  it("returns 504 and cleans up when deployment fails", async () => {
    mockGetDefaultEnvironmentId.mockResolvedValue("env-1");
    mockCreateForkService.mockResolvedValue({ serviceId: "svc-1", deploymentId: "dep-1" });
    mockPollDeploymentUntilHealthy.mockResolvedValue({ status: "failed", url: null });
    mockDeleteForkService.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ name: "my-fork", chain: "base-mainnet" }));

    expect((res as any).status).toBe(504);
    expect(mockDeleteForkService).toHaveBeenCalledWith("svc-1");
  });

  it("returns 504 when deployment times out (url is null)", async () => {
    mockGetDefaultEnvironmentId.mockResolvedValue("env-1");
    mockCreateForkService.mockResolvedValue({ serviceId: "svc-2", deploymentId: "dep-2" });
    mockPollDeploymentUntilHealthy.mockResolvedValue({ status: "failed", url: null });
    mockDeleteForkService.mockResolvedValue(undefined);

    const res = await POST(makeRequest({ name: "good-name", chain: "eth-mainnet" }));
    expect((res as any).status).toBe(504);
  });

  it("returns 201 with fork details on successful creation", async () => {
    mockGetDefaultEnvironmentId.mockResolvedValue("env-1");
    mockCreateForkService.mockResolvedValue({ serviceId: "svc-ok", deploymentId: "dep-ok" });
    mockPollDeploymentUntilHealthy.mockResolvedValue({
      status: "active",
      url: "https://my-fork.up.railway.app",
    });

    const res = await POST(makeRequest({ name: "my-fork", chain: "base-mainnet" }));

    expect((res as any).status).toBe(201);
    expect((res as any)._body).toMatchObject({
      id: "svc-ok",
      name: "my-fork",
      chain: "base-mainnet",
      dashboardUrl: "https://my-fork.up.railway.app",
      rpcUrl: "https://my-fork.up.railway.app/rpc",
      status: "active",
    });
  });

  it("strips trailing slash from URL on success", async () => {
    mockGetDefaultEnvironmentId.mockResolvedValue("env-1");
    mockCreateForkService.mockResolvedValue({ serviceId: "svc-ok", deploymentId: "dep-ok" });
    mockPollDeploymentUntilHealthy.mockResolvedValue({
      status: "active",
      url: "https://fork.railway.app/",
    });

    const res = await POST(makeRequest({ name: "my-fork", chain: "base-mainnet" }));
    expect((res as any)._body.dashboardUrl).toBe("https://fork.railway.app");
    expect((res as any)._body.rpcUrl).toBe("https://fork.railway.app/rpc");
  });
});
