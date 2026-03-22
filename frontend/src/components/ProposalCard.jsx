import { useState } from "react";
import { useAccount } from "wagmi";
import { useExecuteProposal } from "../hooks/useQuadraticDAO";
import { VoteModal } from "./VoteModal";

function ProposalStatus({ proposal }) {
  const now = Date.now() / 1000;
  const isActive = !proposal.executed && now >= Number(proposal.startTime) && now <= Number(proposal.endTime);
  const isEnded = now > Number(proposal.endTime) && !proposal.executed;

  if (proposal.executed) {
    return proposal.passed ? (
      <span className="badge-passed">Passed</span>
    ) : (
      <span className="badge-failed">Failed</span>
    );
  }
  if (isActive) return <span className="badge-active">Active</span>;
  if (isEnded) return <span className="badge-ended">Ended — Pending execution</span>;
  return <span className="badge-ended">Pending</span>;
}

function VoteBar({ forVotes, againstVotes }) {
  const total = Number(forVotes + againstVotes);
  if (total === 0) {
    return (
      <div className="h-2 bg-gray-700 rounded-full">
        <div className="h-2 bg-gray-600 rounded-full w-1/2" />
      </div>
    );
  }
  const forPct = (Number(forVotes) / total) * 100;
  return (
    <div className="h-2 bg-red-500/40 rounded-full overflow-hidden">
      <div
        className="h-2 bg-emerald-500 rounded-full transition-all duration-500"
        style={{ width: `${forPct}%` }}
      />
    </div>
  );
}

function TimeLeft({ endTime }) {
  const now = Date.now() / 1000;
  const diff = Number(endTime) - now;
  if (diff <= 0) return <span className="text-gray-500">Ended</span>;

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);

  if (days > 0) return <span>{days}d {hours}h left</span>;
  if (hours > 0) return <span>{hours}h {mins}m left</span>;
  return <span className="text-yellow-400">{mins}m left</span>;
}

export function ProposalCard({ proposal, onRefresh }) {
  const { isConnected } = useAccount();
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const { execute, isPending: isExecuting } = useExecuteProposal();

  const now = Date.now() / 1000;
  const isActive =
    !proposal.executed &&
    now >= Number(proposal.startTime) &&
    now <= Number(proposal.endTime);
  const canExecute = !proposal.executed && now > Number(proposal.endTime);

  const total = Number(proposal.forVotes + proposal.againstVotes);
  const forPct = total > 0 ? ((Number(proposal.forVotes) / total) * 100).toFixed(1) : "0.0";
  const againstPct = total > 0 ? ((Number(proposal.againstVotes) / total) * 100).toFixed(1) : "0.0";

  return (
    <>
      <div className="card hover:border-gray-700 transition-all duration-200 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-gray-500">#{proposal.id.toString()}</span>
              <ProposalStatus proposal={proposal} />
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">{proposal.title}</h3>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className={`text-sm text-gray-400 leading-relaxed ${!expanded && "line-clamp-2"}`}>
            {proposal.description}
          </p>
          {proposal.description.length > 120 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-brand-400 hover:text-brand-300 mt-1 transition-colors"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        {/* Vote bar */}
        <div className="mb-4">
          <VoteBar forVotes={proposal.forVotes} againstVotes={proposal.againstVotes} />
          <div className="flex justify-between mt-2 text-xs">
            <span className="text-emerald-400 font-medium">
              FOR: {proposal.forVotes.toString()} votes ({forPct}%)
            </span>
            <span className="text-red-400 font-medium">
              AGAINST: {proposal.againstVotes.toString()} votes ({againstPct}%)
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-mono">
              {proposal.proposer.slice(0, 6)}…{proposal.proposer.slice(-4)}
            </span>
            {" · "}
            <TimeLeft endTime={proposal.endTime} />
          </div>

          <div className="flex items-center gap-2">
            {canExecute && (
              <button
                onClick={() => execute(proposal.id).then(onRefresh)}
                disabled={isExecuting}
                className="btn-secondary text-sm px-4 py-2"
              >
                {isExecuting ? "Finalizing…" : "Finalize"}
              </button>
            )}
            {isActive && isConnected && (
              <button
                onClick={() => setShowVoteModal(true)}
                className="btn-primary text-sm px-4 py-2"
              >
                Vote
              </button>
            )}
          </div>
        </div>
      </div>

      {showVoteModal && (
        <VoteModal
          proposal={proposal}
          onClose={() => setShowVoteModal(false)}
          onSuccess={() => {
            setShowVoteModal(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
