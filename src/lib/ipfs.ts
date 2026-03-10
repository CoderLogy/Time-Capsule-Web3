import { PinataSDK } from "pinata";

const pinata = new PinataSDK({
    pinataJwt: import.meta.env.VITE_PINATA_JWT!,
    pinataGateway: import.meta.env.VITE_PINATA_GATEWAY!,
});

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
// Upload to IPFS
// -------------------------------------------------------------------
export async function uploadCapsule(payload: CapsulePayload,titleString:string) {
    const gateway = "aquamarine-kind-gull-833.mypinata.cloud";
    const res = await pinata.upload.public.json({
        title: titleString,
        ...payload,
        createdAt: payload.createdAt ?? Date.now()
    });
    if (!gateway) throw new Error("VITE_PINATA_GATEWAY is not set");
    return `https://${gateway}/ipfs/${res.cid}`
}

