import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCastVote, useTokenBalance, useVotesUsed } from "../hooks/useQuadraticDAO";

const MAX_VOTES = 100;

export function VoteModal({ proposal, onClose, onSuccess }) {
  const { isConnected } = useAccount();
  const { balance, balanceFormatted } = useTokenBalance();
  const { approve, castVote, step, setStep, isPending, isSuccess, error, resetVote } =
    useCastVote();
  const votesUsed = useVotesUsed(proposal.id);

  const [votes, setVotes] = useState(1);
  const [support, setSupport] = useState(null); // null | true | false

  const cost = votes * votes; // in QTK
  const costWei = BigInt(cost) * BigInt(10 ** 18);
  const hasEnough = balance >= costWei;
  const alreadyVoted = votesUsed > 0n;

  // Gradient fill for range slider
  const sliderPercent = ((votes - 1) / (MAX_VOTES - 1)) * 100;

  useEffect(() => {
    if (isSuccess) {
      if (step === "approving") {
        // Proceed to vote after approval confirmed
        castVote(proposal.id, votes, support);
      } else if (step === "voting") {
        onSuccess?.();
        onClose();
      }
    }
  }, [isSuccess, step]);

  const handleVote = () => {
    if (support === null) return;
    setStep("idle");
    approve(votes);
  };

  const isNowActive =
    Date.now() / 1000 >= Number(proposal.startTime) &&
    Date.now() / 1000 <= Number(proposal.endTime);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">Cast Your Vote</h2>
            <p className="text-sm text-gray-400 line-clamp-2">{proposal.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors shrink-0 ml-4"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {alreadyVoted && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
            <p className="text-sm text-yellow-400">
              You've already cast {votesUsed.toString()} vote(s) on this proposal.
              Additional votes accumulate with previous ones.
            </p>
          </div>
        )}

        {/* Support selector */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-300 mb-3">Vote Direction</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSupport(true)}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold transition-all duration-200 ${
                support === true
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                  : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Vote FOR
            </button>
            <button
              onClick={() => setSupport(false)}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-semibold transition-all duration-200 ${
                support === false
                  ? "border-red-500 bg-red-500/20 text-red-400"
                  : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600"
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Vote AGAINST
            </button>
          </div>
        </div>

        {/* Vote slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-300">Number of Votes</p>
            <span className="text-2xl font-bold text-brand-400">{votes}</span>
          </div>

          <div className="relative mb-2">
            <input
              type="range"
              min={1}
              max={MAX_VOTES}
              value={votes}
              onChange={(e) => setVotes(Number(e.target.value))}
              className="w-full"
              style={{
                background: `linear-gradient(to right, #7c3aed ${sliderPercent}%, #374151 ${sliderPercent}%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>1 vote</span>
            <span>100 votes</span>
          </div>
        </div>

        {/* Cost display */}
        <div className="mb-6 p-4 bg-gray-800/50 rounded-xl border border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Quadratic Cost</span>
            <span className={`text-lg font-bold ${hasEnough ? "text-white" : "text-red-400"}`}>
              {cost} QTK
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Your Balance</span>
            <span className="text-sm text-gray-300">{balanceFormatted} QTK</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              Formula:{" "}
              <span className="font-mono text-brand-400">
                cost = {votes}² = {cost} QTK
              </span>
            </p>
          </div>
          {!hasEnough && (
            <p className="mt-2 text-xs text-red-400">
              Insufficient balance. You need {cost} QTK but have {balanceFormatted} QTK.
            </p>
          )}
        </div>

        {/* Step indicator */}
        {(step === "approving" || step === "voting") && (
          <div className="mb-4 p-3 bg-brand-950/50 border border-brand-800/50 rounded-xl">
            <p className="text-sm text-brand-300">
              {step === "approving" ? "Step 1/2: Approving token spend…" : "Step 2/2: Casting vote…"}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error.shortMessage ?? error.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleVote}
            disabled={isPending || support === null || !hasEnough || !isConnected || !isNowActive}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {step === "approving" ? "Approving…" : "Voting…"}
              </>
            ) : (
              `Vote (${cost} QTK)`
            )}
          </button>
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
