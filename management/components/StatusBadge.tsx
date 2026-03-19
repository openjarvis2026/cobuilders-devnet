'use client';

import { ForkStatus } from '@/types/fork';

interface StatusBadgeProps {
  status: ForkStatus;
  errorMessage?: string;
}

const statusConfig: Record<
  ForkStatus,
  { label: string; bgColor: string; textColor: string; dotColor: string }
> = {
  deploying: {
    label: 'Deploying',
    bgColor: 'rgba(245, 158, 11, 0.15)',
    textColor: '#f59e0b',
    dotColor: '#f59e0b',
  },
  active: {
    label: 'Active',
    bgColor: 'rgba(34, 197, 94, 0.15)',
    textColor: '#22c55e',
    dotColor: '#22c55e',
  },
  failed: {
    label: 'Failed',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    textColor: '#ef4444',
    dotColor: '#ef4444',
  },
};

export default function StatusBadge({ status, errorMessage }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      title={status === 'failed' && errorMessage ? errorMessage : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        background: config.bgColor,
        color: config.textColor,
        fontSize: '0.75rem',
        fontWeight: 600,
        border: `1px solid ${config.dotColor}33`,
        cursor: status === 'failed' && errorMessage ? 'help' : 'default',
      }}
    >
      {status === 'deploying' && <Spinner color={config.dotColor} />}
      {status === 'active' && (
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: config.dotColor,
            flexShrink: 0,
          }}
        />
      )}
      {status === 'failed' && (
        <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>✕</span>
      )}
      {config.label}
    </span>
  );
}

function Spinner({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        border: `2px solid ${color}33`,
        borderTopColor: color,
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  );
}
