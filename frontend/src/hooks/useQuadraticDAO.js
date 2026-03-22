import {
  useAccount,
  useChainId,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseEther, formatEther } from "viem";
import { useState, useCallback } from "react";
import {
  CONTRACT_ADDRESSES,
  QUADRATIC_DAO_ABI,
  QUADRATIC_TOKEN_ABI,
} from "../config/contracts";

export function useContracts() {
  const chainId = useChainId();
  const addresses = CONTRACT_ADDRESSES[chainId] ?? CONTRACT_ADDRESSES[31337];
  return {
    daoAddress: addresses?.DAO,
    tokenAddress: addresses?.TOKEN,
  };
}

export function useTokenBalance() {
  const { address } = useAccount();
  const { tokenAddress } = useContracts();

  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: QUADRATIC_TOKEN_ABI,
    functionName: "balanceOf",
    args: [address],
    query: { enabled: !!address && !!tokenAddress },
  });

  return {
    balance: data ?? 0n,
    balanceFormatted: data ? parseFloat(formatEther(data)).toFixed(2) : "0.00",
    isLoading,
    refetch,
  };
}

export function useProposalCount() {
  const { daoAddress } = useContracts();

  const { data } = useReadContract({
    address: daoAddress,
    abi: QUADRATIC_DAO_ABI,
    functionName: "proposalCount",
    query: { enabled: !!daoAddress, refetchInterval: 10_000 },
  });

  return data ?? 0n;
}

export function useProposals() {
  const { daoAddress } = useContracts();
  const count = useProposalCount();
  const ids = Array.from({ length: Number(count) }, (_, i) => i + 1);

  const contracts = ids.map((id) => ({
    address: daoAddress,
    abi: QUADRATIC_DAO_ABI,
    functionName: "getProposal",
    args: [BigInt(id)],
  }));

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: {
      enabled: !!daoAddress && ids.length > 0,
      refetchInterval: 15_000,
    },
  });

  const proposals = (data ?? [])
    .filter((r) => r.status === "success")
    .map((r) => r.result)
    .filter((p) => p?.id > 0n)
    .reverse(); // newest first

  return { proposals, isLoading, refetch };
}

export function useVotesUsed(proposalId) {
  const { address } = useAccount();
  const { daoAddress } = useContracts();

  const { data } = useReadContract({
    address: daoAddress,
    abi: QUADRATIC_DAO_ABI,
    functionName: "votesUsed",
    args: [proposalId, address],
    query: { enabled: !!address && !!daoAddress && !!proposalId },
  });

  return data ?? 0n;
}

export function useCreateProposal() {
  const { daoAddress } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const create = useCallback(
    (title, description) => {
      writeContract({
        address: daoAddress,
        abi: QUADRATIC_DAO_ABI,
        functionName: "createProposal",
        args: [title, description],
      });
    },
    [writeContract, daoAddress]
  );

  return {
    create,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useCastVote() {
  const { daoAddress, tokenAddress } = useContracts();
  const { writeContract, data: hash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [step, setStep] = useState("idle"); // idle | approving | voting | done

  // Step 1: approve token spend
  const approve = useCallback(
    (votes) => {
      const cost = BigInt(votes) * BigInt(votes);
      const costWei = parseEther(cost.toString());
      setStep("approving");
      writeContract({
        address: tokenAddress,
        abi: QUADRATIC_TOKEN_ABI,
        functionName: "approve",
        args: [daoAddress, costWei],
      });
    },
    [writeContract, tokenAddress, daoAddress]
  );

  // Step 2: cast vote
  const castVote = useCallback(
    (proposalId, votes, support) => {
      setStep("voting");
      writeContract({
        address: daoAddress,
        abi: QUADRATIC_DAO_ABI,
        functionName: "castVote",
        args: [BigInt(proposalId), BigInt(votes), support],
      });
    },
    [writeContract, daoAddress]
  );

  const resetVote = useCallback(() => {
    setStep("idle");
    reset();
  }, [reset]);

  return {
    approve,
    castVote,
    step,
    setStep,
    isPending: isPending || isConfirming,
    isSuccess,
    error,
    hash,
    resetVote,
  };
}

export function useExecuteProposal() {
  const { daoAddress } = useContracts();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const execute = useCallback(
    (proposalId) => {
      writeContract({
        address: daoAddress,
        abi: QUADRATIC_DAO_ABI,
        functionName: "executeProposal",
        args: [BigInt(proposalId)],
      });
    },
    [writeContract, daoAddress]
  );

  return { execute, isPending: isPending || isConfirming, isSuccess, error };
}
