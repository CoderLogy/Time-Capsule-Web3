import type { VercelRequest, VercelResponse } from "@vercel/node";
import { PinataSDK } from "pinata";
import { withAuth, withRateLimit, validateRequestSize, validateJSON } from "../middleware.js";

const MAX_UPLOAD_SIZE = 1024 * 1024;
const RATE_LIMIT_PER_MINUTE = 10;

function getPinataClient() {
    const jwt = process.env.PINATA_JWT!;
    const gateway = process.env.PINATA_GATEWAY!;

    if (!jwt || !gateway) {
        throw new Error("Missing Pinata configuration in environment variables");
    }

    return new PinataSDK({
        pinataJwt: jwt,
        pinataGateway: gateway
    });
}

interface UploadRequest {
    encryptedData: string;
    title: string;
}

async function uploadHandler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== "POST") {
        res.status(405).json({
            success: false,
            error: "Method not allowed. Use POST."
        });
        return;
    }

    try {
        const sizeCheck = await validateRequestSize(req, MAX_UPLOAD_SIZE);
        if (!sizeCheck.valid) {
            res.status(413).json({
                success: false,
                error: sizeCheck.error
            });
            return;
        }

        const jsonCheck = validateJSON(req.body);
        if (!jsonCheck.valid) {
            res.status(400).json({
                success: false,
                error: jsonCheck.error
            });
            return;
        }

        const { encryptedData, title } = req.body as UploadRequest;

        if (!encryptedData || typeof encryptedData !== "string") {
            res.status(400).json({
                success: false,
                error: "Missing or invalid encryptedData field"
            });
            return;
        }

        if (!title || typeof title !== "string") {
            res.status(400).json({
                success: false,
                error: "Missing or invalid title field"
            });
            return;
        }

        try {
            JSON.parse(encryptedData);
        } catch {
            res.status(400).json({
                success: false,
                error: "encryptedData must be valid JSON"
            });
            return;
        }

        try {
            const incomingWallet = req.headers["x-wallet-address"] || req.headers["x-walletaddress"];
            console.log("[Upload] x-wallet-address header:", incomingWallet);
        } catch (e) {
            console.error("[Upload] Error reading headers for debug:", e);
        }

        console.log("[Upload] Creating Pinata client...");
        const pinata = getPinataClient();
        console.log("[Upload] Pinata client created successfully");

        const jsonData = {
            title,
            data: encryptedData,
            uploadedAt: new Date().toISOString()
        };
        console.log("[Upload] JSON data prepared, size:", JSON.stringify(jsonData).length, "bytes");

        // Use Pinata SDK's JSON upload (Node-friendly) instead of browser File API
        console.log("[Upload] Calling pinata.upload.public.json()...");
        const upload = await pinata.upload.public.json(jsonData);
        console.log("[Upload] Upload successful, CID:", upload.cid);

        const gateway = process.env.PINATA_GATEWAY;
        const gatewayUrl = gateway
            ? `https://${gateway}/ipfs/${upload.cid}`
            : `https://ipfs.io/ipfs/${upload.cid}`;

        res.status(200).json({
            success: true,
            cid: upload.cid,
            gateway_url: gatewayUrl
        });
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Failed to upload to IPFS";
        console.error("[Upload] Error:", errorMsg);

        const safeMsg =
            errorMsg.includes("Pinata") || errorMsg.includes("jwt")
                ? "Upload service error"
                : errorMsg;

        res.status(500).json({
            success: false,
            error: safeMsg
        });
    }
}

export default withAuth(withRateLimit(uploadHandler, RATE_LIMIT_PER_MINUTE));
