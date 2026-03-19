/**
 * DeleteForkButton component
 *
 * Renders a delete icon button that triggers a confirmation dialog before
 * calling the provided async delete handler.
 *
 * AC-MDU-004.1: Display a "Delete" button for each fork.
 * AC-MDU-004.2: Show confirmation dialog with warning message on click.
 * AC-MDU-004.3: Dialog includes "Delete" and "Cancel" buttons.
 * AC-MDU-004.4: Show loading indicator on fork card during deletion.
 * AC-MDU-004.7: Cancel closes dialog without taking action.
 */

'use client';

import { useState, useCallback } from 'react';
import { ConfirmDialog } from './ConfirmDialog';

interface DeleteForkButtonProps {
  /** Display name of the fork shown in the confirmation message. */
  forkName: string;
  /**
   * Async function that performs the deletion. Should throw on failure so
   * the button can surface the error state.
   */
  onDelete: () => Promise<void>;
  /** When true the button is shown as disabled (e.g. while another op runs). */
  disabled?: boolean;
}

export function DeleteForkButton({
  forkName,
  onDelete,
  disabled = false,
}: DeleteForkButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    // AC-MDU-004.7: Cancel — close dialog, no action taken
    if (!isDeleting) {
      setDialogOpen(false);
    }
  }, [isDeleting]);

  const handleConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      // AC-MDU-004.4: Send delete request; loading state active during request
      await onDelete();
      // On success the parent removes the card from the list; dialog may be
      // unmounted, so we guard state updates conservatively.
      setDialogOpen(false);
    } catch {
      // Error is surfaced via onDelete (caller shows toast); keep dialog open
      // so the user can retry or cancel.
      setIsDeleting(false);
    }
  }, [onDelete]);

  return (
    <>
      {/* AC-MDU-004.1: Delete button / icon — red to signal danger */}
      <button
        onClick={handleOpenDialog}
        disabled={disabled || isDeleting}
        title={`Delete fork ${forkName}`}
        aria-label={`Delete fork ${forkName}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '28px',
          borderRadius: '6px',
          border: '1px solid rgba(239,68,68,0.3)',
          backgroundColor:
            disabled || isDeleting
              ? 'transparent'
              : 'rgba(239,68,68,0.08)',
          color:
            disabled || isDeleting ? '#555' : '#ef4444',
          cursor: disabled || isDeleting ? 'not-allowed' : 'pointer',
          fontSize: '14px',
          transition: 'background-color 0.15s, color 0.15s',
          padding: 0,
          flexShrink: 0,
        }}
      >
        {isDeleting ? (
          /* Spinner while deletion is in-flight — AC-MDU-004.4 */
          <span
            style={{
              display: 'inline-block',
              width: '12px',
              height: '12px',
              border: '2px solid rgba(239,68,68,0.3)',
              borderTopColor: '#ef4444',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
            aria-hidden="true"
          />
        ) : (
          /* Trash icon */
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1.75 3.5h10.5" />
            <path d="M5.25 3.5V2.333a.583.583 0 0 1 .583-.583h2.334a.583.583 0 0 1 .583.583V3.5" />
            <path d="M2.917 3.5l.583 8.167h7l.583-8.167" />
            <path d="M5.25 6.417v3.5M8.75 6.417v3.5" />
          </svg>
        )}
      </button>

      {/* AC-MDU-004.2: Confirmation dialog */}
      <ConfirmDialog
        isOpen={dialogOpen}
        title="Delete Fork"
        message={`Are you sure you want to delete fork '${forkName}'? All blockchain state will be permanently lost.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={isDeleting}
      />
    </>
  );
}
