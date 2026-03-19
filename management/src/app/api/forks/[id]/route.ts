/**
 * /api/forks/[id]
 *
 * DELETE – delete a fork by its Railway service ID (REQ-FM-003)
 */

import { NextRequest, NextResponse } from "next/server";

import { deleteForkService } from "@/lib/railway-client";

// ---------------------------------------------------------------------------
// DELETE /api/forks/[id] — destroy a fork (REQ-FM-003)
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: "Fork ID is required." },
      { status: 400 }
    );
  }

  try {
    // Railway's serviceDelete mutation blocks until the service is removed (AC-FM-003.2)
    await deleteForkService(id);

    return NextResponse.json(
      {
        success: true,
        message:
          "Fork deleted successfully. The fork and all its blockchain state have been permanently removed.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`[DELETE /api/forks/${id}]`, error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete fork. Railway API error.";

    // Determine status code from error message
    const status = message.toLowerCase().includes("not found") ? 404 : 502;

    return NextResponse.json({ success: false, message }, { status });
  }
}
