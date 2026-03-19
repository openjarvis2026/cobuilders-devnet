'use client';

/**
 * CoBuilders Fork Management Dashboard
 *
 * Main page that displays all active fork deployments.
 *
 * AC-MDU-001.1: Fetch and display the fork list on load.
 * AC-MDU-001.3: Forks sorted newest first (handled by API).
 * AC-MDU-001.4: Empty state message.
 * AC-MDU-001.5: Error state message.
 * AC-MDU-001.6: Manual refresh button.
 * AC-MDU-007.1: Optimized for desktop/laptop (min 1024px).
 * AC-MDU-007.2: Grid layout collapsing to single column on narrow screens.
 * AC-MDU-007.3: Adequate sizing for mouse/trackpad interaction.
 */

import { useForks } from '@/hooks/useForks';
import { ForkCard } from '@/components/ForkCard';
import { CreateForkButton } from '@/components/CreateForkButton';

export default function Page() {
  const { forks, loading, error, refresh } = useForks();

  // Refresh the fork list after a new fork is created
  const handleForkCreated = refresh;

  return (
    <>
      {/* Spinner keyframe animation injected once */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0a',
          color: '#ededed',
          fontFamily: 'var(--font-geist-sans, Arial, Helvetica, sans-serif)',
        }}
      >
        {/* Header */}
        <header
          style={{
            borderBottom: '1px solid #1f1f1f',
            padding: '0 24px',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              height: '64px',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#ededed',
                  margin: 0,
                }}
              >
                CoBuilders Fork Management
              </h1>
              <p
                style={{
                  fontSize: '13px',
                  color: '#666',
                  margin: 0,
                }}
              >
                Manage Railway fork deployments
              </p>
            </div>

            {/* Header action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* AC-MDU-001.6: Manual refresh button */}
              <button
                onClick={refresh}
                disabled={loading}
                aria-label="Refresh fork list"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #2a2a2a',
                  backgroundColor: loading ? '#1a1a1a' : '#1e1e1e',
                  color: loading ? '#555' : '#aaa',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.15s, color 0.15s',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    animation: loading ? 'spin 0.8s linear infinite' : 'none',
                  }}
                  aria-hidden="true"
                >
                  ↻
                </span>
                Refresh
              </button>

              {/* AC-MDU-002.1: Create Fork button */}
              <CreateForkButton onForkCreated={handleForkCreated} />
            </div>
          </div>
        </header>

        {/* Main content */}
        <main
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '32px 24px',
          }}
        >
          {/* Loading skeleton */}
          {loading && forks.length === 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    backgroundColor: '#141414',
                    border: '1px solid #2a2a2a',
                    borderRadius: '12px',
                    padding: '20px',
                    height: '200px',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                  aria-hidden="true"
                />
              ))}
            </div>
          )}

          {/* AC-MDU-001.5: Error state */}
          {error && !loading && (
            <div
              role="alert"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(239,68,68,0.3)',
                backgroundColor: 'rgba(239,68,68,0.08)',
                color: '#ef4444',
                fontSize: '14px',
              }}
            >
              <span style={{ fontSize: '16px' }} aria-hidden="true">
                ⚠
              </span>
              {error}
            </div>
          )}

          {/* AC-MDU-001.4: Empty state */}
          {!loading && !error && forks.length === 0 && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 24px',
                textAlign: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  backgroundColor: '#141414',
                  border: '1px solid #2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
                aria-hidden="true"
              >
                ⑂
              </div>
              <div>
                <p
                  style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#ededed',
                    margin: '0 0 8px',
                  }}
                >
                  No forks yet. Create your first fork to get started.
                </p>
                <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                  Fork deployments will appear here once created.
                </p>
              </div>
            </div>
          )}

          {/* AC-MDU-007.2: Responsive grid of fork cards */}
          {forks.length > 0 && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <p
                  style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: 0,
                  }}
                >
                  {forks.length} fork{forks.length !== 1 ? 's' : ''}
                </p>
                {forks.some((f) => f.status === 'deploying') && (
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#f59e0b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        width: '8px',
                        height: '8px',
                        border: '2px solid rgba(245,158,11,0.3)',
                        borderTopColor: '#f59e0b',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                      }}
                      aria-hidden="true"
                    />
                    Auto-refreshing every 10s
                  </span>
                )}
              </div>

              {/* AC-MDU-007.2: Grid collapsing to single column on narrow screens */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '16px',
                }}
              >
                {forks.map((fork) => (
                  <ForkCard key={fork.id} fork={fork} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
