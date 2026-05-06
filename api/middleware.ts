import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Redis } from "@upstash/redis";

function getRedisClient(): Redis {
    const redis = new Redis({
        url: process.env.UPSTASH_URL_KV_REST_API_URL,
        token: process.env.UPSTASH_URL_KV_REST_API_TOKEN
    });

    return redis;
}

export async function checkRateLimit(
    ip: string,
    limit: number
): Promise<{ allowed: boolean; remaining: number }> {
    const key = `ratelimit:${ip}`;

    try {
        const redis = getRedisClient();

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
    try {
        const forwarded = req.headers["x-forwarded-for"] || req.headers["x-real-ip"];
        if (typeof forwarded === "string") {
            return forwarded.split(",")[0].trim();
        }
        if (Array.isArray(forwarded) && forwarded.length > 0) {
            return String(forwarded[0]).split(",")[0].trim();
        }

        const socket = (req as any).socket;
        return socket && socket.remoteAddress ? socket.remoteAddress : "unknown";
    } catch (error) {
        console.error("[getClientIp] Error reading client IP:", error);
        return "unknown";
    }
}

export function isAuthenticatedRequest(req: VercelRequest): {
    authenticated: boolean;
    walletAddress?: string;
    error?: string;
} {
    const rawHeader = (req.headers["x-wallet-address"] || req.headers["x-walletaddress"]) as
        | string
        | string[]
        | undefined;
    let walletAddress: string | undefined;
    if (Array.isArray(rawHeader)) {
        walletAddress = rawHeader[0];
    } else if (typeof rawHeader === "string") {
        walletAddress = rawHeader;
    } else {
        walletAddress = undefined;
    }

    if (!walletAddress) {
        return {
            authenticated: false,
            error: "Missing wallet address. Please connect your wallet."
        };
    }

    walletAddress = walletAddress.trim();

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
        let ip = "unknown";
        try {
            ip = getClientIp(req);
        } catch (err) {
            console.error("[withRateLimit] Error getting client IP:", err);
            ip = "unknown";
        }

        let allowed = true;
        let remaining = limitPerMinute;
        try {
            const rl = await checkRateLimit(ip, limitPerMinute);
            allowed = rl.allowed;
            remaining = rl.remaining;
        } catch (err) {
            console.error("[withRateLimit] Rate limit check failed:", err);
            allowed = true;
            remaining = limitPerMinute;
        }

        res.setHeader("X-RateLimit-Limit", String(limitPerMinute));
        res.setHeader("X-RateLimit-Remaining", String(remaining));

        if (!allowed) {
            return res.status(429).json({
                error: "Too many requests. Please try again in a moment."
            });
        }

        try {
            return await handler(req, res);
        } catch (err) {
            console.error("[withRateLimit] Handler error:", err);
            if (!res.headersSent) {
                res.status(500).json({ error: "Internal Server Error" });
            }
            return;
        }
    };
}

export function withAuth(handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) {
    return async (req: VercelRequest, res: VercelResponse) => {
        const authResult = isAuthenticatedRequest(req);

        if (!authResult.authenticated) {
            return res.status(401).json({
                error: authResult.error || "Unauthorized. Please sign with your wallet."
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
                error: `Payload too large. Max size: ${maxSizeBytes / 1024 / 1024}MB`
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
            error: `Payload too large. Max size: ${maxSizeBytes / 1024 / 1024}MB`
        };
    }

    return { valid: true };
}

export function validateJSON(data: unknown): { valid: boolean; error?: string } {
    if (typeof data !== "object" || data === null) {
        return { valid: false, error: "Request body must be valid JSON" };
    }

    return { valid: true };
}
