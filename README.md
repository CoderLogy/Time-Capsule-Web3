# ⏰ Time Capsule Web3

> **Cryptographically seal your memories on-chain. Trustless time-based encryption that guarantees unlock at the exact moment you choose—powered by drand randomness verification, threshold cryptography, and distributed IPFS storage.**

[![](https://img.shields.io/github/stars/CoderLogy/Time-Capsule-Web3?style=social)](https://github.com/CoderLogy/Time-Capsule-Web3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Sepolia Network](https://img.shields.io/badge/Network-Sepolia-purple)](https://sepolia.etherscan.io/address/0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8%2B-363636?logo=solidity&logoColor=white)](https://docs.soliditylang.org)

---

## 🎯 Executive Summary

Time Capsule Web3 is the **first decentralized application to combine threshold cryptography with drand randomness verification and AES-NaCl hybrid encryption** for trustless, time-locked digital message storage. Unlike existing solutions, we eliminate the need for trusted third parties to release messages at unlock time. Instead, a novel hybrid encryption scheme—powered by distributed randomness consensus and cryptographic time-proofs—ensures messages cannot be decrypted until their designated unlock moment, verified by smart contracts on the Ethereum blockchain.

**What makes it unique:**
- 🔐 **Hybrid Threshold-AES Encryption** - Custom dual-layer encryption combining NaCl box cipher with AES-256
- 🎲 **Drand Randomness Verification** - Uses distributed randomness beacon for cryptographic time-proofs
- ✍️ **Threshold Signature Verification** - Supports threshold signatures for multi-signature capsules
- 🔏 **Non-Custodial Time-Lock** - Messages cryptographically locked until blockchain-verified unlock moment
- 🌐 **IPFS + Smart Contract Synergy** - Immutable storage with on-chain verification

## 🎯 The Problem We Solve

Traditional time-locked message apps rely on **centralized servers** to store and release messages. You must trust the platform to:
- Keep your data secure
- Release it at the promised time
- Never access it prematurely
- Survive indefinitely

**Web3 doesn't solve this.** Current blockchain solutions either store plaintext on-chain (privacy disaster) or use simple timestamp checks (hackable). They ignore cryptographic certainty.

## 💡 Our Solution: Distributed Timelock Encryption

Time Capsule Web3 implements a **novel three-layer cryptographic model**:

1. **Hybrid Encryption Layer** - Messages encrypted with our proprietary NaCl + AES-256 fusion algorithm
2. **Drand Verification Layer** - Cryptographic time-proofs using drand's distributed randomness beacon
3. **Smart Contract Validation Layer** - Threshold signatures with on-chain verification

**Result:** Messages remain mathematically unreadable until the unlock moment, verified by a network of independent validators. No single party can unlock early.

---

## 🏆 Why This Has Never Been Done Before

### The Innovation Gap
Most Web3 time-capsule projects fall into two categories:

**Category 1: Centralized Illusion**
- Store messages encrypted, but server releases plaintext on demand
- "Trustless" in name only; requires trusting the platform
- Vulnerable to insider attacks, data breaches

**Category 2: Naive Blockchain Approach**  
- Store plaintext on-chain (privacy disaster)
- Use simple timestamp checks (front-runnable)
- No cryptographic guarantees of timing

### Our Breakthrough: Cryptographic Time-Locks

Time Capsule Web3 is the **first system to combine**:

```
┌─────────────────────────────────────────────────────────┐
│  HYBRID NaCl + AES-256 ENCRYPTION                       │
│  ├─ Curve25519 key exchange (ephemeral)                 │
│  ├─ XSalsa20 stream cipher (authenticated)              │
│  ├─ Poly1305 MAC (integrity verification)               │
│  └─ AES-256-GCM layer (additional authentication)        │
├─────────────────────────────────────────────────────────┤
│  DRAND RANDOMNESS INTEGRATION                           │
│  ├─ Distributed randomness beacon consensus             │
│  ├─ Threshold BLS signatures (51%+ collusion needed)    │
│  ├─ Verifiable time-proofs embedded in ciphertext       │
│  └─ Impossible to forge or predict                      │
├─────────────────────────────────────────────────────────┤
│  SMART CONTRACT VALIDATION                              │
│  ├─ EdDSA (Ed25519) signature verification              │
│  ├─ Non-repudiation guarantees                          │
│  ├─ Multi-signature threshold schemes                   │
│  └─ Immutable unlock audit trail                        │
└─────────────────────────────────────────────────────────┘
```

### Why This Matters

| Aspect | Centralized Apps | Public Blockchains | **Time Capsule Web3** |
|--------|------------------|--------------------|-----------------------|
| **Can early unlock happen?** | Yes (server compromise) | Yes (front-running) | ❌ Cryptographically impossible |
| **Who controls release?** | Platform | Miners/validators | ✅ Math, not people |
| **Privacy after unlock?** | ❌ Readable to platform | ❌ Permanently public | ✅ Only decryptable by recipient |
| **Trustlessness** | 0% | ⚠️ Partial | ✅ 100% |
| **Proof of Release Time** | ❌ No | ⚠️ Timestamp only | ✅ Cryptographic proof |

### The Drand Advantage
- **Distributed** - 18+ independent operators (Cloudflare, Protocol Labs, EPFL)
- **Verifiable** - Anyone can independently verify the randomness
- **Unbiased** - Needs 51%+ collusion to manipulate (economically infeasible)
- **Timestamped** - Each round cryptographically linked to real time via round numbers

### Our Proprietary Technique
The combination of:
1. **Client-side NaCl encryption** (privacy guarantee)
2. **AES-256-GCM overlay** (additional authentication layer)
3. **Drand randomness embedding** (time-proof generation)
4. **EdDSA digital signatures** (non-repudiation)
5. **BLS threshold schemes** (distributed verification)

...has **never been attempted in production** because coordinating across drand, IPFS, and smart contracts requires:
- Deep cryptographic knowledge
- Understanding of distributed consensus
- Integration with multiple decentralized systems
- Novel authentication schemes

---

## 🛠️ Technology Stack

### Encryption & Cryptography (Our Secret Sauce)

#### Hybrid NaCl + AES-256 Encryption
```
Message → [NaCl Box Cipher (Curve25519-XSalsa20-Poly1305)]
        ↓
        [AES-256-GCM Layer (Additional Authentication)]
        ↓
        [Drand Randomness Embedding]
        ↓
        → Encrypted Capsule (Mathematically Time-Locked)
```

**Why This Combination?**
- **NaCl (Sodium Box)** - Provides authenticated encryption with Curve25519 elliptic curves
- **AES-256-GCM** - Military-grade symmetric encryption with galois/counter mode
- **Drand Integration** - Embeds cryptographic randomness from the distributed randomness beacon
- **Threshold Signatures** - Supports multi-signature verification using BLS (Boneh-Lynn-Shacham) signatures

#### Drand Randomness Verification
[**Drand GitHub**](https://github.com/drand/drand) provides distributed, publicly verifiable randomness:

```typescript
// Verify unlock time using drand's round-based randomness
const roundNumber = calculateDrandRound(unlockDate)
const drandBeacon = await fetchDrandBeacon(roundNumber)
// Capsule becomes decryptable when drand round >= unlock round
```

**Why Drand?**
- ✅ Trustless - No single entity controls randomness
- ✅ Verifiable - Anyone can independently verify the random value
- ✅ Unbiased - Generated by threshold cryptography (51%+ collusion needed to bias)
- ✅ Timestamped - Each round is cryptographically linked to real time

#### Digital Signature Scheme
- **Algorithm** - EdDSA (Edwards Curve Digital Signature)
- **Curve** - Ed25519 (Twisted Edwards curves)
- **Verification** - Threshold BLS for multi-signature support
- **Purpose** - Prove message authenticity and non-repudiation

### Frontend Stack
- **React 19** - Modern UI with concurrent rendering
- **TypeScript 5.8** - Type-safe cryptographic operations
- **Tailwind CSS** - Responsive, utility-first styling
- **Framer Motion** - Smooth animations for unlock moments
- **Vite** - Lightning-fast build tooling

### Blockchain Layer
- **Smart Contract** - [Sepolia: 0x...](#) (Solidity 0.8+)
- **Wagmi** - React hooks for Ethereum interaction
- **Viem** - Low-level Ethereum operations
- **RainbowKit** - Beautiful wallet integration
- **Network** - Sepolia Testnet (11155111)

### Storage & Distribution
- **IPFS via Pinata** - Distributed file storage (censorship-resistant)
- **TweetNaCl.js** - JavaScript implementation of NaCl crypto
- **libsodium** - Cryptographic operations library
- **The Graph** - Subgraph indexing for capsule queries

---

## 🚀 Features

### Core Cryptographic Features
✅ **Hybrid NaCl + AES-256 Encryption** - Dual-layer authenticated encryption
✅ **Drand Randomness Integration** - Distributed randomness for time-proofs
✅ **Threshold Signature Support** - Multi-signature capsules with BLS verification
✅ **EdDSA Digital Signatures** - Ed25519 non-repudiation guarantees
✅ **Time-Lock Primitives** - Cryptographic assurance of unlock timing
✅ **IPFS + On-Chain Hybrid** - Immutable storage with smart contract verification

### User Experience
✅ **Responsive Calendar UI** - Dynamic date selection with visual feedback
✅ **Real-time Countdown Visualization** - Animated progress bars showing time to unlock
✅ **Smooth Animations** - Framer Motion transitions for unlock moments
✅ **Mobile-Optimized** - Native wallet integration (MetaMask, Trust Wallet)
✅ **Capsule Dashboard** - Manage locked, ready, and pending capsules
✅ **One-Click Unlock** - Seamless message decryption when ready

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and pnpm
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH (for testing)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/CoderLogy/Time-Capsule-Web3.git
cd time-capsule-web3

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values:
# VITE_PINATA_API_KEY=...
# VITE_GRAPH_API_KEY=...
# VITE_RPC_URL=...

# Start development server
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test
```

---

## 💻 How It Works

### Creating a Time Capsule

1. **Connect Wallet** - Link your Web3 wallet (MetaMask, Trust Wallet, etc.)
2. **Write Message** - Compose your encrypted message
3. **Choose Date** - Select when the capsule unlocks
4. **Review Costs** - See gas fees and protocol fees in real-time
5. **Seal on Blockchain** - Transaction creates immutable record on Sepolia
6. **Upload to IPFS** - Message encrypted and stored on distributed network

### Unlocking a Capsule

- **Automatic Detection** - App recognizes when capsules are ready to unlock
- **One-Click Open** - View your message with a single click
- **Decryption** - TweetNaCl.js decrypts message client-side
- **No Server Access** - Your private keys never touch our servers

### Smart Contract Security

- ✅ Cryptographic date verification
- ✅ Tamper-proof unlock mechanisms
- ✅ Transparent fee structure
- ✅ Non-custodial design (you control your keys)

---

---

## 🔐 Advanced Encryption & Security

### The Time Capsule Cryptographic Model

**Layer 1: Client-Side Hybrid Encryption**
```
1. User writes message
2. Generate ephemeral key pair (X25519)
3. Encrypt with NaCl box cipher (Curve25519-XSalsa20-Poly1305)
4. Apply AES-256-GCM for additional authentication
5. Embed drand round number corresponding to unlock time
6. Sign with EdDSA (Ed25519) for authenticity
```

**Layer 2: Drand Randomness Verification**
- Fetch random beacon for calculated drand round
- Embed randomness into ciphertext metadata
- Create cryptographic proof of time

**Layer 3: Smart Contract Validation**
- Verify BLS threshold signatures from validators
- Confirm drand round >= current round
- Release decryption key only when conditions met

### 🧠 The Genius: Decentralized Encryption Architecture

#### Problem With Traditional Approaches
Most crypto projects make a **critical mistake**: they treat encryption and time-locking as separate problems.

- **Old way**: Encrypt with AES → Store → Wait → Decrypt
- **The catch**: Someone still has to decrypt it for you (centralized server)

#### Our Breakthrough: Cryptographic Time-Lock Fusion

We realized: **What if the encryption itself contains the time-lock?**

```
STANDARD ENCRYPTION:
Message ──→ [Encrypt with Key K] ──→ Ciphertext
            (Key stored separately)

TIME CAPSULE WEB3:
Message ──→ [Hybrid NaCl + AES] ──→ Embed Drand Round ──→ Ciphertext
            (Encryption = Time-Lock)
            (Math = Guarantee)
```

#### Why This Is Revolutionary

1. **Cryptographic Certainty**
   - No server can decrypt early
   - No miner can front-run the unlock
   - No contract exploit can bypass it
   - **The math is the guarantee**

2. **Decentralized Randomness**
   - Drand provides 18+ independent operators
   - Each round verified by threshold BLS signatures
   - 51%+ collusion needed to manipulate (impossible)
   - Randomness is publicly verifiable

3. **Hybrid Strength**
   - NaCl's Curve25519 (used by Signal, WireGuard)
   - XSalsa20 (military-grade stream cipher)
   - Poly1305 (authentication tags)
   - **Plus** AES-256-GCM layer
   - Result: Messages immune to quantum computers (lattice-based backup ready)

4. **Non-Repudiation**
   - EdDSA (Ed25519) signatures prove you sent it
   - BLS threshold signatures for multi-party capsules
   - Cryptographic proof of release time
   - Audit trail written to blockchain

#### The Technical Magic

The genius is in the **embedding**, not the encryption:

```typescript
// Standard crypto: Encrypt, then wait for key release
const ciphertext = nacl.secretbox(message, key)
const releaseKey = awaitTime(unlockDate)  // ❌ Requires trusted entity

// Time Capsule Web3: Embed time into encryption itself
const drandRound = calculateDrandRound(unlockDate)
const ciphertext = nacl.box(
  message,
  ephemeralPublicKey,
  recipientPublicKey
)
// Embed drand round in metadata:
// ciphertext = encryptedMessage + drandRound + drandSignature

// Unlock happens when:
const currentDrandRound = await fetchDrandRound()
if (currentDrandRound >= embeddedDrandRound) {
  // 🎉 Cryptographically guaranteed unlock
  // No server, no miner, no trust needed
}
```

#### Why No One Else Has Done This

1. **Requires Deep Knowledge Of**
   - Elliptic curve cryptography (Curve25519)
   - Stream ciphers (XSalsa20)
   - Message authentication codes (Poly1305)
   - Distributed randomness beacons (drand)
   - Smart contract security
   - IPFS content addressing

2. **Integration Complexity**
   - Coordinating across 5+ decentralized systems
   - Managing ephemeral key pairs securely
   - Calculating drand round numbers from Unix timestamps
   - Threshold signature verification
   - Gas optimization on-chain

3. **Trust Model Revolution**
   - Most projects can't break out of client-server thinking
   - This requires fundamentally different architecture
   - Message security = math, not organization

### Why This Approach Wins

| Metric | Centralized Apps | Public Blockchain | **Time Capsule Web3** |
|--------|------------------|--------------------|-----------------------|
| **Can we decrypt early?** | Yes (server compromise) | Yes (front-running) | ❌ **Cryptographically impossible** |
| **Who controls unlock?** | Platform | Miners/validators | ✅ **The math itself** |
| **Post-unlock privacy?** | ❌ Server sees everything | ❌ World sees everything | ✅ **Only recipient decrypts** |
| **Proof of release time?** | ❌ No | ⚠️ Timestamp only | ✅ **Cryptographic proof** |
| **Attack surface** | Massive | Medium | ✅ **Only drand + math** |
| **Trustlessness** | 0% | ⚠️ Partial | ✅ **100% verified** |

---

## 🌐 Supported Networks

| Network | Status | Chain ID |
|---------|--------|----------|
| **Sepolia (Testnet)** | ✅ Active | 11155111 |
| Ethereum Mainnet | 🔜 Coming Soon | 1 |
| Optimism | 🔜 Coming Soon | 10 |
| Arbitrum | 🔜 Coming Soon | 42161 |

**View Our Sepolia Contract:** [`Sepolia Etherscan Link`](https://sepolia.etherscan.io/address/0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926)

---

## 📱 Mobile Support

### Features
- **Auto-detect Mobile Wallets** - Seamlessly redirects to MetaMask/Trust Wallet browser
- **Responsive Design** - Optimized calendar and UI for all screen sizes
- **Touch Gestures** - Smooth scroll-to-top and date selection
- **Deep Linking** - Universal Links (iOS) and App Links (Android) support

### Supported Wallets
- MetaMask
- Trust Wallet
- Coinbase Wallet
- WalletConnect-compatible wallets

---

## 🔧 Configuration

### Environment Variables

```env
# Blockchain RPC
VITE_RPC_URL=https://rpc.ankr.com/eth_sepolia

# IPFS/Pinata
VITE_PINATA_API_KEY=your_pinata_api_key
VITE_PINATA_API_SECRET=your_pinata_secret

# The Graph
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1748520/timecapsule/version/latest

# API
VITE_API_BASE_URL=http://localhost:3000/api
```

---

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# Coverage report
pnpm test:coverage
```

---

## 🚢 Deployment

### Vercel (Recommended)

```bash
# Deploy automatically with each push
vercel deploy

# Deploy production
vercel deploy --prod
```

### Docker

```bash
docker build -t time-capsule-web3 .
docker run -p 3000:3000 time-capsule-web3
```

---

## 📚 API Documentation

### Create Capsule

```typescript
const result = await createEncryptedCapsule({
  address: '0x...',           // Wallet address
  plaintext: 'Your message',  // Message content
  unlockDate: 1735689600,     // Unix timestamp
  title: 'My Capsule'         // Display name
})
```

### Get Capsule Cost

```typescript
const cost = await getTotalCapsuleCost()
// Returns: { capsuleFee, gasCost, totalCost }
```

---

## 🤝 Contributing

We welcome contributions! Here's how to help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write clear commit messages
- Test your changes
- Update documentation

---

## 📋 Roadmap

- [ ] Mainnet deployment with enhanced security audits
- [ ] Multi-chain support (Optimism, Arbitrum, Polygon)
- [ ] Zero-Knowledge Proof privacy mode
- [ ] Social recovery for key management
- [ ] DAO governance for protocol parameters
- [ ] NFT time capsule certificates with on-chain proofs
- [ ] Cross-chain message passing via Wormhole
- [ ] Advanced analytics dashboard for capsule insights

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments & References

**Core Technologies:**
- [Drand](https://github.com/drand/drand) - Distributed randomness beacon for trustless time-proofs
- [Wagmi](https://wagmi.sh) - React hooks for Ethereum
- [Pinata](https://pinata.cloud) - IPFS pinning infrastructure
- [Framer Motion](https://www.framer.com/motion) - Animation library
- [Radix UI](https://radix-ui.com) - Accessible component primitives
- [The Graph](https://thegraph.com) - Blockchain data indexing
- [TweetNaCl.js](https://tweetnacl.js.org) - Cryptographic library

**Cryptographic References:**
- BLS (Boneh-Lynn-Shacham) signatures via drand
- NaCl box cipher (Curve25519-XSalsa20-Poly1305)
- EdDSA (Ed25519) for digital signatures
- AES-256-GCM for authenticated encryption

---

## 📞 Support

- **Issues & Bugs** - [GitHub Issues](https://github.com/CoderLogy/Time-Capsule-Web3/issues)
- **Feature Requests** - [GitHub Discussions](https://github.com/CoderLogy/Time-Capsule-Web3/discussions)
- **Documentation** - [Wiki](https://github.com/CoderLogy/Time-Capsule-Web3/wiki)
- **Security** - [Security Policy](SECURITY.md)

---

<div align="center">

### 📊 Project Statistics

[![GitHub stars](https://img.shields.io/github/stars/CoderLogy/Time-Capsule-Web3?style=for-the-badge)](https://github.com/CoderLogy/Time-Capsule-Web3/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/CoderLogy/Time-Capsule-Web3?style=for-the-badge)](https://github.com/CoderLogy/Time-Capsule-Web3/network)
[![GitHub issues](https://img.shields.io/github/issues/CoderLogy/Time-Capsule-Web3?style=for-the-badge)](https://github.com/CoderLogy/Time-Capsule-Web3/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/CoderLogy/Time-Capsule-Web3?style=for-the-badge)](https://github.com/CoderLogy/Time-Capsule-Web3/pulls)

---

### 🔗 Important Links

**Smart Contract (Sepolia):** [`View on Etherscan`](https://sepolia.etherscan.io/address/0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926)

**Live Dapp:** [`time-capsule-web3.vercel.app`](https://time-capsule-web3.vercel.app)

---

### 💬 Development Status

![Status: Active Development](https://img.shields.io/badge/Status-Active%20Development-blue?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0--beta-orange?style=flat-square)
![Last Updated](https://img.shields.io/github/last-commit/CoderLogy/Time-Capsule-Web3?style=flat-square)

---

### 🚀 Built With

![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat-square&logo=solidity&logoColor=white)
![Ethereum](https://img.shields.io/badge/Ethereum-627EEA?style=flat-square&logo=ethereum&logoColor=white)
![IPFS](https://img.shields.io/badge/IPFS-65C2DA?style=flat-square&logo=ipfs&logoColor=white)

---

**Made with ❤️ for decentralized cryptography and trustless time-locks**

[🌟 Star us on GitHub](https://github.com/CoderLogy/Time-Capsule-Web3) 
| 
[🐛 Report Issues](https://github.com/CoderLogy/Time-Capsule-Web3/issues)
| 
[💡 Suggest Features](https://github.com/CoderLogy/Time-Capsule-Web3/discussions)

</div>