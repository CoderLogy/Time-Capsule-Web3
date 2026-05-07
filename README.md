# Time Capsule Web3

> Cryptographically time-locked messages on Ethereum. Decrypt on-chain at the exact moment you choose, powered by drand randomness, hybrid encryption and trustless architectural design.

[![](https://img.shields.io/github/stars/CoderLogy/Time-Capsule-Web3?style=social)](https://github.com/CoderLogy/Time-Capsule-Web3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Sepolia Network](https://img.shields.io/badge/Network-Sepolia-purple)](https://sepolia.etherscan.io/address/0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8%2B-363636?logo=solidity&logoColor=white)](https://docs.soliditylang.org)
[![CI/CD Pipeline](https://github.com/CoderLogy/Time-Capsule-Web3/actions/workflows/ci.yml/badge.svg)](https://github.com/CoderLogy/Time-Capsule-Web3/actions/workflows/ci.yml)

## Why I built this: I wanted a message system that I genuinely cannot open early and be encrypted so, others can't read it.

### My Breakthrough: Cryptographic Time-Locks

```
┌─────────────────────────────────────────────────────────┐
│  WALLET-BASED ENCRYPTION                                │
│  ├─ EIP-712 typed data signing (per-capsule)            │
│  ├─ Keccak256 hashing of signature                      │
│  ├─ HKDF-SHA256 key derivation (with capsule metadata)  │
│  ├─ AES-256-GCM authenticated encryption                │
│  └─ Per-message random IVs for each layer               │
├─────────────────────────────────────────────────────────┤
│  META-DATA TAMPERING RESISTANT                          │
│  ├─ Additional Authenticated Data (AAD) in all ciphers  │
│  ├─ Decryption fails if capsule metadata is modified    │
│  ├─ Prevents unauthorized unlock date or nonce changes  │
│  └─ Ensures only original capsule data can be decrypted │
├─────────────────────────────────────────────────────────┤
│  DRAND TIME-LOCK INTEGRATION                            │
│  ├─ Distributed randomness beacon consensus             │
│  ├─ Threshold BLS signatures (51%+ collusion needed)    │
│  ├─ Additional encryption layer over AES-256-GCM        │
│  └─ Impossible to decrypt before drand round released   │
├─────────────────────────────────────────────────────────┤
│  SMART CONTRACT VALIDATION                              │
│  ├─ Fee collection (prevents spam)                      │
│  ├─ Capsule ownership verification                      │
│  ├─ Time-lock enforcement (can't unlock before date)    │
│  ├─ Immutable audit trail of all capsule operations     │
│  └─ Non-custodial (contract cannot decrypt messages)    │
└─────────────────────────────────────────────────────────┘
```
### Why This Matters

| Aspect | Centralized Apps | Public Blockchains | **Time Capsule Web3** |
|--------|------------------|--------------------|-----------------------|
| **Can early unlock happen?** | Yes (server compromise) | Yes (front-running) | Cryptographically impossible |
| **Who controls release?** | Platform | Miners/validators | Math not people |
| **Privacy after unlock?** | Readable to platform | Permanently public | Only decryptable by recipient |
| **Trustlessness** | 0% | Partial | 100% |
| **Proof of Release Time** | No | Timestamp only | Cryptographic proof |

## Quick Start

### Prerequisites
- Node.js 20+
- Ethereum wallet (MetaMask, Rainbow, etc.)
- Sepolia testnet ETH (for gas)
- HardHat locally installed
  
### Installation

```bash
git clone https://github.com/CoderLogy/Time-Capsule-Web3
cd Time-Capsule-Web3
pnpm install
```

### Development

```bash
pnpm run dev          # Start dev server
pnpm run build        # Build for production
pnpm vitest        # Run tests
```

### Environment Setup

Create a copy of `.env.example` and rename it as `.env` and fill in your values:

```env
VITE_CONTRACT_ADDRESS=0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926
VITE_CHAIN_ID=11155111
VITE_WALLETCONNECT_ID=your_wallet_connect_id from reown
```

## Contributing
#### Development Status - Alpha
We welcome contributions! Here's how to help:

### Development Guidelines
- Look at our roadmap
- Follow TypeScript best practices
- Write clear commit messages
- Test your changes
- Update documentation or Readme

## Roadmap

- [ ] Mainnet deployment with enhanced security audits
- [ ] Multi-chain support (Optimism, Arbitrum, Polygon)
- [ ] Zero-Knowledge Proof privacy mode
- [ ] Sharing capsules with others using a link
- [ ] DAO governance for protocol parameters
- [ ] NFT time capsule certificates with on-chain proofs
- [ ] Cross-chain message passing via Wormhole
- [ ] Advanced analytics dashboard for capsule insights

## How It Works

1. **Create** - You write a message and set an unlock date
2. **Sign & Encrypt** - Your wallet signs the message via EIP-712, key derived from signature
3. **Store** - Encrypted message stored on IPFS, proof recorded on blockchain
5. **Decrypt** - After unlock date, open capsule with the same wallet that created it

## Tech Stack

- **Blockchain** - Solidity, Ethers.js, Wagmi, Viem
- **Encryption** - WebCrypto API (AES-256-GCM, HKDF-SHA256)
- **Storage** - IPFS (Pinata)
- **Indexing** - The Graph (graphql)
- **Time-Lock** - drand (distributed randomness beacon that predict randomness from future)

## Network Status

- **Sepolia** - `0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926`
- **Mainnet** - Coming soon
- **Optimism** - Coming soon


## Security

This project uses cryptographic time-locks that are mathematically impossible to break. However, always:

- Use a secure wallet
- Keep your private keys safe
- Test on Sepolia testnet first
- ❌ Don't store sensitive information in messages

## Legal

- **[Privacy Policy](PRIVACY.md)** - How we collect, use, and protect your data.
- **[Terms & Conditions](TERMS.md)** - Complete terms of service, disclaimers, liability limitations, and crypto risk warnings.

**Important:** By using Time Capsule Web3, you agree to our [Terms & Conditions](TERMS.md) and [Privacy Policy](PRIVACY.md). Please read them carefully.

## License

MIT - [LICENSE](LICENSE)

## Support

Open up a issue in this repo and I will get back to you.
