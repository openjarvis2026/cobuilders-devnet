/**
 * Tests for DELETE /api/forks/[id]
 */

// ---------------------------------------------------------------------------
// Mock next/server
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
// Mock Railway client
// ---------------------------------------------------------------------------
jest.mock("@/lib/railway-client", () => ({
  deleteForkService: jest.fn(),
}));

import { DELETE } from "../route";
import * as railwayClient from "@/lib/railway-client";

const mockDeleteForkService = railwayClient.deleteForkService as jest.MockedFunction<typeof railwayClient.deleteForkService>;

function makeRequest(id: string) {
  return {
    _req: {} as import("next/server").NextRequest,
    params: { id },
  };
}

// ---------------------------------------------------------------------------
// DELETE /api/forks/[id]
// ---------------------------------------------------------------------------

describe("DELETE /api/forks/[id]", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 200 with success message on successful deletion", async () => {
    mockDeleteForkService.mockResolvedValue(undefined);
    const { _req, params } = makeRequest("svc-123");
    const res = await DELETE(_req, { params });
    expect((res as any).status).toBe(200);
    expect((res as any)._body).toMatchObject({ success: true });
    expect((res as any)._body.message).toMatch(/deleted|removed/i);
  });

  it("calls deleteForkService with the correct service ID", async () => {
    mockDeleteForkService.mockResolvedValue(undefined);
    const { _req, params } = makeRequest("svc-abc");
    await DELETE(_req, { params });
    expect(mockDeleteForkService).toHaveBeenCalledWith("svc-abc");
  });

  it("returns 404 when Railway reports not found", async () => {
    mockDeleteForkService.mockRejectedValue(new Error("Service not found"));
    const { _req, params } = makeRequest("svc-missing");
    const res = await DELETE(_req, { params });
    expect((res as any).status).toBe(404);
    expect((res as any)._body).toMatchObject({ success: false });
  });

  it("returns 502 on generic Railway API error", async () => {
    mockDeleteForkService.mockRejectedValue(new Error("internal server error"));
    const { _req, params } = makeRequest("svc-err");
    const res = await DELETE(_req, { params });
    expect((res as any).status).toBe(502);
    expect((res as any)._body).toMatchObject({ success: false });
  });

  it("includes the Railway error message in the response", async () => {
    const errMsg = "Permission denied on service svc-err";
    mockDeleteForkService.mockRejectedValue(new Error(errMsg));
    const { _req, params } = makeRequest("svc-err");
    const res = await DELETE(_req, { params });
    expect((res as any)._body.message).toContain(errMsg);
  });
});
