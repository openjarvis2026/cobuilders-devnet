/**
 * CreateForkModal component
 *
 * Modal form for creating a new fork deployment. Handles client-side
 * validation, API submission, loading/error states, and success feedback.
 *
 * AC-MDU-002.2: Name input with placeholder and validation hint.
 * AC-MDU-002.3: Chain selector.
 * AC-MDU-002.4: Create and Cancel buttons.
 * AC-MDU-002.5: Loading indicator while fork is being created.
 * AC-MDU-002.6: Success message with link on successful creation.
 * AC-MDU-002.7: Error message with failure reason; keeps form open for retry.
 * AC-MDU-002.8: Cancel closes form without creating a fork.
 */

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChainSelector, CHAINS } from './ChainSelector';

interface CreateForkModalProps {
  /** Called when the modal should close (Cancel or backdrop click) */
  onClose: () => void;
  /** Called after a fork is successfully created so the list can refresh */
  onSuccess: (forkName: string, dashboardUrl: string) => void;
}

interface ApiSuccessResponse {
  id: string;
  name: string;
  chain: string;
  dashboardUrl: string;
  rpcUrl: string;
  status: string;
}

interface ApiErrorResponse {
  error: string;
  details?: string;
}

/** Client-side name validation — mirrors server validation (AC-MDU-002.2) */
function validateName(name: string): string | null {
  if (!name || name.length < 3 || name.length > 32) {
    return 'Fork name must be 3-32 characters';
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Only lowercase letters, numbers, and hyphens allowed';
  }
  return null;
}

export function CreateForkModal({ onClose, onSuccess }: CreateForkModalProps) {
  const [name, setName] = useState('');
  const [chain, setChain] = useState<string>(CHAINS[0].value);
  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input on mount
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, onClose]);

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    // Clear name error as user types
    if (nameError) {
      setNameError(validateName(value));
    }
  }, [nameError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // AC-MDU-002.5: Client-side validation before sending request
    const validationError = validateName(name);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setNameError(null);
    setSubmitError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/forks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, chain }),
      });

      if (response.ok) {
        const data: ApiSuccessResponse = await response.json();
        // AC-MDU-002.6: Close modal and notify parent of success
        onSuccess(data.name, data.dashboardUrl);
      } else {
        // AC-MDU-002.7: Display error message, keep form open for retry
        const data: ApiErrorResponse = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));
        setSubmitError(data.error ?? 'Fork creation failed');
      }
    } catch {
      setSubmitError('Network error — please check your connection and try again');
    } finally {
      setLoading(false);
    }
  }, [name, chain, onSuccess]);

  // Prevent backdrop click from closing while loading
  const handleBackdropClick = useCallback(() => {
    if (!loading) {
      onClose();
    }
  }, [loading, onClose]);

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-fork-title"
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: '24px',
      }}
    >
      {/* Modal panel */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2
            id="create-fork-title"
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: '#ededed',
              margin: 0,
            }}
          >
            Create Fork
          </h2>
          {/* AC-MDU-002.8: Cancel button (X) */}
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Cancel"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
              backgroundColor: 'transparent',
              color: '#888',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              padding: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Fork name field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="fork-name"
              style={{ fontSize: '13px', fontWeight: 500, color: '#aaa' }}
            >
              Fork Name
            </label>
            <input
              ref={nameInputRef}
              id="fork-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              disabled={loading}
              placeholder="e.g., staging-contracts"
              aria-describedby={nameError ? 'fork-name-error' : 'fork-name-hint'}
              aria-invalid={nameError ? 'true' : 'false'}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '8px',
                border: `1px solid ${nameError ? '#ef4444' : '#2a2a2a'}`,
                backgroundColor: loading ? '#141414' : '#1e1e1e',
                color: loading ? '#555' : '#ededed',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
              }}
            />
            {/* AC-MDU-002.2: Validation hint */}
            {!nameError && (
              <p
                id="fork-name-hint"
                style={{ fontSize: '12px', color: '#666', margin: 0 }}
              >
                3-32 characters, lowercase letters, numbers, hyphens only
              </p>
            )}
            {/* Inline name error */}
            {nameError && (
              <p
                id="fork-name-error"
                role="alert"
                style={{ fontSize: '12px', color: '#ef4444', margin: 0 }}
              >
                {nameError}
              </p>
            )}
          </div>

          {/* Chain selector field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              htmlFor="fork-chain"
              style={{ fontSize: '13px', fontWeight: 500, color: '#aaa' }}
            >
              Chain
            </label>
            {/* AC-MDU-002.3: Chain dropdown */}
            <ChainSelector
              id="fork-chain"
              value={chain}
              onChange={setChain}
              disabled={loading}
            />
          </div>

          {/* Submit error banner */}
          {submitError && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.08)',
                color: '#ef4444',
                fontSize: '13px',
              }}
            >
              <span aria-hidden="true" style={{ flexShrink: 0 }}>
                ⚠
              </span>
              {submitError}
            </div>
          )}

          {/* AC-MDU-002.4: Action buttons */}
          <div
            style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'flex-end',
              paddingTop: '4px',
            }}
          >
            {/* AC-MDU-002.8: Cancel button */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: '8px',
                border: '1px solid #2a2a2a',
                backgroundColor: 'transparent',
                color: loading ? '#555' : '#aaa',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s, color 0.15s',
              }}
            >
              Cancel
            </button>

            {/* AC-MDU-002.4 / AC-MDU-002.5: Create button with loading state */}
            <button
              type="submit"
              disabled={loading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: loading ? '#1a3a5c' : '#2563eb',
                color: loading ? '#6ba0d8' : '#fff',
                fontSize: '14px',
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
                minWidth: '90px',
                justifyContent: 'center',
              }}
            >
              {/* AC-MDU-002.5: Spinner during loading */}
              {loading && (
                <span
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    width: '12px',
                    height: '12px',
                    border: '2px solid rgba(107,160,216,0.3)',
                    borderTopColor: '#6ba0d8',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0,
                  }}
                />
              )}
              {loading ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
