// Centralized configuration
import { publicEnv } from '@/config/env';

export const BLOCKCHAIN_CONFIG = {
  contractAddress: publicEnv.contractAddress,
  chainId: publicEnv.chainId,
  chainName: 'Sepolia',
  rpcUrl: 'https://1rpc.io/sepolia',
  blockExplorer: 'https://sepolia.etherscan.io',
} as const;

export const SUBGRAPH_CONFIG = {
  url: publicEnv.subgraphUrl,
  apiEndpoint: '/api/graphql/query',
} as const;

export const IPFS_CONFIG = {
  gateway: publicEnv.pinataGateway,
  uploadEndpoint: '/api/ipfs/upload',
  maxFileSize: 500 * 1024 //500KB
} as const;

export const WALLET_CONFIG = {
  walletConnectId: publicEnv.walletConnectId,
  supportedChains: [publicEnv.chainId],
} as const;

export const EXTERNAL_APIS = {
  priceEndpoint: '/api/prices/eth-price',
  cryptoPrice: {
    baseUrl: publicEnv.cryptoPriceApiUrl,
  },
} as const;

export const UI_CONFIG = {
  minDaysInFuture: 1,
  maxDaysInFuture: 3650,
  requiredConfirmations: 1,
  apiRetries: 3,
  apiRetryDelayMs: 1000,
} as const;


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
