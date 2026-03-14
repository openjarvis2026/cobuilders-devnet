import { cobuildersDevnet } from "~~/utils/scaffold-eth/cobuildersChain";

export type ScaffoldConfig = {
  targetNetworks: readonly any[];
  pollingInterval: number;
  alchemyApiKey: string;
  rpcOverrides?: Record<number, string>;
  walletConnectProjectId: string;
  burnerWalletMode: "localNetworksOnly" | "allNetworks" | "disabled";
};

export const DEFAULT_ALCHEMY_API_KEY = "demo";

const scaffoldConfig = {
  targetNetworks: [cobuildersDevnet],

  pollingInterval: 3000,

  alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || DEFAULT_ALCHEMY_API_KEY,

  // Override RPC to use local Anvil directly (works for SSR)
  // Browser requests also work via this since nginx proxies the public URL
  rpcOverrides: {
    [cobuildersDevnet.id]: "http://127.0.0.1:8545",
  },

  walletConnectProjectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "3a8170812b534d0ff9d794f19a901d64",

  burnerWalletMode: "allNetworks",
} as const satisfies ScaffoldConfig;

export default scaffoldConfig;
