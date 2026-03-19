/**
 * StatusBadge component
 *
 * Displays a colored status badge for a fork deployment.
 *
 * AC-MDU-006.1: Status badge with Deploying (orange), Active (green), Failed (red).
 * AC-MDU-006.2: Spinner for Deploying state.
 * AC-MDU-006.3: Error icon for Failed state.
 */

'use client';

import type { ForkStatus } from '@/lib/types';

interface StatusBadgeProps {
  status: ForkStatus;
}

const STATUS_CONFIG: Record<
  ForkStatus,
  { label: string; color: string; bg: string }
> = {
  active: { label: 'Active', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  deploying: {
    label: 'Deploying',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.12)',
  },
  failed: { label: 'Failed', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}33`,
        whiteSpace: 'nowrap',
      }}
      title={status === 'failed' ? 'Deployment failed' : undefined}
    >
      {/* AC-MDU-006.2: Spinner for deploying state */}
      {status === 'deploying' && (
        <span
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            border: `2px solid ${config.color}44`,
            borderTopColor: config.color,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
          aria-hidden="true"
        />
      )}
      {/* AC-MDU-006.3: Error icon for failed state */}
      {status === 'failed' && (
        <span
          style={{
            fontSize: '11px',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          ✕
        </span>
      )}
      {/* Active dot */}
      {status === 'active' && (
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: config.color,
          }}
          aria-hidden="true"
        />
      )}
      {config.label}
    </span>
  );
}
