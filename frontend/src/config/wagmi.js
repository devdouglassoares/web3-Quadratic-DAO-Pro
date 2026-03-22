import { createConfig, http } from "wagmi";
import { hardhat, sepolia, mainnet } from "wagmi/chains";
import { injected, metaMask, coinbaseWallet } from "wagmi/connectors";
import { QueryClient } from "@tanstack/react-query";

export const config = createConfig({
  chains: [hardhat, sepolia, mainnet],
  connectors: [
    injected(),
    metaMask(),
    coinbaseWallet({ appName: "QuadraticDAO Pro" }),
  ],
  transports: {
    [hardhat.id]: http("http://127.0.0.1:8545"),
    [sepolia.id]: http(),
    [mainnet.id]: http(),
  },
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000, // 15s
      gcTime: 300_000,   // 5min
      retry: 2,
    },
  },
});
