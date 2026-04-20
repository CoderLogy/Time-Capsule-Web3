/**
 * API endpoint for secure IPFS upload via Pinata
 * This runs server-side so secrets are never exposed to the browser
 *
 * POST /api/ipfs/upload
 * Request: { encryptedData: string, title: string }
 * Response: { cid: string, gateway_url: string }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { uploadJson } from 'pinata';

// Initialize Pinata SDK config with server-side secrets
function getPinataConfig() {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    throw new Error('Missing Pinata configuration in environment variables');
  }

  return {
    pinataJwt: jwt,
  };
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

    const config = getPinataConfig();
    const gateway = process.env.VITE_PINATA_GATEWAY;

    // Upload to Pinata
    const jsonData = {
      title,
      data: encryptedData,
      uploadedAt: new Date().toISOString(),
    };

    const result = await uploadJson(config, jsonData, 'public');

    // Construct gateway URL
    const gatewayUrl = `https://${gateway}/ipfs/${result.cid}`;

    return res.status(200).json({
      success: true,
      cid: result.cid,
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
