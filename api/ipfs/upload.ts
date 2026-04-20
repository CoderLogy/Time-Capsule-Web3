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
  const gateway = process.env.VITE_PINATA_GATEWAY;

  if (!jwt || !gateway) {
    throw new Error('Missing Pinata configuration in environment variables');
  }

  return new PinataSDK({
    pinataJwt: jwt,
    pinataGateway: gateway,
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

    // Create JSON file from encrypted data
    const jsonData = {
      title,
      data: encryptedData,
      uploadedAt: new Date().toISOString(),
    };

    const jsonFile = new File(
      [JSON.stringify(jsonData)],
      `${title}.json`,
      { type: 'application/json' }
    );

    // Upload to Pinata using the public network
    const upload = await pinata.upload.public.file(jsonFile);

    // Construct gateway URL using the CID
    const gateway = process.env.VITE_PINATA_GATEWAY;
    const gatewayUrl = `https://${gateway}/ipfs/${upload.cid}`;

    return res.status(200).json({
      success: true,
      cid: upload.cid,
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
