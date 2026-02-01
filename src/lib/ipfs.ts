import { PinataSDK } from "pinata";
import "dotenv/config";

const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT!,
    pinataGateway: process.env.PINATA_GATEWAY!,
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
    const gateway = process.env.PINATA_GATEWAY!;
    const res = await pinata.upload.public.json({
        title: titleString,
        ...payload,
    });

    return `https://${gateway}/ipfs/${res.cid}`
}

