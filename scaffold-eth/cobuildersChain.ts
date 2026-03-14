import { defineChain } from "viem";

/**
 * CoBuilders Devnet chain definition.
 * __RPC_URL__ is replaced at container startup with the actual public URL.
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
      http: ["__RPC_URL__"],
    },
  },
  testnet: true,
});
