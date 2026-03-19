'use client';

import { useForks } from '@/hooks/useForks';
import ForkCard from '@/components/ForkCard';

export default function HomePage() {
  const { forks, loading, error, refresh } = useForks();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text)',
        padding: '2rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: 'var(--text)',
                marginBottom: '0.25rem',
              }}
            >
              ⛓️{' '}
              <span style={{ color: 'var(--accent)' }}>CoBuilders</span> —
              Fork Manager
            </h1>
            <p style={{ color: 'var(--text2)', fontSize: '0.95rem' }}>
              Manage your Anvil fork environments
            </p>
          </div>

          <button
            onClick={refresh}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: loading ? 'var(--text2)' : 'var(--text)',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'background 0.2s, border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.borderColor =
                  'var(--accent)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor =
                'var(--border)';
            }}
          >
            <RefreshIcon spinning={loading} />
            Refresh
          </button>
        </div>

        {/* Content */}
        {error ? (
          <ErrorMessage message={error} />
        ) : loading && forks.length === 0 ? (
          <LoadingState />
        ) : forks.length === 0 ? (
          <EmptyState />
        ) : (
          <ForkGrid forks={forks} />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        animation: spinning ? 'spin 1s linear infinite' : 'none',
        flexShrink: 0,
      }}
    >
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3.87" />
    </svg>
  );
}

function LoadingState() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '1.25rem',
            height: '220px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(90deg, transparent 0%, var(--surface2) 50%, transparent 100%)',
              animation: 'shimmer 1.5s infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: '4rem 2rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪣</div>
      <p
        style={{
          color: 'var(--text2)',
          fontSize: '1rem',
          maxWidth: '400px',
          margin: '0 auto',
        }}
      >
        No forks yet. Create your first fork to get started.
      </p>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      style={{
        padding: '1rem 1.25rem',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        color: 'var(--red)',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <span>⚠️</span>
      <span>{message}</span>
    </div>
  );
}

function ForkGrid({ forks }: { forks: ReturnType<typeof useForks>['forks'] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '1.25rem',
      }}
    >
      {forks.map((fork) => (
        <ForkCard key={fork.id} fork={fork} />
      ))}
    </div>
  );
}
