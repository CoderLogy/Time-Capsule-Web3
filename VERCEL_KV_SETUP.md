# Vercel KV Setup Guide - Rate Limiting

## What Changed

Updated `api/middleware.ts` to use **Vercel KV (Redis)** instead of in-memory rate limiting:

**Before** (doesn't work on Vercel):
```typescript
const rateLimitStore = new Map<string, RateLimitEntry>();
```

**After** (production-ready):
```typescript
import { kv } from "@vercel/kv";
await kv.incr(key); // Persists across instances
```

## Why This Matters

- ✅ **Works on Vercel**: Persists data across serverless instances
- ✅ **Auto-expires**: Counters expire after 60 seconds automatically
- ✅ **Per-IP tracking**: Each IP has its own rate limit counter
- ✅ **Fail-safe**: If KV is down, requests still go through (fail open)

## Setup Steps

### 1. Enable Vercel KV in Dashboard

1. Go to **Vercel Dashboard** → Your Project
2. Click **Storage** tab
3. Click **Create** → **KV Database**
4. Name it: `rate_limit` (or any name)
5. Select region closest to you
6. Click **Create**

### 2. Copy Environment Variables

After creating KV, Vercel automatically adds these to your project:
- `KV_URL`
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`
- `KV_REST_API_READ_ONLY_TOKEN`

**These are added automatically - no manual setup needed!**

### 3. Deploy to Vercel

```bash
git add .
git commit -m "Add Vercel KV for rate limiting"
git push origin main
```

Vercel will automatically:
- Detect the KV usage
- Inject environment variables
- Deploy with rate limiting enabled

### 4. Verify It's Working

After deployment:

```bash
# Test rate limiting
for i in {1..15}; do
  curl -X POST https://your-app.vercel.app/api/ipfs/upload \
    -H "X-Wallet-Address: 0x1234..." \
    -H "Content-Type: application/json" \
    -d '{"encryptedData":"test","title":"test"}'
  echo "Request $i"
done

# Request 11-15 should get 429 (Too Many Requests)
```

Check headers:
```bash
curl -i https://your-app.vercel.app/api/ipfs/upload

# Look for:
# X-RateLimit-Limit: 10
# X-RateLimit-Remaining: 9
```

## How It Works

### Rate Limit Flow

```
Request from IP 192.168.1.1
  ↓
checkRateLimit("192.168.1.1", 10)
  ↓
await kv.incr("ratelimit:192.168.1.1")
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
Time 0:00s  → Request 1 from IP: count=1 ✓ allowed
Time 0:05s  → Request 2 from IP: count=2 ✓ allowed
Time 0:10s  → Request 3 from IP: count=3 ✓ allowed
...
Time 0:50s  → Request 10 from IP: count=10 ✓ allowed
Time 0:55s  → Request 11 from IP: count=11 ✗ REJECTED (429)
Time 1:05s  → Counter expires → reset to 0
Time 1:10s  → Request 12 from IP: count=1 ✓ allowed
```

## Current Rate Limits

- **Upload endpoint** (`/api/ipfs/upload`): 10 requests/minute per IP
- **Price endpoint** (`/api/prices/eth-price`): 60 requests/minute per IP

## Local Development

When running locally (`npm run dev`):
- Rate limiting still works if KV is configured
- Or remove KV import and use in-memory Map for local testing

To use in-memory locally:
```typescript
// Optional: Add environment variable check
if (process.env.VERCEL) {
  // Use KV on Vercel
} else {
  // Use in-memory locally
}
```

## Monitoring

In Vercel Dashboard:
1. Go to **Storage** → **KV Database**
2. Click on your database
3. View:
   - Key usage
   - Data size
   - Operation logs

## Costs

Vercel KV pricing:
- **Free tier**: 1,000 commands/day (enough for testing)
- **Paid tier**: $0.05 per 10,000 commands (very cheap)

Your rate limiting usage will be minimal (typically <1000 commands/day unless you get massive traffic).

## Troubleshooting

### "Cannot find module '@vercel/kv'"
```bash
npm install @vercel/kv
```

### "KV_URL is undefined"
- Make sure you created the KV database in Vercel Dashboard
- Redeploy after creating KV

### Rate limiting not working locally
- KV requires Vercel environment variables
- For local dev without Vercel, comment out the `import { kv }` line and use a Map

## Done! ✅

Your rate limiting is now **production-ready** on Vercel with persistent Redis tracking!
