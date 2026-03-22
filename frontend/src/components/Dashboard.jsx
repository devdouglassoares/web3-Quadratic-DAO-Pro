import { useAccount } from "wagmi";
import { useProposals, useProposalCount, useTokenBalance } from "../hooks/useQuadraticDAO";
import { ProposalCard } from "./ProposalCard";
import { CreateProposal } from "./CreateProposal";

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="card flex-1">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent ?? "text-white"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card text-center py-16">
      <div className="w-16 h-16 bg-brand-950 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">No proposals yet</h3>
      <p className="text-sm text-gray-400">Be the first to create a governance proposal.</p>
    </div>
  );
}

export function Dashboard() {
  const { isConnected } = useAccount();
  const { proposals, isLoading, refetch } = useProposals();
  const count = useProposalCount();
  const { balanceFormatted } = useTokenBalance();

  const active = proposals.filter((p) => {
    const now = Date.now() / 1000;
    return !p.executed && now >= Number(p.startTime) && now <= Number(p.endTime);
  });
  const executed = proposals.filter((p) => p.executed);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <StatCard
          label="Total Proposals"
          value={count.toString()}
          sub="all time"
          accent="text-white"
        />
        <StatCard
          label="Active Votes"
          value={active.length}
          sub="closing in 7d window"
          accent="text-emerald-400"
        />
        <StatCard
          label="Finalized"
          value={executed.length}
          sub="proposals executed"
          accent="text-brand-400"
        />
        {isConnected && (
          <StatCard
            label="Your Balance"
            value={`${balanceFormatted}`}
            sub="QTK tokens"
            accent="text-yellow-400"
          />
        )}
      </div>

      {/* Create proposal */}
      <div className="space-y-4">
        <CreateProposal onSuccess={refetch} />
      </div>

      {/* Proposal list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">
            Proposals
            {proposals.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-400">({proposals.length})</span>
            )}
          </h2>
          <button
            onClick={refetch}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-1/4 mb-3" />
                <div className="h-6 bg-gray-800 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-800 rounded w-full mb-4" />
                <div className="h-2 bg-gray-800 rounded w-full" />
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id.toString()}
                proposal={proposal}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quadratic Voting explainer */}
      <div className="card border-brand-900/50 bg-brand-950/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-brand-900/50 rounded-xl flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">How Quadratic Voting Works</h3>
            <p className="text-sm text-gray-400 leading-relaxed">
              The cost to cast <strong className="text-gray-200">N votes</strong> is{" "}
              <strong className="text-brand-400">N² tokens</strong>. This prevents "whale"
              domination: spending 100× more tokens only gives 10× more votes (√100 = 10).
              Every voice matters — not just the largest wallets.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-mono">
              {[1, 3, 5, 10, 20].map((v) => (
                <span key={v} className="px-2 py-1 bg-gray-800 rounded-lg text-gray-300">
                  {v} votes = {v * v} QTK
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
