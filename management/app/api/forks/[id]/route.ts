/**
 * DELETE /api/forks/[id]
 *
 * Deletes a fork deployment from Railway by its deployment ID.
 * Calls the Railway GraphQL API to destroy the deployment and waits
 * for confirmation before returning success.
 *
 * AC-FM-003.1: Call Railway API to destroy deployment by ID.
 * AC-FM-003.2: Wait for Railway to confirm deletion before returning success.
 * AC-FM-003.3: Return success message on successful deletion.
 * AC-FM-003.4: Return error message on failure (not found, permission, API error).
 */

import { NextRequest, NextResponse } from 'next/server';
import { railwayMutate } from '@/lib/railway-client';
import { RailwayApiError, RailwayErrorCode } from '@/lib/types';

interface DeleteForkResponse {
  success: boolean;
  message: string;
}

interface DeploymentDeleteMutationResponse {
  deploymentDelete: boolean;
}

const DEPLOYMENT_DELETE_MUTATION = `
  mutation DeploymentDelete($id: String!) {
    deploymentDelete(id: $id)
  }
`;

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<'/api/forks/[id]'>
): Promise<NextResponse<DeleteForkResponse>> {
  const { id } = await ctx.params;

  if (!id) {
    return NextResponse.json(
      { success: false, message: 'Fork ID is required' },
      { status: 400 }
    );
  }

  try {
    // AC-FM-003.1: Call Railway API to destroy deployment
    // AC-FM-003.2: railwayMutate awaits Railway's confirmation before returning
    const data = await railwayMutate<DeploymentDeleteMutationResponse>(
      DEPLOYMENT_DELETE_MUTATION,
      { id },
      { operation: 'DeploymentDelete', deploymentId: id }
    );

    if (!data.deploymentDelete) {
      // AC-FM-003.4: Return error when deletion fails (not found / already deleted)
      return NextResponse.json(
        { success: false, message: 'Fork not found or already deleted' },
        { status: 404 }
      );
    }

    // AC-FM-003.3: Return success message indicating permanent removal
    return NextResponse.json({
      success: true,
      message:
        'Fork and all its blockchain state have been permanently removed.',
    });
  } catch (error) {
    if (error instanceof RailwayApiError) {
      console.error('[DELETE /api/forks/:id] Railway API error:', {
        id,
        code: error.code,
        message: error.message,
      });

      // AC-FM-003.4: Permission error
      if (
        error.code === RailwayErrorCode.AUTHORIZATION_FAILED ||
        error.code === RailwayErrorCode.AUTHENTICATION_FAILED
      ) {
        return NextResponse.json(
          {
            success: false,
            message: "You don't have permission to delete this fork",
          },
          { status: 403 }
        );
      }

      // AC-FM-003.4: Not found (some Railway errors surface as message text)
      const lowerMsg = error.message.toLowerCase();
      if (lowerMsg.includes('not found') || lowerMsg.includes('does not exist')) {
        return NextResponse.json(
          { success: false, message: 'Fork not found or already deleted' },
          { status: 404 }
        );
      }

      // AC-FM-003.4: Transient / Railway API error
      return NextResponse.json(
        { success: false, message: 'Unable to delete fork. Try again later.' },
        { status: 502 }
      );
    }

    console.error('[DELETE /api/forks/:id] Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to delete fork. Try again later.' },
      { status: 500 }
    );
  }
}
