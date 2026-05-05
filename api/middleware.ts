import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "redis";

// rate limiting using Redis
let redis: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
}

export async function checkRateLimit(
  ip: string,
  limit: number
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${ip}`;

  try {
    const client = await getRedisClient();

    const count = await client.incr(key);

    // Set expiry (60 second window)
    if (count === 1) {
      await client.expire(key, 60);
    }

    const remaining = Math.max(0, limit - count);

    return {
      allowed: count <= limit,
      remaining,
    };
  } catch (error) {
    console.error("[RateLimit] Redis error:", error);
    // If Redis fails, allow request (fail open)
    return { allowed: true, remaining: limit };
  }
}

export function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "unknown";
}

// Auth validation
export function isAuthenticatedRequest(req: VercelRequest): {
  authenticated: boolean;
  walletAddress?: string;
  error?: string;
} {
  const walletAddress = req.headers["x-wallet-address"];

  if (!walletAddress || typeof walletAddress !== "string") {
    return {
      authenticated: false,
      error: "Missing wallet address. Please connect your wallet.",
    };
  }

  // Confirm it looks like a wallet address
  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return {
      authenticated: false,
      error: "Invalid wallet address format",
    };
  }

  return {
    authenticated: true,
    walletAddress,
  };
}


export function withRateLimit(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  limitPerMinute: number
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const ip = getClientIp(req);
    const { allowed, remaining } = await checkRateLimit(ip, limitPerMinute);

    res.setHeader("X-RateLimit-Limit", limitPerMinute);
    res.setHeader("X-RateLimit-Remaining", remaining);

    if (!allowed) {
      return res.status(429).json({
        error: "Too many requests. Please try again in a moment.",
      });
    }

    return handler(req, res);
  };
}


export function withAuth(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const authResult = isAuthenticatedRequest(req);

    if (!authResult.authenticated) {
      return res.status(401).json({
        error: authResult.error || "Unauthorized. Please sign with your wallet.",
      });
    }

    (req as any).walletAddress = authResult.walletAddress;

    return handler(req, res);
  };
}


export function validateRequestSize(
  req: VercelRequest,
  maxSizeBytes: number
): { valid: boolean; error?: string } {
  const contentLength = req.headers["content-length"];
  if (!contentLength) {
    return { valid: false, error: "Missing content-length header" };
  }
  // 1 MB limit
  const size = parseInt(contentLength, 1);
  if (size > maxSizeBytes) {
    return {
      valid: false,
      error: `Payload too large. Max size: ${maxSizeBytes / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

// Validate JSON data
export function validateJSON(
  data: unknown
): { valid: boolean; error?: string } {
  if (typeof data !== "object" || data === null) {
    return { valid: false, error: "Request body must be valid JSON" };
  }

  return { valid: true };
}
