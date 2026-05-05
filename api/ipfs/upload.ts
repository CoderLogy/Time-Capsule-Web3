// IPFS upload via Pinata
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PinataSDK } from "pinata";
import {
  withAuth,
  withRateLimit,
  validateRequestSize,
  validateJSON,
} from "../middleware";

const MAX_UPLOAD_SIZE = 1024 * 1024; // 1MB
const RATE_LIMIT_PER_MINUTE = 10;

function getPinataClient() {
  const jwt = process.env.PINATA_JWT;
  const gateway = process.env.VITE_PINATA_GATEWAY;

  if (!jwt || !gateway) {
    throw new Error("Missing Pinata configuration in environment variables");
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

async function uploadHandler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed. Use POST.",
    });
  }

  try {
    // Validate request size
    const sizeCheck = validateRequestSize(req, MAX_UPLOAD_SIZE);
    if (!sizeCheck.valid) {
      return res.status(413).json({
        success: false,
        error: sizeCheck.error,
      });
    }

    // Validate JSON body
    const jsonCheck = validateJSON(req.body);
    if (!jsonCheck.valid) {
      return res.status(400).json({
        success: false,
        error: jsonCheck.error,
      });
    }

    const { encryptedData, title } = req.body as UploadRequest;

    // Validate required fields
    if (!encryptedData || typeof encryptedData !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid encryptedData field",
      });
    }

    if (!title || typeof title !== "string") {
      return res.status(400).json({
        success: false,
        error: "Missing or invalid title field",
      });
    }

    // Validate encryptedData is valid JSON
    try {
      JSON.parse(encryptedData);
    } catch {
      return res.status(400).json({
        success: false,
        error: "encryptedData must be valid JSON",
      });
    }

    const pinata = getPinataClient();

    const jsonData = {
      title,
      data: encryptedData,
      uploadedAt: new Date().toISOString(),
    };

    const jsonFile = new File([JSON.stringify(jsonData)], `${title}.json`, {
      type: "application/json",
    });

    const upload = await pinata.upload.public.file(jsonFile);

    const gateway = process.env.VITE_PINATA_GATEWAY;
    const gatewayUrl = `https://${gateway}/ipfs/${upload.cid}`;

    return res.status(200).json({
      success: true,
      cid: upload.cid,
      gateway_url: gatewayUrl,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to upload to IPFS";

    // Don't expose sensitive error details
    const safeMsg =
      errorMsg.includes("Pinata") || errorMsg.includes("jwt")
        ? "Upload service error"
        : errorMsg;

    return res.status(500).json({
      success: false,
      error: safeMsg,
    });
  }
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const withRateLimitHandler = withRateLimit(
    uploadHandler,
    RATE_LIMIT_PER_MINUTE
  );
  const withAuthHandler = withAuth(withRateLimitHandler);

  return withAuthHandler(req, res);
}
