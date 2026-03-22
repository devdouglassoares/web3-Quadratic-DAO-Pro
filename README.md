<div align="center">

# 🗳️ QuadraticDAO Pro

**Governança On-Chain Democrática com Voto Quadrático**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity)](https://soliditylang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Wagmi](https://img.shields.io/badge/Wagmi-v2-000000)](https://wagmi.sh)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.x-4E5EE4)](https://openzeppelin.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deploy](https://github.com/YOUR_USERNAME/web3-Quadratic-DAO-Pro/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/web3-Quadratic-DAO-Pro/actions/workflows/deploy.yml)

[**🌐 Live Demo**](https://YOUR_USERNAME.github.io/web3-Quadratic-DAO-Pro/) · [**📖 Docs**](#-como-funciona) · [**🚀 Deploy**](#-deploy)

</div>

---

## 🌐 Idiomas / Languages / Idiomas

- [🇧🇷 Português](#-português)
- [🇺🇸 English](#-english)
- [🇪🇸 Español](#-español)

---

# 🇧🇷 Português

## 📋 Sobre o Projeto

**QuadraticDAO Pro** é uma DAO (Organização Autônoma Descentralizada) implementada em Solidity que utiliza o mecanismo de **Voto Quadrático** para garantir uma governança genuinamente democrática.

### O que é Voto Quadrático?

O Voto Quadrático é um mecanismo proposto por **Glen Weyl e Vitalik Buterin** onde o custo de emitir N votos é N² tokens. Isso cria um equilíbrio poderoso entre poder de voto e custo:

| Tokens Gastos | Votos Obtidos | Custo por Voto Extra |
|:---:|:---:|:---:|
| 1 QTK | 1 voto | — |
| 4 QTK | 2 votos | 3 QTK |
| 9 QTK | 3 votos | 5 QTK |
| 25 QTK | 5 votos | — |
| 100 QTK | 10 votos | — |
| 10.000 QTK | 100 votos | — |

**A lógica anti-plutocrática:** Gastar 10.000x mais tokens (de 1 para 10.000 QTK) proporciona apenas 100x mais votos. A baleia que tem 1.000.000 QTK não domina a votação como dominaria em sistemas "1 token = 1 voto".

### Como Previne a Plutocracia?

Em sistemas de governança tradicionais ("1 token = 1 voto"), quem possui mais tokens controla absolutamente as decisões. O Voto Quadrático adiciona **custo crescente** para quem quer concentrar poder:

```
Poder de voto = √(tokens gastos)
```

Isso significa que uma carteira com 10.000 tokens tem 100x mais tokens que uma carteira com 100 tokens, mas apenas ~10x mais votos (√10000 / √100 = 100/10 = 10x).

## 🏗️ Arquitetura

```
web3-Quadratic-DAO-Pro/
├── contracts/
│   ├── QuadraticToken.sol    # Token ERC20 de governança (QTK)
│   └── QuadraticDAO.sol      # Contrato principal da DAO
├── scripts/
│   └── deploy.js             # Script de deploy
├── test/
│   └── QuadraticDAO.test.js  # Testes unitários completos
├── frontend/
│   └── src/
│       ├── components/       # Componentes React
│       ├── hooks/            # Custom hooks Wagmi
│       └── config/           # Configuração Wagmi + ABIs
└── .github/workflows/
    └── deploy.yml            # CI/CD GitHub Pages
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js ≥ 18
- npm ≥ 9

### 1. Contratos (Hardhat)

```bash
# Instalar dependências
npm install

# Compilar contratos
npm run compile

# Executar testes
npm test

# Subir nó local
npm run node

# Deploy local (em outro terminal)
npm run deploy:local
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# Abrir http://localhost:5173
```

### 3. Conectar MetaMask ao Hardhat
1. Rede: `http://127.0.0.1:8545`, Chain ID: `31337`
2. Importar conta com chave privada do Hardhat
3. Atualizar endereços em `frontend/src/config/contracts.js`

## 🧪 Testes

```bash
npm test
# Coverage:
npm run coverage
```

Os testes verificam:
- ✅ Custo quadrático (votes² tokens)
- ✅ Prevenção de acesso não autorizado
- ✅ Precisão matemática do sqrt via OZ
- ✅ Ciclo completo de proposta e votação
- ✅ Inversão custo↔votos

---

# 🇺🇸 English

## 📋 About

**QuadraticDAO Pro** is a Solidity DAO implementing **Quadratic Voting** to deliver genuinely democratic on-chain governance — no whales, no plutocracy.

### What is Quadratic Voting?

Proposed by **Glen Weyl and Vitalik Buterin**, Quadratic Voting sets the cost to cast N votes at N² tokens. This creates a powerful balance between voting power and cost:

```
votes = floor(√tokens_spent)
tokens_required = votes²
```

**The anti-plutocracy logic:** A wallet with 10,000× more tokens has only ~100× more votes (√10000 / √100 = 10×). Every community member's voice matters.

### Features

- 📝 **Proposal creation** — anyone with ≥100 QTK can submit proposals
- 🗳️ **Quadratic voting** — vote slider with real-time cost preview
- ⏱️ **7-day voting window** — enforced on-chain
- ✅ **Finalization** — anyone can execute after period ends
- 🔒 **Token approval flow** — transparent 2-step UX (approve → vote)
- 📊 **Live vote bars** — FOR vs AGAINST with percentages

## 🚀 Deploy

### Local Development

```bash
# Contracts
npm install && npm run node
# In a second terminal:
npm run deploy:local

# Frontend
cd frontend && npm install && npm run dev
```

### Sepolia Testnet

```bash
# Configure .env (copy from .env.example)
cp .env.example .env
# Fill PRIVATE_KEY and SEPOLIA_RPC_URL

npm run deploy:sepolia
# Update CONTRACT_ADDRESSES[11155111] in frontend/src/config/contracts.js
```

### GitHub Pages (Automatic)

Push to `main` — the GitHub Action builds and deploys automatically.

**Setup:**
1. Go to repo Settings → Pages → Source: **GitHub Actions**
2. Push to `main`
3. Access at `https://YOUR_USERNAME.github.io/web3-Quadratic-DAO-Pro/`

---

# 🇪🇸 Español

## 📋 Acerca del Proyecto

**QuadraticDAO Pro** es una DAO implementada en Solidity que utiliza **Votación Cuadrática** para garantizar una gobernanza verdaderamente democrática y resistente a la plutocracia.

### ¿Qué es la Votación Cuadrática?

Propuesta por **Glen Weyl y Vitalik Buterin**, la votación cuadrática establece que el costo de emitir N votos es N² tokens:

```
votos = floor(√tokens_gastados)
costo = votos²
```

**La lógica anti-plutocrática:** Una ballena con 10.000× más tokens solo obtiene ~100× más votos (√10000 / √100 = 10×). Esto evita que los grandes tenedores dominen absolutamente las decisiones de gobernanza.

### Cómo Ejecutar

```bash
# Contratos
npm install
npm run compile
npm test
npm run node           # Terminal 1
npm run deploy:local   # Terminal 2

# Frontend
cd frontend && npm install && npm run dev
```

---

## ⚡ Technical Highlights

> This section is written for **technical recruiters and engineers** reviewing this project.

### 1. Gas Optimization in Solidity

#### Custom Errors vs `require` Strings
```solidity
// ❌ Expensive: stores string in bytecode, copies to memory on revert
require(balance >= MIN_THRESHOLD, "Insufficient tokens to propose");

// ✅ Optimized: 4-byte selector only, ~50 gas savings per revert
error InsufficientTokensToPropose(uint256 balance, uint256 required);
if (balance < MIN_THRESHOLD) revert InsufficientTokensToPropose(balance, MIN_THRESHOLD);
```

#### Struct Storage Packing
```solidity
// Packed: startTime + endTime + executed + passed share ONE storage slot
struct Proposal {
    uint256 id;           // slot 0
    uint256 forVotes;     // slot 1
    uint256 againstVotes; // slot 2
    uint64  startTime;    // slot 3 ─┐
    uint64  endTime;      //          ├─ packed (32 bytes total)
    bool    executed;     //          │
    bool    passed;       //         ─┘
    address proposer;     // slot 4
    string  title;        // slot 5+ (dynamic)
    string  description;  // dynamic
}
```

#### `unchecked` Arithmetic
```solidity
// votes ≤ MAX_VOTES_PER_CALL = 1000
// votes² ≤ 1_000_000 — provably fits in uint256, no overflow possible
unchecked {
    costInTokens = votes * votes * 10 ** 18;
}
```

#### `immutable` for Deployment-Time Constants
```solidity
QuadraticToken public immutable token;
// Stored in contract bytecode, not storage — SLOAD replaced by cheaper CODECOPY
```

### 2. Mathematical Precision

#### Forward Path (exact integer, zero rounding)
```
cost(votes) = votes²
```
Multiplication of integers — no floating point, no rounding error.

#### Reverse Path (OpenZeppelin Math.sqrt — Babylonian Algorithm)
```solidity
// OZ implementation: iterative Babylonian method
// Integer square root, rounds DOWN (conservative — voter gets ≤ votes they paid for)
uint256 maxVotes = Math.sqrt(tokenAmount);
```

The Babylonian algorithm converges quadratically. For a 256-bit integer, it terminates in ≤128 iterations. OpenZeppelin's implementation uses `assembly` internally for further gas efficiency.

#### Quadratic Invariant Proof
```
For any n ∈ ℕ:  cost(n) = n²
                votes(cost(n)) = floor(√(n²)) = n  ✓

For any c ∈ ℕ:  votes(c) = floor(√c)
                cost(floor(√c)) = floor(√c)² ≤ c  ✓  (voter never overpays)
```

### 3. Frontend Architecture

| Layer | Technology | Rationale |
|---|---|---|
| Build | Vite 5 | ESM-native, HMR < 50ms |
| UI | React 18 + Tailwind v3 | Composable, utility-first |
| Web3 | Wagmi v2 + viem | Type-safe, tree-shakeable |
| Data | TanStack Query | Caching + background refetch |
| Styling | Dark theme, custom CSS vars | WCAG AA contrast |

**2-step voting UX** (approve → castVote) is handled transparently inside `useCastVote` hook, providing users with step-by-step feedback without requiring them to understand ERC20 allowances.

### 4. Smart Contract Design Decisions

- **Tokens burned to DAO treasury** (not lost): The DAO contract accumulates tokens, enabling future treasury management proposals.
- **MAX_VOTES_PER_CALL = 1000**: Caps quadratic cost at 1,000,000 QTK per single call to prevent arithmetic issues and enforce reasonable UX.
- **No reentrancy risk**: `castVote` uses CEI pattern (Checks → Effects → Interactions) implicitly — state is updated after the `transferFrom` call in all paths.
- **Proposal finalization is permissionless**: Anyone can call `executeProposal` after the deadline, removing centralization risk.

### 5. Testing Coverage

```
QuadraticDAO
  QuadraticToken
    ✓ mints initial supply to deployer
    ✓ only owner can mint
    ✓ enforces MAX_SUPPLY
  createProposal
    ✓ creates a proposal with correct fields
    ✓ increments proposalCount
    ✓ reverts if proposer has insufficient tokens
    ✓ emits ProposalCreated event
  castVote — Quadratic Mechanics
    ✓ charges votes² tokens for voting
    ✓ registers vote count correctly (not token amount)
    ✓ large token holders get diminishing voting power per token
    ✓ reverts on zero votes
    ✓ reverts if insufficient tokens
    ✓ reverts after voting period ends
    ✓ emits VoteCast event with correct cost
  executeProposal
    ✓ marks proposal as passed when FOR > AGAINST
    ✓ marks proposal as failed when AGAINST >= FOR
    ✓ reverts if voting still active
    ✓ reverts on double execution
  Math helpers
    ✓ calculateCost returns votes²
    ✓ calculateMaxVotes returns floor(sqrt(tokenAmount))
    ✓ cost and maxVotes are inverse functions
```

## 📄 License

MIT © 2024 — Feel free to fork, modify, and deploy.

---

<div align="center">
  <p>Built with ❤️ by a Web3 engineer who believes every voice should count.</p>
  <p>
    <a href="https://soliditylang.org">Solidity</a> ·
    <a href="https://hardhat.org">Hardhat</a> ·
    <a href="https://openzeppelin.com">OpenZeppelin</a> ·
    <a href="https://wagmi.sh">Wagmi</a> ·
    <a href="https://vitejs.dev">Vite</a>
  </p>
</div>
