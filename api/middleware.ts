import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

const redis = new Redis({
    url: process.env.REDIS_URL!,
    token: process.env.REDIS_TOKEN!,
});

export async function checkRateLimit(
    ip: string,
    limit: number
): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit:${ip}`;

    try {
        const count = await redis.incr(key);

        if (count === 1) {
            await redis.expire(key, 60);
        }

        const remaining = Math.max(0, limit - count);

        return {
            allowed: count <= limit,
            remaining
        };
    } catch (error) {
        console.error("[RateLimit] Redis error:", error);
        return { allowed: true, remaining: limit };
    }
}

export function getClientIp(req: VercelRequest): string {
    const forwarded = req.headers["x-forwarded-for"];

    if (typeof forwarded === "string") {
        return forwarded.split(",")[0].trim();
    }

    return req.socket?.remoteAddress || "unknown";
}

export function isAuthenticatedRequest(req: VercelRequest): {
    authenticated: boolean;
    walletAddress?: string;
    error?: string;
} {
    const walletAddress = req.headers["x-wallet-address"];

    if (!walletAddress || typeof walletAddress !== "string") {
        return {
            authenticated: false,
            error: "Missing wallet address. Please connect your wallet."
        };
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return {
            authenticated: false,
            error: "Invalid wallet address format"
        };
    }

    return {
        authenticated: true,
        walletAddress
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
                error: "Too many requests. Please try again in a moment."
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
                error:
                    authResult.error ||
                    "Unauthorized. Please sign with your wallet."
            });
        }

        (req as any).walletAddress = authResult.walletAddress;

        return handler(req, res);
    };
}

export async function validateRequestSize(
    req: VercelRequest,
    maxSizeBytes: number
): Promise<{ valid: boolean; error?: string }> {
    const contentLength = req.headers["content-length"];

    if (contentLength) {
        const size = parseInt(contentLength, 10);

        if (size > maxSizeBytes) {
            return {
                valid: false,
                error: `Payload too large. Max size: ${
                    maxSizeBytes / 1024 / 1024
                }MB`
            };
        }

        return { valid: true };
    }

    const bytes = await new Promise<number>((resolve, reject) => {
        let total = 0;

        req.on("data", (chunk: Buffer) => {
            total += chunk.length;
        });

        req.on("end", () => resolve(total));
        req.on("error", reject);
    });

    if (bytes > maxSizeBytes) {
        return {
            valid: false,
            error: `Payload too large. Max size: ${
                maxSizeBytes / 1024 / 1024
            }MB`
        };
    }

    return { valid: true };
}

export function validateJSON(
    data: unknown
): { valid: boolean; error?: string } {
    if (typeof data !== "object" || data === null) {
        return {
            valid: false,
            error: "Request body must be valid JSON"
        };
    }

    return { valid: true };
}