import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useCreateProposal, useTokenBalance } from "../hooks/useQuadraticDAO";
import { parseEther } from "viem";

const MIN_THRESHOLD = parseEther("100");

export function CreateProposal({ onSuccess }) {
  const { isConnected } = useAccount();
  const { balance } = useTokenBalance();
  const { create, isPending, isSuccess, error } = useCreateProposal();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      setTitle("");
      setDescription("");
      setShowForm(false);
      onSuccess?.();
    }
  }, [isSuccess, onSuccess]);

  const canPropose = isConnected && balance >= MIN_THRESHOLD;

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        disabled={!canPropose}
        className="btn-primary w-full sm:w-auto flex items-center gap-2"
        title={!isConnected ? "Connect wallet first" : !canPropose ? "You need ≥100 QTK to propose" : ""}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        New Proposal
      </button>
    );
  }

  return (
    <div className="card animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Create Proposal</h2>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title <span className="text-brand-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Increase treasury allocation for development"
            className="input-field"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description <span className="text-brand-400">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the proposal in detail. What problem does it solve? What is the expected outcome?"
            className="input-field resize-none"
            rows={5}
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/2000</p>
        </div>

        <div className="flex items-center gap-2 p-3 bg-brand-950/50 border border-brand-800/50 rounded-xl">
          <svg className="w-4 h-4 text-brand-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-brand-300">
            Requires ≥100 QTK balance. Voting period is 7 days after creation.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-sm text-red-400">{error.shortMessage ?? error.message}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => create(title, description)}
            disabled={isPending || !title.trim() || !description.trim()}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </>
            ) : (
              "Submit Proposal"
            )}
          </button>
          <button onClick={() => setShowForm(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
