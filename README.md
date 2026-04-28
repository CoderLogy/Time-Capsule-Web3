# Time Capsule Web3

> Cryptographically time-locked messages on Ethereum. Decrypt on-chain at the exact moment you choose, powered by drand randomness and hybrid encryption.

[![](https://img.shields.io/github/stars/CoderLogy/Time-Capsule-Web3?style=social)](https://github.com/CoderLogy/Time-Capsule-Web3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Sepolia Network](https://img.shields.io/badge/Network-Sepolia-purple)](https://sepolia.etherscan.io/address/0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Solidity](https://img.shields.io/badge/Solidity-0.8%2B-363636?logo=solidity&logoColor=white)](https://docs.soliditylang.org)

## Features

- 🔐 **Hybrid Encryption** - NaCl + AES-256 dual-layer protection
- ⏰ **Cryptographic Time-Locks** - Mathematically impossible to unlock early
- 🎲 **Drand Verification** - Distributed randomness from 18+ independent operators
- ⛓️ **Non-Custodial** - No trusted third party needed
- 🌐 **IPFS Storage** - Decentralized, immutable message storage

### Our Breakthrough: Cryptographic Time-Locks


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
## Quick Start

### Prerequisites
- Node.js 18+
- Ethereum wallet (MetaMask, Rainbow, etc.)
- Sepolia testnet ETH (for gas)

### Installation

```bash
git clone https://github.com/CoderLogy/Time-Capsule-Web3
cd Time-Capsule-Web3
pnpm install
```

### Development

```bash
pnpm dev          # Start dev server
pnpm build        # Build for production
pnpm test         # Run tests
```

### Environment Setup

Copy `.env.example` to `.env` and fill in your values:

```env
VITE_CONTRACT_ADDRESS=0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926
VITE_CHAIN_ID=11155111
VITE_WALLETCONNECT_ID=your_wallet_connect_id
```

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
## 📋 Roadmap

- [ ] Mainnet deployment with enhanced security audits
- [ ] Multi-chain support (Optimism, Arbitrum, Polygon)
- [ ] Zero-Knowledge Proof privacy mode
- [ ] Social recovery for key management
- [ ] DAO governance for protocol parameters
- [ ] NFT time capsule certificates with on-chain proofs
- [ ] Cross-chain message passing via Wormhole
- [ ] Advanced analytics dashboard for capsule insights
## How It Works

1. **Create** - Write a message and set an unlock date
2. **Encrypt** - Your wallet signs the message for encryption
3. **Store** - Message stored on IPFS, proof recorded on blockchain
4. **Wait** - Drand randomness beacon reaches the unlock time
5. **Decrypt** - Open the capsule with the same wallet

## Tech Stack

- **Frontend** - React 19, TypeScript, TailwindCSS
- **Blockchain** - Solidity, Wagmi, Viem
- **Storage** - IPFS (Pinata)
- **Indexing** - The Graph
- **Time-Lock** - drand (distributed randomness beacon)

## Network Status

- **Sepolia** - ✅ Live at `0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926`
- **Mainnet** - Coming soon
- **Optimism** - Coming soon

## Contributing

### 💬 Development Status

## Security

This project uses cryptographic time-locks that are mathematically impossible to break. However, always:

- ✅ Use a secure wallet
- ✅ Keep your private keys safe
- ✅ Test on Sepolia testnet first
- ❌ Don't store sensitive information in messages

## License

MIT - See [LICENSE](LICENSE)

## Support

- 📧 Email: support@example.com
- Open up a issue in this repo and we will get back to you.

---