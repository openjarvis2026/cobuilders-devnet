import { defineChain } from "viem";

/**
 * CoBuilders Devnet — Anvil fork chain.
 * Uses relative /rpc path so it works regardless of the deployment URL.
 * nginx proxies /rpc → Anvil on localhost:8545.
 */
export const cobuildersDevnet = defineChain({
  id: 31337,
  name: "CoBuilders Devnet",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["/rpc"],
    },
  },
  testnet: true,
});
