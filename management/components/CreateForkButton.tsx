/**
 * CreateForkButton component
 *
 * "Create Fork" trigger button that opens the CreateForkModal and shows
 * a success notification (with a link) after a fork has been created.
 *
 * AC-MDU-002.1: "Create Fork" button that opens the form when clicked.
 * AC-MDU-002.6: Success message with link to new fork's dashboard.
 */

'use client';

import { useState, useCallback } from 'react';
import { CreateForkModal } from './CreateForkModal';

interface CreateForkButtonProps {
  /** Called after successful fork creation so the list can be refreshed */
  onForkCreated: () => void;
}

interface SuccessNotification {
  name: string;
  dashboardUrl: string;
}

export function CreateForkButton({ onForkCreated }: CreateForkButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [notification, setNotification] = useState<SuccessNotification | null>(null);

  const handleOpen = useCallback(() => {
    setModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleSuccess = useCallback(
    (forkName: string, dashboardUrl: string) => {
      setModalOpen(false);
      // AC-MDU-002.6: Show success notification with link
      setNotification({ name: forkName, dashboardUrl });
      // Auto-dismiss after 8 seconds
      setTimeout(() => setNotification(null), 8_000);
      // Refresh the fork list
      onForkCreated();
    },
    [onForkCreated]
  );

  const dismissNotification = useCallback(() => setNotification(null), []);

  return (
    <>
      {/* AC-MDU-002.1: Create Fork button */}
      <button
        onClick={handleOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          backgroundColor: '#2563eb',
          color: '#fff',
          fontSize: '14px',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2563eb';
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '16px', lineHeight: 1 }}>
          +
        </span>
        Create Fork
      </button>

      {/* Modal */}
      {modalOpen && (
        <CreateForkModal onClose={handleClose} onSuccess={handleSuccess} />
      )}

      {/* AC-MDU-002.6: Success notification toast */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(34,197,94,0.3)',
            backgroundColor: 'rgba(34,197,94,0.08)',
            color: '#ededed',
            fontSize: '14px',
            maxWidth: '380px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          {/* Success icon */}
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34,197,94,0.2)',
              color: '#22c55e',
              fontSize: '12px',
              fontWeight: 700,
              flexShrink: 0,
              marginTop: '1px',
            }}
          >
            ✓
          </span>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontWeight: 500 }}>
              Fork &lsquo;{notification.name}&rsquo; created successfully
            </span>
            {notification.dashboardUrl && (
              <a
                href={notification.dashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '13px',
                  color: '#3b82f6',
                  textDecoration: 'none',
                }}
              >
                Open dashboard →
              </a>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissNotification}
            aria-label="Dismiss notification"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#666',
              fontSize: '12px',
              cursor: 'pointer',
              flexShrink: 0,
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}
