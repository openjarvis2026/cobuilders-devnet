"use client";

import { useState, useEffect, useRef } from "react";
import ChainSelector from "./ChainSelector";
import { validateForkName, CHAINS, type Fork } from "@/lib/types";

interface CreateForkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (fork: Fork) => void;
}

export default function CreateForkModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateForkModalProps) {
  const [name, setName] = useState("");
  const [chain, setChain] = useState(CHAINS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setChain(CHAINS[0].value);
      setNameError(null);
      setApiError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Clear errors when user types
  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError) setNameError(null);
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validationError = validateForkName(name);
    if (validationError) {
      setNameError(validationError);
      return;
    }

    setIsSubmitting(true);
    setApiError(null);

    try {
      const response = await fetch("/api/forks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, chain }),
      });

      const data = await response.json();

      if (!response.ok) {
        setApiError(data.error || "Failed to create fork");
        return;
      }

      onSuccess(data.fork);
      onClose();
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Network error. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay active"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-fork-title"
    >
      <div
        className="modal"
        style={{ textAlign: "left", maxWidth: "480px", width: "90%" }}
      >
        <h3
          id="create-fork-title"
          style={{ marginBottom: "1.25rem", fontSize: "1.25rem" }}
        >
          🍴 Create New Fork
        </h3>

        {/* API Error Banner */}
        {apiError && (
          <div
            role="alert"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              padding: "0.75rem 1rem",
              marginBottom: "1rem",
              fontSize: "0.875rem",
              color: "var(--red)",
            }}
          >
            ❌ {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Fork Name Field */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="fork-name"
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--text)",
                marginBottom: "0.5rem",
              }}
            >
              Fork Name
            </label>
            <input
              ref={nameInputRef}
              id="fork-name"
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., staging-contracts"
              disabled={isSubmitting}
              aria-describedby="fork-name-hint fork-name-error"
              aria-invalid={nameError ? "true" : "false"}
              style={{
                width: "100%",
                padding: "0.625rem 0.875rem",
                background: "var(--surface2)",
                color: "var(--text)",
                border: `1px solid ${nameError ? "var(--red)" : "var(--border)"}`,
                borderRadius: "8px",
                fontSize: "0.9375rem",
                outline: "none",
                opacity: isSubmitting ? 0.6 : 1,
              }}
            />
            <p
              id="fork-name-hint"
              style={{
                fontSize: "0.75rem",
                color: "var(--text2)",
                marginTop: "0.375rem",
              }}
            >
              3-32 characters, lowercase letters, numbers, hyphens only
            </p>
            {nameError && (
              <p
                id="fork-name-error"
                role="alert"
                style={{
                  fontSize: "0.75rem",
                  color: "var(--red)",
                  marginTop: "0.25rem",
                }}
              >
                {nameError}
              </p>
            )}
          </div>

          {/* Chain Selection */}
          <div style={{ marginBottom: "1.5rem" }}>
            <ChainSelector
              value={chain}
              onChange={setChain}
              disabled={isSubmitting}
            />
          </div>

          {/* Action Buttons */}
          <div
            className="modal-actions"
            style={{ justifyContent: "flex-end", gap: "0.75rem" }}
          >
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="btn"
              style={{
                background: "var(--surface2)",
                color: "var(--text)",
                opacity: isSubmitting ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name}
              className="btn"
              style={{
                background: "var(--accent)",
                color: "white",
                minWidth: "100px",
                opacity: isSubmitting || !name ? 0.5 : 1,
                cursor: isSubmitting || !name ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? (
                <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <LoadingSpinner />
                  Creating...
                </span>
              ) : (
                "Create"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        animation: "spin 0.8s linear infinite",
      }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
