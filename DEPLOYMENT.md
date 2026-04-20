# Vercel Deployment Guide

This guide covers how to deploy the Time Capsule Web3 application to Vercel with proper environment variable management and secure API functions.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Vercel Configuration](#vercel-configuration)
- [Environment Variables](#environment-variables)
- [Deploying](#deploying)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ installed locally
- Vercel account (free tier works fine)
- Vercel CLI (`npm i -g vercel`)
- GitHub repository (optional but recommended)
- All credentials from:
  - WalletConnect (projectId)
  - Pinata (JWT, API Secret)
  - The Graph (Subgraph API key)
  - Etherscan API key

## Local Setup

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd Time-Capsule-Web3
npm install
```

### 2. Set Up Environment Variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Blockchain
VITE_CONTRACT_ADDRESS=0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926
VITE_CHAIN_ID=11155111
VITE_WALLETCONNECT_ID=your_walletconnect_project_id

# The Graph (Subgraph Query)
VITE_SUBGRAPH_URL=https://api.studio.thegraph.com/query/1742250/time-capsule/version/latest
VITE_SUBGRAPH_API_KEY=your_subgraph_api_key

# IPFS (Pinata)
VITE_PINATA_GATEWAY=your_gateway.mypinata.cloud
PINATA_JWT=your_pinata_jwt_token
PINATA_API_SECRET=your_pinata_api_secret

# External APIs
CRYPTOPRICE_API_URL=https://min-api.cryptocompare.com

# Ethereum RPC (for tests/deployment only)
SEPOLIA_RPC_URL=https://1rpc.io/sepolia
```

### 3. Verify Local Environment

```bash
npm run dev
```

Visit `http://localhost:5173` and verify:
- Wallet connection works
- Create capsule form loads
- ETH price displays correctly
- IPFS upload succeeds

## Vercel Configuration

### 1. Create Vercel Project

```bash
vercel
```

Follow the prompts to:
- Connect your GitHub repository (optional)
- Authorize Vercel access
- Configure project name and region

### 2. Add Environment Variables

**Via CLI:**

```bash
vercel env add VITE_CONTRACT_ADDRESS
vercel env add VITE_CHAIN_ID
vercel env add VITE_WALLETCONNECT_ID
vercel env add VITE_SUBGRAPH_URL
VITE_SUBGRAPH_API_KEY
vercel env add VITE_PINATA_GATEWAY
vercel env add PINATA_JWT
vercel env add PINATA_API_SECRET
vercel env add CRYPTOPRICE_API_URL
```

**Via Vercel Dashboard:**

1. Go to your project settings
2. Click "Environment Variables"
3. Add each variable from `.env.example`
4. Set scope to "Production" and "Preview"

**⚠️ IMPORTANT: Set secrets as production-only**

Sensitive variables like `PINATA_JWT` and `VITE_SUBGRAPH_API_KEY` should be set to **Production** scope only to prevent them from appearing in preview deployments.

### Environment Variables by Scope

| Variable | Scope | Visibility |
|----------|-------|-----------|
| `VITE_CONTRACT_ADDRESS` | Production + Preview | Public (appears in browser) |
| `VITE_CHAIN_ID` | Production + Preview | Public (appears in browser) |
| `VITE_WALLETCONNECT_ID` | Production + Preview | Public (appears in browser) |
| `VITE_SUBGRAPH_URL` | Production + Preview | Public (appears in browser) |
| `VITE_PINATA_GATEWAY` | Production + Preview | Public (appears in browser) |
| `VITE_SUBGRAPH_API_KEY` | Production only | **Secret** (server-side only) |
| `PINATA_JWT` | Production only | **Secret** (server-side only) |
| `PINATA_API_SECRET` | Production only | **Secret** (server-side only) |
| `CRYPTOPRICE_API_URL` | Production + Preview | Public (appears in browser) |

## Environment Variables

### Public Variables (Safe for Browser)

These variables are exposed in `VITE_*` prefix and visible in client code:

- `VITE_CONTRACT_ADDRESS` - Smart contract address
- `VITE_CHAIN_ID` - Blockchain network ID
- `VITE_WALLETCONNECT_ID` - WalletConnect project ID
- `VITE_SUBGRAPH_URL` - The Graph subgraph endpoint
- `VITE_PINATA_GATEWAY` - IPFS gateway domain

### Secret Variables (Server-Side Only)

These variables are used only in Vercel Functions (backend) and never reach the browser:

- `PINATA_JWT` - Pinata authentication token
- `PINATA_API_SECRET` - Pinata API secret
- `VITE_SUBGRAPH_API_KEY` - The Graph authentication key

### API Endpoints

The following backend API functions handle secret authentication:

| Endpoint | Purpose | Secret Used |
|----------|---------|------------|
| `/api/ipfs/upload` | Upload encrypted capsules to IPFS | `PINATA_JWT`, `PINATA_API_SECRET` |
| `/api/graphql/query` | Query subgraph with authentication | `VITE_SUBGRAPH_API_KEY` |
| `/api/prices/eth-price` | Fetch ETH/USD price | None (public API) |

## Deploying

### Deploy to Production

```bash
# Deploy with Vercel CLI
vercel --prod

# Or via git push if connected to GitHub
git push origin main
```

### Deploy Preview

```bash
# Create preview deployment
vercel

# Deploy to specific branch
git push origin feature-branch
```

## Testing

### 1. Test API Functions Locally

```bash
npm run dev
# API functions will be available at http://localhost:3000/api/*
```

### 2. Test on Vercel Preview

1. Push to a feature branch
2. Vercel will create a preview deployment
3. Verify:
   - API functions respond correctly
   - Wallet connection works
   - Capsule creation succeeds
   - IPFS upload completes

### 3. Test Production Deployment

```bash
# Access your production deployment
https://your-project.vercel.app

# Test endpoints
curl https://your-project.vercel.app/api/prices/eth-price
curl -X POST https://your-project.vercel.app/api/graphql/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { capsuleCreateds(first: 1) { id } }"
  }'
```

## Troubleshooting

### API Function Errors

**Problem:** `500 Error from API endpoint`

**Solution:**
1. Check Vercel Function logs: `vercel logs <function-name>`
2. Verify environment variables are set: `vercel env list`
3. Check function memory/timeout: Update `vercel.json`
4. Verify API credentials are correct

### Missing Environment Variables

**Problem:** `undefined is not a valid environment variable value`

**Solution:**
1. Verify `.env.example` has all required vars
2. Run `vercel env list` to see set variables
3. Re-add missing variables: `vercel env add VAR_NAME`
4. Redeploy: `vercel --prod`

### CORS Issues

**Problem:** `Cross-Origin Request Blocked`

**Solution:**
Frontend must call `/api/*` endpoints (same domain), not external APIs directly. Already configured via:
- `src/lib/api-client.ts` - All API calls go through local endpoints
- `vercel.json` - API functions configured correctly

### Secrets Appearing in Browser

**Problem:** Sensitive variables visible in browser console

**Solution:**
1. Ensure sensitive variables are removed from `VITE_*` prefix
2. Verify they're set to **Production scope only** in Vercel dashboard
3. Check that API calls use `/api/` endpoints, not direct API calls
4. Clear browser cache and redeploy

### GraphQL Query Fails

**Problem:** `401 Unauthorized from subgraph`

**Solution:**
1. Verify `VITE_SUBGRAPH_API_KEY` is set
2. Check key is valid at https://api.studio.thegraph.com
3. Verify Bearer token format in `/api/graphql/query.ts`
4. Check request headers

### IPFS Upload Fails

**Problem:** `Failed to upload to IPFS`

**Solution:**
1. Verify `PINATA_JWT` and `PINATA_API_SECRET` are set
2. Check credentials at https://www.pinata.cloud
3. Verify Pinata SDK version matches `package.json`
4. Check Pinata account has upload quota remaining

### Wallet Connection Issues

**Problem:** WalletConnect fails to connect

**Solution:**
1. Verify `VITE_WALLETCONNECT_ID` is correct
2. Check project at https://cloud.walletconnect.com
3. Verify project status is "Active"
4. Check supported chains/networks

## Monitoring

### Check Deployment Status

```bash
vercel list
vercel inspect <deployment-url>
```

### View Function Logs

```bash
# Real-time logs
vercel logs

# Function-specific logs
vercel logs --follow api/ipfs/upload
```

### Monitor Performance

- Visit Vercel dashboard → Analytics
- Monitor API response times
- Check for errors and timeouts

## Security Best Practices

✅ **Do:**
- Use `.env.example` for documentation
- Set sensitive vars to Production scope only
- Rotate credentials regularly
- Monitor API usage
- Use rate limiting for public APIs
- Commit `.env.example` (with placeholders only)

❌ **Don't:**
- Commit `.env`, `.env.local`, or `.env.production`
- Expose secrets in `VITE_*` variables
- Hardcode credentials in code
- Share Vercel dashboard access unnecessarily
- Use test credentials in production

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Environment Variables: https://vercel.com/docs/concepts/projects/environment-variables
- Functions: https://vercel.com/docs/concepts/functions/serverless-functions
- GitHub Issues: Create an issue in your repository

---

**Last Updated:** April 2026
**Vercel Runtime:** Node.js 20.x
**Framework:** Vite + React
