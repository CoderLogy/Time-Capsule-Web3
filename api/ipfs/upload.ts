/**
 * API endpoint for secure IPFS upload via Pinata
 * This runs server-side so secrets are never exposed to the browser
 *
 * POST /api/ipfs/upload
 * Request: { encryptedData: string, title: string }
 * Response: { cid: string, gateway_url: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PinataSDK } from 'pinata';

// Initialize Pinata SDK with server-side secrets
function getPinataClient() {
  const jwt = process.env.PINATA_JWT;
  const apiSecret = process.env.PINATA_API_SECRET;
  const gateway = process.env.VITE_PINATA_GATEWAY;

  if (!jwt || !apiSecret || !gateway) {
    throw new Error('Missing Pinata configuration in environment variables');
  }

  return new PinataSDK({
    pinataJwt: jwt,
    pinataApiSecret: apiSecret,
  });
}

interface UploadRequest {
  encryptedData: string;
  title: string;
}

interface UploadResponse {
  success: boolean;
  cid?: string;
  gateway_url?: string;
  error?: string;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { encryptedData, title } = req.body as UploadRequest;

    // Validate request
    if (!encryptedData || !title) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: encryptedData, title',
      });
    }

    const pinata = getPinataClient();
    const gateway = process.env.VITE_PINATA_GATEWAY;

    // Upload to Pinata
    const result = await pinata.upload
      .json({
        title,
        data: encryptedData,
        uploadedAt: new Date().toISOString(),
      })
      .addMetadata({
        name: title,
        keyvalues: {
          timestamp: Date.now().toString(),
        },
      });

    // Construct gateway URL
    const gatewayUrl = `https://${gateway}/ipfs/${result.IpfsHash}`;

    return res.status(200).json({
      success: true,
      cid: result.IpfsHash,
      gateway_url: gatewayUrl,
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload to IPFS',
    });
  }
}
