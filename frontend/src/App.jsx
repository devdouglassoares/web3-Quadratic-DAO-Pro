import { WagmiProvider } from "wagmi";
import { QueryClientProvider } from "@tanstack/react-query";
import { config, queryClient } from "./config/wagmi";
import { ConnectWallet } from "./components/ConnectWallet";
import { Dashboard } from "./components/Dashboard";

function Header() {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 6l9-3 9 3v6c0 5.25-3.75 10.125-9 11.25C6.75 22.125 3 17.25 3 12V6z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">QuadraticDAO</h1>
            <p className="text-xs text-brand-400 font-medium leading-none mt-0.5">Pro</p>
          </div>
        </div>
        <ConnectWallet />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-brand-950/40 to-transparent py-16 px-4 text-center">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
      </div>
      <div className="relative max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-700/50 text-brand-400 text-xs font-medium mb-4">
          <span className="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse" />
          Democratic On-Chain Governance
        </div>
        <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight">
          Where Every Voice
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">
            Has Equal Power
          </span>
        </h2>
        <p className="text-gray-400 text-lg leading-relaxed">
          Quadratic voting ensures fair governance — spending 100× more tokens only gives 10× more
          votes. No whales, no plutocracy.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gray-950">
          <Header />
          <Hero />
          <main className="px-4 sm:px-6 pb-20">
            <Dashboard />
          </main>
          <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
            QuadraticDAO Pro — Built with Solidity, React, Wagmi & OpenZeppelin
          </footer>
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
