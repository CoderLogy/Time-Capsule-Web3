import { ethers } from "ethers";
import fetch from "node-fetch";
import "dotenv/config";

import {
    encryptForWallet,
    decryptForWallet,
} from "./encrypt-decrypt.ts"; // updated file name

import { uploadCapsule } from "./ipfs.ts";

// -------------------------------------------------------------------
// ENV
// -------------------------------------------------------------------
const RPC_URL = process.env.SEPOLIA_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const PLAINTEXT = "hello from other side of world";

// -------------------------------------------------------------------
// Payload type (matches encryptForWallet output)
// -------------------------------------------------------------------
interface CapsulePayload {
    encryptedMessage: string;
    encryptedDataKey: string;

    dataIv: string;
    keyIv: string;

    capsuleNonce: string;
    version: number;
    signatureExpiresAt?: number;
    issuedAt?: number;
}

// -------------------------------------------------------------------
// Test
// -------------------------------------------------------------------
async function test() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);

    console.log("Wallet:", await signer.getAddress());

    // ---------------------------------------------------------------
    // Encrypt
    // ---------------------------------------------------------------
    const encrypted = await encryptForWallet(signer, PLAINTEXT);
    console.log("Encrypted payload:", encrypted);

    // ---------------------------------------------------------------
    // Upload to IPFS
    // ---------------------------------------------------------------
    const cidUrl = await uploadCapsule(encrypted);
    console.log("Stored at CID:", cidUrl);

    // ---------------------------------------------------------------
    // Fetch from IPFS
    // ---------------------------------------------------------------
    const ipfsPayload = (await fetch(cidUrl).then(r => r.json())) as CapsulePayload;
    console.log("Fetched payload:", ipfsPayload);

    // ---------------------------------------------------------------
    // Decrypt
    // ---------------------------------------------------------------
    const decrypted = await decryptForWallet(signer, {
        encryptedMessage: ipfsPayload.encryptedMessage,
        encryptedDataKey: ipfsPayload.encryptedDataKey,

        dataIv: ipfsPayload.dataIv,
        keyIv: ipfsPayload.keyIv,

        capsuleNonce: ipfsPayload.capsuleNonce,
        issuedAt: ipfsPayload.issuedAt!, // '!' tells TS it's not undefined
        signatureExpiresAt: ipfsPayload.signatureExpiresAt ?? (ipfsPayload.issuedAt! + 3600) // fallback
    });

    console.log("Decrypted:", decrypted);

    // ---------------------------------------------------------------
    // Assert
    // ---------------------------------------------------------------
    if (decrypted === PLAINTEXT) {
        console.log("✅ TEST PASSED");
    } else {
        console.log("❌ TEST FAILED");
    }
}

test().catch(err => {
    console.error("❌ Test error:", err);
    process.exit(1);
});
