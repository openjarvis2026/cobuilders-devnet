import { defineChain } from "viem";

/**
 * CoBuilders Devnet chain definition.
 * The actual RPC transport is configured in wagmiConfig.tsx:
 * - SSR (server): http://127.0.0.1:8545 (direct to Anvil)
 * - Browser: /rpc (nginx proxies to Anvil)
 */
export const cobuildersDevnet = defineChain({
  id: 13370,
  name: "CoBuilders Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});
