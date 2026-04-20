/**
 * API client for communicating with backend Vercel Functions
 * All sensitive operations are handled server-side
 */

// ============================================================================
// IPFS / Pinata Upload
// ============================================================================

export interface IPFSUploadResponse {
  success: boolean;
  cid?: string;
  gateway_url?: string;
  error?: string;
}

export async function uploadToPinata(
  encryptedData: string,
  title: string
): Promise<{ cid: string; gateway_url: string }> {
  const response = await fetch('/api/ipfs/upload', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encryptedData,
      title,
    }),
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const result = (await response.json()) as IPFSUploadResponse;

  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }

  if (!result.cid || !result.gateway_url) {
    throw new Error('Invalid response from upload endpoint');
  }

  return {
    cid: result.cid,
    gateway_url: result.gateway_url,
  };
}

// ============================================================================
// GraphQL Queries
// ============================================================================

export interface GraphQLQueryOptions {
  query: string;
  variables?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export async function querySubgraph<T = any>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const response = await fetch('/api/graphql/query', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: variables || {},
    }),
  });

  if (!response.ok) {
    throw new Error(`Query failed: ${response.statusText}`);
  }

  const result = (await response.json()) as GraphQLResponse<T>;

  if (result.errors && result.errors.length > 0) {
    throw new Error(`GraphQL error: ${result.errors.map((e) => e.message).join(', ')}`);
  }

  if (!result.data) {
    throw new Error('No data in GraphQL response');
  }

  return result.data;
}

// ============================================================================
// Price Data
// ============================================================================

export interface PriceData {
  price: number;
  lastUpdated: number;
}

export async function getEthPrice(): Promise<PriceData> {
  const response = await fetch('/api/prices/eth-price', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Price fetch failed: ${response.statusText}`);
  }

  return (await response.json()) as PriceData;
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Retry logic for API calls (useful for flaky network)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
}
