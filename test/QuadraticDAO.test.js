const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("QuadraticDAO", function () {
  let token, dao;
  let owner, alice, bob, carol;

  const QTK = (n) => ethers.parseEther(String(n));
  const VOTING_PERIOD = 7 * 24 * 60 * 60; // 7 days in seconds

  beforeEach(async function () {
    [owner, alice, bob, carol] = await ethers.getSigners();

    const QuadraticToken = await ethers.getContractFactory("QuadraticToken");
    token = await QuadraticToken.deploy(owner.address);

    const QuadraticDAO = await ethers.getContractFactory("QuadraticDAO");
    dao = await QuadraticDAO.deploy(await token.getAddress());

    // Distribute tokens
    await token.transfer(alice.address, QTK(10_000));
    await token.transfer(bob.address, QTK(5_000));
    await token.transfer(carol.address, QTK(500));
  });

  // ── QuadraticToken ──────────────────────────────────────────────────────────

  describe("QuadraticToken", function () {
    it("mints initial supply to deployer", async function () {
      expect(await token.balanceOf(owner.address)).to.be.gt(0);
    });

    it("only owner can mint", async function () {
      await expect(token.connect(alice).mint(alice.address, QTK(100))).to.be.reverted;
    });

    it("enforces MAX_SUPPLY", async function () {
      const max = await token.MAX_SUPPLY();
      const current = await token.totalSupply();
      const overflow = max - current + BigInt(1);
      await expect(token.mint(owner.address, overflow)).to.be.revertedWithCustomError(
        token,
        "ExceedsMaxSupply"
      );
    });
  });

  // ── Proposals ──────────────────────────────────────────────────────────────

  describe("createProposal", function () {
    it("creates a proposal with correct fields", async function () {
      await dao.connect(alice).createProposal("Test Proposal", "A detailed description");
      const proposal = await dao.getProposal(1);

      expect(proposal.id).to.equal(1);
      expect(proposal.proposer).to.equal(alice.address);
      expect(proposal.title).to.equal("Test Proposal");
      expect(proposal.forVotes).to.equal(0);
      expect(proposal.againstVotes).to.equal(0);
      expect(proposal.executed).to.equal(false);
    });

    it("increments proposalCount", async function () {
      await dao.connect(alice).createProposal("P1", "D1");
      await dao.connect(alice).createProposal("P2", "D2");
      expect(await dao.proposalCount()).to.equal(2);
    });

    it("reverts if proposer has insufficient tokens", async function () {
      const poorUser = carol; // 500 QTK < 100 threshold? No, carol has 500 >= 100
      // Let's use a fresh signer with 0 tokens
      const [, , , , poorSigner] = await ethers.getSigners();
      await expect(
        dao.connect(poorSigner).createProposal("Fail", "Should fail")
      ).to.be.revertedWithCustomError(dao, "InsufficientTokensToPropose");
    });

    it("emits ProposalCreated event", async function () {
      await expect(dao.connect(alice).createProposal("Event Test", "Description"))
        .to.emit(dao, "ProposalCreated")
        .withArgs(1, alice.address, "Event Test", expect.any(BigInt));
    });
  });

  // ── Quadratic Voting ────────────────────────────────────────────────────────

  describe("castVote — Quadratic Mechanics", function () {
    beforeEach(async function () {
      await dao.connect(alice).createProposal("Quadratic Test", "Testing QV");
    });

    it("charges votes² tokens for voting", async function () {
      const votes = 5n;
      const expectedCost = votes * votes * BigInt(10 ** 18); // 25 QTK

      await token.connect(alice).approve(await dao.getAddress(), expectedCost);
      const before = await token.balanceOf(alice.address);
      await dao.connect(alice).castVote(1, votes, true);
      const after = await token.balanceOf(alice.address);

      expect(before - after).to.equal(expectedCost);
    });

    it("registers vote count correctly (not token amount)", async function () {
      const votes = 3n;
      const cost = votes * votes * BigInt(10 ** 18); // 9 QTK

      await token.connect(alice).approve(await dao.getAddress(), cost);
      await dao.connect(alice).castVote(1, votes, true);

      const proposal = await dao.getProposal(1);
      expect(proposal.forVotes).to.equal(votes);
    });

    it("large token holders get diminishing voting power per token", async function () {
      // Alice spends 100 QTK → 10 votes (sqrt(100))
      // Bob spends 100 QTK → 10 votes — they tie despite balance difference
      const cost = QTK(100);
      const votes = 10n; // sqrt(100)

      await token.connect(alice).approve(await dao.getAddress(), cost);
      await dao.connect(alice).castVote(1, votes, true);

      await token.connect(bob).approve(await dao.getAddress(), cost);
      await dao.connect(bob).castVote(1, votes, false);

      const proposal = await dao.getProposal(1);
      expect(proposal.forVotes).to.equal(votes);
      expect(proposal.againstVotes).to.equal(votes);
    });

    it("reverts on zero votes", async function () {
      await expect(dao.connect(alice).castVote(1, 0, true)).to.be.revertedWithCustomError(
        dao,
        "ZeroVotes"
      );
    });

    it("reverts if insufficient tokens", async function () {
      const hugeVotes = 100n; // cost = 10000 QTK, carol only has 500
      const hugeCost = hugeVotes * hugeVotes * BigInt(10 ** 18);
      await token.connect(carol).approve(await dao.getAddress(), hugeCost);

      await expect(dao.connect(carol).castVote(1, hugeVotes, true)).to.be.revertedWithCustomError(
        dao,
        "InsufficientTokensToVote"
      );
    });

    it("reverts after voting period ends", async function () {
      await time.increase(VOTING_PERIOD + 1);
      await expect(dao.connect(alice).castVote(1, 1n, true)).to.be.revertedWithCustomError(
        dao,
        "VotingEnded"
      );
    });

    it("emits VoteCast event with correct cost", async function () {
      const votes = 4n;
      const cost = votes * votes * BigInt(10 ** 18); // 16 QTK
      await token.connect(alice).approve(await dao.getAddress(), cost);

      await expect(dao.connect(alice).castVote(1, votes, true))
        .to.emit(dao, "VoteCast")
        .withArgs(1, alice.address, true, votes, cost);
    });
  });

  // ── Proposal Execution ──────────────────────────────────────────────────────

  describe("executeProposal", function () {
    beforeEach(async function () {
      await dao.connect(alice).createProposal("Exec Test", "Ready to execute");
    });

    it("marks proposal as passed when FOR > AGAINST", async function () {
      const cost = QTK(9); // 3² = 9 tokens, 3 votes
      await token.connect(alice).approve(await dao.getAddress(), cost);
      await dao.connect(alice).castVote(1, 3n, true); // 3 FOR

      await time.increase(VOTING_PERIOD + 1);
      await dao.executeProposal(1);

      const proposal = await dao.getProposal(1);
      expect(proposal.passed).to.equal(true);
      expect(proposal.executed).to.equal(true);
    });

    it("marks proposal as failed when AGAINST >= FOR", async function () {
      const cost = QTK(4); // 2² = 4 tokens, 2 votes
      await token.connect(bob).approve(await dao.getAddress(), cost);
      await dao.connect(bob).castVote(1, 2n, false); // 2 AGAINST

      await time.increase(VOTING_PERIOD + 1);
      await dao.executeProposal(1);

      const proposal = await dao.getProposal(1);
      expect(proposal.passed).to.equal(false);
    });

    it("reverts if voting still active", async function () {
      await expect(dao.executeProposal(1)).to.be.revertedWithCustomError(
        dao,
        "VotingStillActive"
      );
    });

    it("reverts on double execution", async function () {
      await time.increase(VOTING_PERIOD + 1);
      await dao.executeProposal(1);
      await expect(dao.executeProposal(1)).to.be.revertedWithCustomError(
        dao,
        "ProposalAlreadyExecuted"
      );
    });
  });

  // ── Math Helpers ────────────────────────────────────────────────────────────

  describe("Math helpers", function () {
    it("calculateCost returns votes²", async function () {
      expect(await dao.calculateCost(1)).to.equal(1);
      expect(await dao.calculateCost(5)).to.equal(25);
      expect(await dao.calculateCost(10)).to.equal(100);
      expect(await dao.calculateCost(100)).to.equal(10000);
    });

    it("calculateMaxVotes returns floor(sqrt(tokenAmount))", async function () {
      expect(await dao.calculateMaxVotes(1)).to.equal(1);
      expect(await dao.calculateMaxVotes(4)).to.equal(2);
      expect(await dao.calculateMaxVotes(9)).to.equal(3);
      expect(await dao.calculateMaxVotes(10)).to.equal(3); // floor(√10) = 3
      expect(await dao.calculateMaxVotes(100)).to.equal(10);
      expect(await dao.calculateMaxVotes(99)).to.equal(9); // floor(√99) = 9
    });

    it("cost and maxVotes are inverse functions", async function () {
      for (const v of [1n, 5n, 10n, 50n, 100n]) {
        const cost = await dao.calculateCost(v);
        const votes = await dao.calculateMaxVotes(cost);
        expect(votes).to.equal(v);
      }
    });
  });
});
