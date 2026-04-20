import { uploadToPinata } from "@/lib/api-client";

// -------------------------------------------------------------------
// Payload type (matches encryptForWallet)
// -------------------------------------------------------------------
export interface CapsulePayload {
    encryptedMessage: string;
    encryptedDataKey: string;

    dataIv: string;

    keyIv: string;

    capsuleNonce: string;
    version: number;
    //expiresAt: number;
    createdAt?: number;
}

// -------------------------------------------------------------------
// Upload to IPFS via Vercel Function
// -------------------------------------------------------------------
export async function uploadCapsule(payload: CapsulePayload, titleString: string) {
    // Serialize the payload as JSON and send to backend for secure upload
    const encryptedData = JSON.stringify({
        title: titleString,
        ...payload,
        createdAt: payload.createdAt ?? Date.now(),
    });

    const { gateway_url } = await uploadToPinata(encryptedData, titleString);
    return gateway_url;
}

