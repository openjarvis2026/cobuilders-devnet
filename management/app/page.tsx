"use client";

import { useState, useCallback } from "react";
import CreateForkButton from "@/components/CreateForkButton";
import { type Fork } from "@/lib/types";

interface SuccessNotification {
  fork: Fork;
}

export default function ManagementDashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [successNotification, setSuccessNotification] =
    useState<SuccessNotification | null>(null);

  const handleForkCreated = useCallback((fork: Fork) => {
    // Refresh the fork list
    setRefreshKey((k) => k + 1);
    // Show success notification
    setSuccessNotification({ fork });
    // Auto-dismiss after 8 seconds
    setTimeout(() => setSuccessNotification(null), 8000);
  }, []);

  const dismissNotification = () => setSuccessNotification(null);

  return (
    <>
      {/* Header */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "1rem 0",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="container"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>⛓️</span>
            <div>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text)",
                }}
              >
                <span style={{ color: "var(--accent)" }}>CoBuilders</span> Fork
                Management
              </h1>
              <p style={{ fontSize: "0.75rem", color: "var(--text2)" }}>
                Spin up persistent Anvil forks for development &amp; testing
              </p>
            </div>
          </div>

          {/* Create Fork Button — AC-MDU-002.1 */}
          <CreateForkButton onForkCreated={handleForkCreated} />
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "2rem 0" }}>
        <div className="container">
          {/* Success Notification — AC-MDU-002.6 */}
          {successNotification && (
            <div
              role="status"
              aria-live="polite"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "10px",
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <div>
                <p
                  style={{
                    color: "var(--green)",
                    fontWeight: 600,
                    marginBottom: "0.25rem",
                  }}
                >
                  ✅ Fork &apos;{successNotification.fork.name}&apos; created
                  successfully
                </p>
                {successNotification.fork.dashboardUrl && (
                  <p style={{ fontSize: "0.875rem", color: "var(--text2)" }}>
                    <a
                      href={successNotification.fork.dashboardUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--accent)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      Open fork dashboard →
                    </a>
                  </p>
                )}
              </div>
              <button
                onClick={dismissNotification}
                aria-label="Dismiss notification"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text2)",
                  cursor: "pointer",
                  fontSize: "1.125rem",
                  lineHeight: 1,
                  padding: "0.125rem",
                  flexShrink: 0,
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Fork List Placeholder (implemented in WO-3) */}
          <div
            className="card"
            style={{ color: "var(--text2)", textAlign: "center", padding: "3rem" }}
            data-refresh-key={refreshKey}
          >
            <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>🍴</p>
            <p style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>
              No forks yet
            </p>
            <p style={{ fontSize: "0.875rem" }}>
              Click &ldquo;Create Fork&rdquo; in the header to spin up your first
              devnet.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "1.5rem 0",
          marginTop: "auto",
        }}
      >
        <div
          className="container"
          style={{
            textAlign: "center",
            color: "var(--text2)",
            fontSize: "0.8rem",
          }}
        >
          <p>
            <a
              href="https://github.com/CoBuilders-xyz/cobuilders-devnet"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              GitHub
            </a>{" "}
            · Built by{" "}
            <a
              href="https://cobuilders.xyz"
              style={{ color: "var(--accent)", textDecoration: "none" }}
            >
              CoBuilders
            </a>
          </p>
        </div>
      </footer>
    </>
  );
}
