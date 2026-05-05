// Fetch ETH/USD price from CryptoCompare
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withRateLimit } from "../middleware";

const RATE_LIMIT_PER_MINUTE = 60;

interface PriceResponse {
  price: number;
  lastUpdated: number;
}

async function priceHandler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed. Use GET." });
  }

  try {
    const apiUrl =
      process.env.CRYPTOPRICE_API_URL || "https://min-api.cryptocompare.com";

    const response = await fetch(
      `${apiUrl}/data/price?fsym=ETH&tsyms=USD&extraParams=TimeCapsule`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      console.error(`CryptoCompare request failed: ${response.status}`);
      return res.status(500).json({
        error: `Failed to fetch price: ${response.status}`,
      });
    }

    const data = (await response.json()) as Record<string, number>;

    if (!data.USD || typeof data.USD !== "number") {
      return res.status(500).json({
        error: "Invalid price data received",
      });
    }

    res.setHeader("Cache-Control", "public, max-age=300");

    return res.status(200).json({
      price: data.USD,
      lastUpdated: Date.now(),
    } as PriceResponse);
  } catch (error) {
    console.error("[Price] Fetch error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch price";
    return res.status(500).json({
      error: errorMsg,
    });
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const withRateLimitHandler = withRateLimit(priceHandler, RATE_LIMIT_PER_MINUTE);
  return withRateLimitHandler(req, res);
}
