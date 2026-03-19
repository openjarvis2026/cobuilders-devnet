"use client";

import { CHAINS } from "@/lib/types";

interface ChainSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function ChainSelector({
  value,
  onChange,
  disabled = false,
}: ChainSelectorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <label
        htmlFor="chain-select"
        style={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: "var(--text)",
        }}
      >
        Chain
      </label>
      <select
        id="chain-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: "0.625rem 0.875rem",
          background: "var(--surface2)",
          color: "var(--text)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          fontSize: "0.9375rem",
          cursor: disabled ? "not-allowed" : "pointer",
          appearance: "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 0.875rem center",
          paddingRight: "2.5rem",
          opacity: disabled ? 0.6 : 1,
          width: "100%",
        }}
        aria-label="Select chain"
      >
        {CHAINS.map((chain) => (
          <option key={chain.value} value={chain.value}>
            {chain.label}
          </option>
        ))}
      </select>
    </div>
  );
}
