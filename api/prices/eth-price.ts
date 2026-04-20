/**
 * API endpoint for fetching ETH/USD price from CryptoCompare
 * GET /api/prices/eth-price
 * Response: { price: number, lastUpdated: number }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

interface PriceResponse {
  price: number;
  lastUpdated: number;
}

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  try {
    const apiUrl = process.env.CRYPTOPRICE_API_URL || 'https://min-api.cryptocompare.com';

    // Fetch ETH/USD price
    const response = await fetch(
      `${apiUrl}/data/price?fsym=ETH&tsyms=USD&extraParams=TimeCapsule`
    );

    if (!response.ok) {
      console.error(`CryptoCompare request failed: ${response.status}`);
      return res.status(500).json({
        error: `Failed to fetch price: ${response.status}`,
      });
    }

    const data = (await response.json()) as Record<string, number>;

    if (!data.USD) {
      return res.status(500).json({
        error: 'Invalid price data received',
      });
    }

    // Add cache headers (5 minutes)
    res.setHeader('Cache-Control', 'public, max-age=300');

    return res.status(200).json({
      price: data.USD,
      lastUpdated: Date.now(),
    });
  } catch (error) {
    console.error('Price fetch error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch price',
    });
  }
}
