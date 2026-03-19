/**
 * ConfirmDialog component
 *
 * A reusable modal dialog for confirming destructive actions.
 *
 * AC-MDU-004.2: Display confirmation dialog with warning message.
 * AC-MDU-004.3: Include "Delete" and "Cancel" buttons.
 * AC-MDU-004.7: Closing without confirming takes no action.
 */

'use client';

import { useEffect, useCallback } from 'react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmDialogProps) {
  // Close on Escape key — AC-MDU-004.7
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onCancel();
      }
    },
    [onCancel, isLoading]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    // Backdrop
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '16px',
      }}
      onClick={(e) => {
        // AC-MDU-004.7: Click outside closes dialog (cancel)
        if (e.target === e.currentTarget && !isLoading) {
          onCancel();
        }
      }}
    >
      {/* Dialog panel */}
      <div
        style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #2a2a2a',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '440px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Warning icon + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239,68,68,0.12)',
              color: '#ef4444',
              fontSize: '18px',
              flexShrink: 0,
            }}
            aria-hidden="true"
          >
            ⚠
          </span>
          <h2
            id="confirm-dialog-title"
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: '#ededed',
            }}
          >
            {title}
          </h2>
        </div>

        {/* Message */}
        <p
          id="confirm-dialog-message"
          style={{
            margin: 0,
            fontSize: '14px',
            color: '#aaa',
            lineHeight: '1.5',
          }}
        >
          {message}
        </p>

        {/* Actions — AC-MDU-004.3 */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '4px',
          }}
        >
          {/* Cancel button — AC-MDU-004.7 */}
          <button
            onClick={onCancel}
            disabled={isLoading}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              backgroundColor: '#1e1e1e',
              color: isLoading ? '#555' : '#aaa',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            {cancelLabel}
          </button>

          {/* Confirm (destructive) button */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(239,68,68,0.4)',
              backgroundColor: isLoading
                ? 'rgba(239,68,68,0.08)'
                : 'rgba(239,68,68,0.15)',
              color: isLoading ? '#ef444488' : '#ef4444',
              fontSize: '14px',
              fontWeight: 500,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.15s, color 0.15s',
            }}
          >
            {isLoading && (
              <span
                style={{
                  display: 'inline-block',
                  width: '12px',
                  height: '12px',
                  border: '2px solid rgba(239,68,68,0.3)',
                  borderTopColor: '#ef4444',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
