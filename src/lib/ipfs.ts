import { uploadToPinata } from "@/lib/api-client";

// -------------------------------------------------------------------
// Payload type (matches encryptForWallet + drand extensions)
// -------------------------------------------------------------------
export interface CapsulePayload {
    encryptedMessage: string;
    encryptedDataKey: string;
    dataIv: string;
    keyIv: string;
    capsuleNonce: string;
    issuedAt?: number;
    expiresAt?: number;
    version?: number;
    createdAt?: number;

    // Drand time-lock fields (optional, for backward compatibility)
    drandCiphertext?: string;
    drandRound?: number;
    isDrandLocked?: boolean;
}

// -------------------------------------------------------------------
// Upload to IPFS via Vercel Function
// -------------------------------------------------------------------
export async function uploadCapsule(payload: CapsulePayload, titleString: string) {
    // Serialize the payload as JSON and send to backend for secure upload
    const encryptedData = JSON.stringify({
        title: titleString,
        ...payload,
        createdAt: payload.createdAt ?? Date.now()
    });

    const { gateway_url } = await uploadToPinata(encryptedData, titleString);
    return gateway_url;
}
