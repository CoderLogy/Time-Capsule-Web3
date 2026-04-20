/**
 * Centralized configuration for the Time Capsule application
 * Single source of truth for contract addresses, chains, and public URLs
 */

import { publicEnv } from '@/config/env';

// ============================================================================
// Blockchain Configuration
// ============================================================================
export const BLOCKCHAIN_CONFIG = {
  // Contract address on Sepolia testnet
  contractAddress: publicEnv.contractAddress,

  // Supported chain
  chainId: publicEnv.chainId,
  chainName: 'Sepolia',

  // RPC endpoints (client uses wallet provider, but documented for reference)
  rpcUrl: 'https://1rpc.io/sepolia',

  // Block explorer
  blockExplorer: 'https://sepolia.etherscan.io',
} as const;

// ============================================================================
// The Graph Subgraph Configuration
// ============================================================================
export const SUBGRAPH_CONFIG = {
  // Subgraph API URL
  url: publicEnv.subgraphUrl,

  // API backend endpoint (authentication handled server-side)
  apiEndpoint: '/api/graphql/query',
} as const;

// ============================================================================
// IPFS / Pinata Configuration
// ============================================================================
export const IPFS_CONFIG = {
  // Pinata gateway domain for retrieving files
  gateway: publicEnv.pinataGateway,

  // API backend endpoint for uploads (authentication handled server-side)
  uploadEndpoint: '/api/ipfs/upload',

  // Maximum file size (100MB)
  maxFileSize: 100 * 1024 * 1024,
} as const;

// ============================================================================
// Wallet Configuration
// ============================================================================
export const WALLET_CONFIG = {
  // WalletConnect Project ID
  walletConnectId: publicEnv.walletConnectId,

  // Supported chains
  supportedChains: [publicEnv.chainId],
} as const;

// ============================================================================
// External API Configuration
// ============================================================================
export const EXTERNAL_APIS = {
  // Price data API endpoint
  priceEndpoint: '/api/prices/eth-price',

  // CryptoCompare API
  cryptoPrice: {
    baseUrl: publicEnv.cryptoPriceApiUrl,
  },
} as const;

// ============================================================================
// UI / UX Configuration
// ============================================================================
export const UI_CONFIG = {
  // Unlock date range
  minDaysInFuture: 1,
  maxDaysInFuture: 3650, // ~10 years

  // Transaction confirmations to wait for
  requiredConfirmations: 1,

  // Retry configuration
  apiRetries: 3,
  apiRetryDelayMs: 1000,
} as const;

// ============================================================================
// Validation & Defaults
// ============================================================================

/**
 * Validate that all required configuration is present
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!BLOCKCHAIN_CONFIG.contractAddress) {
    errors.push('Contract address not configured');
  }
  if (!WALLET_CONFIG.walletConnectId) {
    errors.push('WalletConnect ID not configured');
  }
  if (!SUBGRAPH_CONFIG.url) {
    errors.push('Subgraph URL not configured');
  }
  if (!IPFS_CONFIG.gateway) {
    errors.push('IPFS gateway not configured');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration errors:\n${errors.join('\n')}`);
  }
}
