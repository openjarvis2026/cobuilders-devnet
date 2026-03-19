/**
 * ChainSelector component
 *
 * Dropdown selector for supported blockchain networks.
 *
 * AC-MDU-002.3: Chain selection with options for all supported chains.
 * AC-FM-006.1: Surface all supported chain identifiers.
 */

'use client';

export const CHAINS = [
  { value: 'base-mainnet', label: 'Base Mainnet' },
  { value: 'opt-mainnet', label: 'Optimism Mainnet' },
  { value: 'eth-mainnet', label: 'Ethereum Mainnet' },
  { value: 'arb-mainnet', label: 'Arbitrum One' },
  { value: 'polygon-mainnet', label: 'Polygon Mainnet' },
  { value: 'zksync-mainnet', label: 'zkSync Era' },
] as const;

export type ChainValue = (typeof CHAINS)[number]['value'];

interface ChainSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}

export function ChainSelector({
  value,
  onChange,
  disabled = false,
  id,
}: ChainSelectorProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        width: '100%',
        padding: '8px 12px',
        borderRadius: '8px',
        border: '1px solid #2a2a2a',
        backgroundColor: disabled ? '#141414' : '#1e1e1e',
        color: disabled ? '#555' : '#ededed',
        fontSize: '14px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        appearance: 'none',
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 12px center',
        paddingRight: '32px',
      }}
    >
      {CHAINS.map((chain) => (
        <option key={chain.value} value={chain.value}>
          {chain.label}
        </option>
      ))}
    </select>
  );
}
