# Vercel Redis Setup Guide - Rate Limiting

## What Changed

Updated `api/middleware.ts` to use **Vercel Redis** (new standard) with the `redis` package:

**Before** (deprecated):
```typescript
import { kv } from "@vercel/kv";
await kv.incr(key);
```

**After** (current):
```typescript
import { createClient } from "redis";
const redis = createClient({ url: process.env.REDIS_URL });
await redis.incr(key);
```

## Why This Matters

- ✅ **Works on Vercel**: Uses standard Redis client
- ✅ **Flexible**: Works with any Redis provider (not just Vercel's)
- ✅ **Auto-expires**: Counters expire after 60 seconds automatically
- ✅ **Per-IP tracking**: Each IP has its own rate limit counter
- ✅ **Fail-safe**: If Redis is down, requests still go through (fail open)

## Setup Steps

### 1. Create Redis Database on Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Storage** tab
3. Click **Create** → **Redis** (or other Redis provider)
4. Follow the setup wizard
5. Copy the `REDIS_URL` provided

### 2. Add Environment Variable

The setup automatically adds `REDIS_URL` to your Vercel project environment.

**Locally, add to `.env`:**
```env
REDIS_URL=redis://<user>:<password>@<host>:<port>
```

### 3. Install Redis Package

```bash
npm install redis
```

### 4. Deploy to Vercel

```bash
git add .
git commit -m "Switch to Vercel Redis with redis package"
git push origin main
```

Vercel will:
- Detect Redis usage
- Provide `REDIS_URL` automatically
- Deploy with rate limiting enabled

## How It Works

### Rate Limit Flow

```
Request from IP 192.168.1.1
  ↓
checkRateLimit("192.168.1.1", 10)
  ↓
await redis.incr("ratelimit:192.168.1.1")
  ↓
Count increases: 1, 2, 3, ... 10, 11
  ↓
count > limit?
  ├─ YES → 429 Too Many Requests
  └─ NO → Allow request
  ↓
After 60 seconds → Counter expires automatically
```

### Example Scenario

```
Time 0:00s  → Request 1: count=1 ✓ allowed
Time 0:05s  → Request 2: count=2 ✓ allowed
Time 0:10s  → Request 3: count=3 ✓ allowed
...
Time 0:50s  → Request 10: count=10 ✓ allowed
Time 0:55s  → Request 11: count=11 ✗ REJECTED (429)
Time 1:05s  → Counter expires → reset
Time 1:10s  → Request 12: count=1 ✓ allowed
```

## Current Rate Limits

- **Upload endpoint** (`/api/ipfs/upload`): 10 requests/minute per IP
- **Price endpoint** (`/api/prices/eth-price`): 60 requests/minute per IP

## Local Development

To test locally with `.env` REDIS_URL:

```bash
npm run dev
```

Then test:
```bash
curl -X POST http://localhost:3000/api/ipfs/upload \
  -H "X-Wallet-Address: 0x1234..." \
  -H "Content-Type: application/json" \
  -d '{"encryptedData":"test","title":"test"}'
```

After 10 requests in 60 seconds → 429 error

## Verify It's Working

After deployment:

```bash
# Test rate limiting
for i in {1..15}; do
  curl -X POST https://your-app.vercel.app/api/ipfs/upload \
    -H "X-Wallet-Address: 0x1234..." \
    -d '{"encryptedData":"test","title":"test"}'
  echo "Request $i"
done

# Requests 11-15 should get 429 (Too Many Requests)
```

Check headers:
```bash
curl -i https://your-app.vercel.app/api/ipfs/upload

# Look for:
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 9
```

## Redis Connection Pooling

The middleware creates one persistent Redis connection:

```typescript
let redis: RedisClientType | null = null;

async function getRedisClient() {
  if (!redis) {
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
  }
  return redis;
}
```

**Benefits:**
- ✅ Reuses connection across requests
- ✅ Efficient on serverless
- ✅ Automatic reconnection on failure

## Troubleshooting

### "Cannot find module 'redis'"
```bash
npm install redis
```

### "REDIS_URL is undefined"
- Make sure Redis is created in Vercel Dashboard
- Redeploy after adding Redis

### Connection timeout errors
- Check `REDIS_URL` format is correct
- Verify Redis instance is running
- Check network/firewall rules

### Rate limiting not working
- Check Redis is connected: look for `[RateLimit] Redis error` in logs
- Verify `REDIS_URL` env variable is set
- Test with curl commands above

## Documentation

Full Redis documentation:
https://vercel.com/docs/redis

## Done! ✅

Your rate limiting is now using **Vercel Redis** with the standard `redis` package!

Production-ready on Vercel ✅
