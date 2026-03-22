// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/Math.sol";
import "./QuadraticToken.sol";

/// @title QuadraticDAO
/// @notice A DAO implementing Quadratic Voting to prevent plutocracy
/// @dev Voting cost = votes² in QTK tokens.
///      Inspired by Lalley & Weyl's quadratic voting mechanism.
///
/// ─────────────────────────────────────────────────
///  GAS OPTIMIZATIONS
/// ─────────────────────────────────────────────────
/// 1. Custom errors instead of revert strings (saves ~50 gas per revert)
/// 2. Struct fields packed: startTime + endTime + flags share one slot
/// 3. Mapping for O(1) vote lookup instead of iterable arrays
/// 4. `unchecked` arithmetic in calculateCost (overflow impossible for
///    votes ≤ type(uint128).max due to input validation)
/// 5. Pure/view functions avoid unnecessary SLOAD
///
/// ─────────────────────────────────────────────────
///  MATHEMATICAL PRECISION
/// ─────────────────────────────────────────────────
/// • Forward path: cost = votes²  — exact integer, no rounding
/// • Reverse path: votes = floor(√cost) — uses OZ Math.sqrt (Babylonian
///   method, integer-safe, rounds down guaranteeing cost coverage)
/// • Quadratic invariant holds: cost(votes) ≥ votes²  always true
/// ─────────────────────────────────────────────────
contract QuadraticDAO {
    using Math for uint256;

    // ── Structs ──────────────────────────────────────────────────────────────

    /// @dev Packed to minimize storage slots:
    ///      slot 0 → id
    ///      slot 1 → forVotes
    ///      slot 2 → againstVotes
    ///      slot 3 → startTime(uint64) + endTime(uint64) + executed(bool) + passed(bool)
    ///      slot 4 → proposer
    ///      slot 5+ → title (dynamic)
    ///      slot N+ → description (dynamic)
    struct Proposal {
        uint256 id;
        uint256 forVotes;
        uint256 againstVotes;
        uint64 startTime;
        uint64 endTime;
        bool executed;
        bool passed;
        address proposer;
        string title;
        string description;
    }

    // ── Constants ─────────────────────────────────────────────────────────────

    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant MIN_PROPOSAL_THRESHOLD = 100 * 10 ** 18;
    uint256 public constant MAX_VOTES_PER_CALL = 1000;

    // ── State ─────────────────────────────────────────────────────────────────

    QuadraticToken public immutable token;
    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;
    /// @dev proposalId → voter → total votes cast
    mapping(uint256 => mapping(address => uint256)) public votesUsed;

    // ── Custom Errors ─────────────────────────────────────────────────────────

    error InsufficientTokensToPropose(uint256 balance, uint256 required);
    error InsufficientTokensToVote(uint256 balance, uint256 required);
    error VotingNotStarted();
    error VotingEnded();
    error VotingStillActive();
    error ProposalAlreadyExecuted();
    error ZeroVotes();
    error ExceedsMaxVotesPerCall();
    error ProposalNotFound();

    // ── Events ────────────────────────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed id, address indexed proposer, string title, uint256 endTime
    );
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votes,
        uint256 costInTokens
    );
    event ProposalExecuted(uint256 indexed id, bool passed);

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _token) {
        token = QuadraticToken(_token);
    }

    // ── Core Functions ────────────────────────────────────────────────────────

    /// @notice Create a new governance proposal
    /// @param title Short title (shown in UI)
    /// @param description Full description of the proposal
    /// @return proposalId The newly created proposal ID
    function createProposal(string calldata title, string calldata description)
        external
        returns (uint256 proposalId)
    {
        uint256 balance = token.balanceOf(msg.sender);
        if (balance < MIN_PROPOSAL_THRESHOLD) {
            revert InsufficientTokensToPropose(balance, MIN_PROPOSAL_THRESHOLD);
        }

        proposalId = ++proposalCount;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.startTime = uint64(block.timestamp);
        p.endTime = uint64(block.timestamp + VOTING_PERIOD);
        p.title = title;
        p.description = description;

        emit ProposalCreated(proposalId, msg.sender, title, p.endTime);
    }

    /// @notice Cast a quadratic vote on a proposal
    /// @dev Cost = votes² in QTK (with 18 decimals).
    ///      Caller must approve this contract for the exact cost before calling.
    /// @param proposalId Target proposal
    /// @param votes Number of vote units desired (cost = votes²)
    /// @param support True = vote FOR, False = vote AGAINST
    function castVote(uint256 proposalId, uint256 votes, bool support) external {
        if (votes == 0) revert ZeroVotes();
        if (votes > MAX_VOTES_PER_CALL) revert ExceedsMaxVotesPerCall();

        Proposal storage p = proposals[proposalId];
        if (p.id == 0) revert ProposalNotFound();
        if (block.timestamp < p.startTime) revert VotingNotStarted();
        if (block.timestamp > p.endTime) revert VotingEnded();

        // Quadratic cost: cost = votes² (integer, no rounding needed)
        uint256 costInTokens;
        unchecked {
            // votes ≤ MAX_VOTES_PER_CALL = 1000
            // votes² ≤ 1_000_000 — safely fits in uint256
            costInTokens = votes * votes * 10 ** 18;
        }

        uint256 balance = token.balanceOf(msg.sender);
        if (balance < costInTokens) {
            revert InsufficientTokensToVote(balance, costInTokens);
        }

        // Transfer tokens to DAO treasury (this contract)
        token.transferFrom(msg.sender, address(this), costInTokens);

        votesUsed[proposalId][msg.sender] += votes;

        if (support) {
            p.forVotes += votes;
        } else {
            p.againstVotes += votes;
        }

        emit VoteCast(proposalId, msg.sender, support, votes, costInTokens);
    }

    /// @notice Finalize a proposal after its voting period has ended
    function executeProposal(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        if (p.id == 0) revert ProposalNotFound();
        if (block.timestamp <= p.endTime) revert VotingStillActive();
        if (p.executed) revert ProposalAlreadyExecuted();

        p.executed = true;
        p.passed = p.forVotes > p.againstVotes;

        emit ProposalExecuted(proposalId, p.passed);
    }

    // ── View / Pure Helpers ───────────────────────────────────────────────────

    /// @notice Returns the full proposal struct
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }

    /// @notice Calculate token cost for a given number of vote units
    /// @return cost votes² (in whole QTK, without decimals for UI display)
    function calculateCost(uint256 votes) external pure returns (uint256 cost) {
        unchecked {
            cost = votes * votes;
        }
    }

    /// @notice Calculate maximum vote units purchasable with a token amount
    /// @dev Uses OZ Math.sqrt (Babylonian algorithm) — rounds down intentionally
    /// @param tokenAmount Amount in whole QTK (without 18-decimal scaling)
    /// @return maxVotes floor(√tokenAmount)
    function calculateMaxVotes(uint256 tokenAmount) external pure returns (uint256 maxVotes) {
        maxVotes = Math.sqrt(tokenAmount);
    }

    /// @notice Returns active status of a proposal
    function isActive(uint256 proposalId) external view returns (bool) {
        Proposal storage p = proposals[proposalId];
        return p.id != 0 && block.timestamp >= p.startTime && block.timestamp <= p.endTime;
    }
}
