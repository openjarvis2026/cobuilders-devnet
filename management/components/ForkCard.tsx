/**
 * ForkCard component
 *
 * Displays metadata for a single fork deployment in a card layout.
 *
 * AC-MDU-001.2: Display fork name, chain, creation time, status, dashboard URL,
 *               and RPC URL with a copy button.
 */

'use client';

import { useState, useCallback } from 'react';
import { StatusBadge } from './StatusBadge';
import type { ForkListItem } from '@/lib/types';

const CHAIN_LABELS: Record<string, string> = {
  'base-mainnet': 'Base Mainnet',
  'opt-mainnet': 'Optimism Mainnet',
  'eth-mainnet': 'Ethereum Mainnet',
  'arb-mainnet': 'Arbitrum One',
  'polygon-mainnet': 'Polygon Mainnet',
  'zksync-mainnet': 'zkSync Era',
};

function getChainLabel(chain: string): string {
  return CHAIN_LABELS[chain] ?? chain;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

interface ForkCardProps {
  fork: ForkListItem;
}

export function ForkCard({ fork }: ForkCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyRpc = useCallback(async () => {
    if (!fork.rpcUrl) return;
    try {
      await navigator.clipboard.writeText(fork.rpcUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments without clipboard API
    }
  }, [fork.rpcUrl]);

  return (
    <article
      style={{
        backgroundColor: '#141414',
        border: '1px solid #2a2a2a',
        borderRadius: '12px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Header: name + status */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}
      >
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#ededed',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
          title={fork.name}
        >
          {fork.name}
        </h2>
        <StatusBadge status={fork.status} />
      </div>

      {/* Metadata: chain + creation time */}
      <dl
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          margin: 0,
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <dt
            style={{
              fontSize: '12px',
              color: '#666',
              minWidth: '60px',
              flexShrink: 0,
            }}
          >
            Chain
          </dt>
          <dd
            style={{
              fontSize: '13px',
              color: '#aaa',
              margin: 0,
            }}
          >
            {getChainLabel(fork.chain)}
          </dd>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <dt
            style={{
              fontSize: '12px',
              color: '#666',
              minWidth: '60px',
              flexShrink: 0,
            }}
          >
            Created
          </dt>
          <dd
            style={{ fontSize: '13px', color: '#aaa', margin: 0 }}
            title={new Date(fork.createdAt).toLocaleString()}
          >
            {formatRelativeTime(fork.createdAt)}
          </dd>
        </div>
      </dl>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid #2a2a2a', margin: 0 }} />

      {/* Links: dashboard + RPC */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Dashboard URL */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#666', minWidth: '60px', flexShrink: 0 }}>
            Dashboard
          </span>
          {fork.dashboardUrl ? (
            <a
              href={fork.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '13px',
                color: '#3b82f6',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
                textDecoration: 'none',
                padding: '4px 0',
              }}
              title={fork.dashboardUrl}
            >
              {fork.dashboardUrl.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span style={{ fontSize: '13px', color: '#555' }}>—</span>
          )}
        </div>

        {/* RPC URL with copy button */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#666', minWidth: '60px', flexShrink: 0 }}>
            RPC
          </span>
          {fork.rpcUrl ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1,
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontSize: '13px',
                  color: '#aaa',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                  fontFamily: 'var(--font-geist-mono, monospace)',
                }}
                title={fork.rpcUrl}
              >
                {fork.rpcUrl.replace(/^https?:\/\//, '')}
              </span>
              <button
                onClick={handleCopyRpc}
                title="Copy RPC URL"
                aria-label="Copy RPC URL"
                style={{
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  border: '1px solid #2a2a2a',
                  backgroundColor: copied ? 'rgba(34,197,94,0.12)' : '#1e1e1e',
                  color: copied ? '#22c55e' : '#888',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'background-color 0.15s, color 0.15s',
                  padding: 0,
                }}
              >
                {copied ? '✓' : '⎘'}
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '13px', color: '#555' }}>—</span>
          )}
        </div>
      </div>
    </article>
  );
}
