import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { useTokenBalance } from "../hooks/useQuadraticDAO";

const CHAIN_NAMES = {
  31337: "Hardhat",
  11155111: "Sepolia",
  1: "Mainnet",
};

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { balanceFormatted } = useTokenBalance();

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-xs text-gray-400">{CHAIN_NAMES[chainId] ?? `Chain ${chainId}`}</span>
          <span className="text-sm font-semibold text-brand-400">{balanceFormatted} QTK</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
          <span className="text-sm font-mono text-gray-300">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="btn-secondary text-sm px-4 py-2"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.slice(0, 2).map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={isPending}
          className="btn-primary text-sm px-5 py-2"
        >
          {isPending ? "Connecting…" : connector.name === "Injected" ? "MetaMask" : connector.name}
        </button>
      ))}
    </div>
  );
}
