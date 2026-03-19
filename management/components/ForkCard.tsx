'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Fork } from '@/types/fork';
import StatusBadge from './StatusBadge';

interface ForkCardProps {
  fork: Fork;
}

const CHAIN_DISPLAY_NAMES: Record<string, string> = {
  'base-mainnet': 'Base Mainnet',
  'opt-mainnet': 'Optimism Mainnet',
  'eth-mainnet': 'Ethereum Mainnet',
  'arb-mainnet': 'Arbitrum One',
  'polygon-mainnet': 'Polygon Mainnet',
  'zksync-mainnet': 'zkSync Era',
};

function getChainDisplayName(chain: string): string {
  return CHAIN_DISPLAY_NAMES[chain] ?? chain;
}

function getRelativeTime(isoTimestamp: string): string {
  try {
    return formatDistanceToNow(new Date(isoTimestamp), { addSuffix: true });
  } catch {
    return isoTimestamp;
  }
}

export default function ForkCard({ fork }: ForkCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopyRpc() {
    navigator.clipboard.writeText(fork.rpcUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: '0.25rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fork.name}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>
            {getChainDisplayName(fork.chain)}
          </span>
        </div>
        <StatusBadge status={fork.status} errorMessage={fork.errorMessage} />
      </div>

      {/* Created timestamp */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
        Created {getRelativeTime(fork.createdAt)}
      </div>

      {/* URLs */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {/* Dashboard URL */}
        <div
          style={{
            background: 'var(--surface2)',
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
            }}
          >
            Dashboard
          </div>
          <a
            href={fork.dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: '0.8rem',
              color: 'var(--accent)',
              textDecoration: 'none',
              wordBreak: 'break-all',
              display: 'block',
            }}
          >
            {fork.dashboardUrl}
          </a>
        </div>

        {/* RPC URL */}
        <div
          style={{
            background: 'var(--surface2)',
            borderRadius: '8px',
            padding: '0.6rem 0.75rem',
          }}
        >
          <div
            style={{
              fontSize: '0.7rem',
              color: 'var(--text2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem',
            }}
          >
            RPC Endpoint
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: '0.8rem',
                color: 'var(--text)',
                wordBreak: 'break-all',
                flex: 1,
                minWidth: 0,
              }}
            >
              {fork.rpcUrl}
            </span>
            <button
              onClick={handleCopyRpc}
              title="Copy RPC URL"
              style={{
                background: 'none',
                border: `1px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
                color: copied ? 'var(--green)' : 'var(--text2)',
                borderRadius: '4px',
                padding: '0.15rem 0.5rem',
                cursor: 'pointer',
                fontSize: '0.7rem',
                flexShrink: 0,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ copied' : 'copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
