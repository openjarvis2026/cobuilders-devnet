import { defineChain } from "viem";

/**
 * CoBuilders Devnet — uses chain ID 31337 (same as hardhat/anvil default)
 * so SE-2 components treat it as a local dev chain.
 * RPC is served via /rpc (nginx proxy to Anvil).
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
      http: ["http://127.0.0.1:8545"],
    },
  },
  testnet: true,
});
