import { ethers } from "ethers";
import fetch from "node-fetch";
import "dotenv/config";

import {
    encryptForWallet,
    decryptForWallet,
} from "./encrypt-decrypt.ts";

import { uploadCapsule } from "./ipfs.ts";

// -------------------------------------------------------------------
// ENV
// -------------------------------------------------------------------
const RPC_URL = process.env.SEPOLIA_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const PLAINTEXT = "hello from the other side of the world";

// -------------------------------------------------------------------
// Payload type (local only, for TypeScript type-checking)
// -------------------------------------------------------------------
interface CapsulePayload {
    encryptedMessage: string;
    encryptedDataKey: string;
    dataIv: string;
    keyIv: string;
    capsuleNonce: string;
    issuedAt: number;
    expiresAt: number;
    version: number;
}

// -------------------------------------------------------------------
// Test function
// -------------------------------------------------------------------
async function test() {
    // 1️⃣ Setup provider and signer
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    console.log("Wallet address:", await signer.getAddress());

    // 2️⃣ Setup encryption parameters
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + 3600; // 1 hour validity

    // 3️⃣ Encrypt first capsule
    const encrypted1: CapsulePayload = await encryptForWallet(
        signer,
        PLAINTEXT,
        expiresAt
    );

    console.log("Encrypted capsule 1:", encrypted1);

    // 4️⃣ Upload first capsule to IPFS
    const cidUrl1 = await uploadCapsule(encrypted1, "Test Capsule 1");
    console.log("Stored capsule 1 at CID:", cidUrl1);

    // 5️⃣ Fetch from IPFS
    const ipfsPayload1 = (await fetch(cidUrl1).then(r => r.json())) as CapsulePayload;
    console.log("Fetched capsule 1 payload:", ipfsPayload1);

    // 6️⃣ Decrypt first capsule
    const decrypted1 = await decryptForWallet(signer, ipfsPayload1);
    console.log("Decrypted capsule 1:", decrypted1);

    // 7️⃣ Encrypt second capsule using the SAME session key
    const encrypted2: CapsulePayload = await encryptForWallet(
        signer,
        "This is the second capsule using the same session key",
        expiresAt
    );

    console.log("Encrypted capsule 2:", encrypted2);

    const cidUrl2 = await uploadCapsule(encrypted2, "Test Capsule 2");
    console.log("Stored capsule 2 at CID:", cidUrl2);

    const ipfsPayload2 = (await fetch(cidUrl2).then(r => r.json())) as CapsulePayload;
    const decrypted2 = await decryptForWallet(signer, ipfsPayload2);
    console.log("Decrypted capsule 2:", decrypted2);

    // 8️⃣ Assert results
    if (decrypted1 === PLAINTEXT && decrypted2 === "This is the second capsule using the same session key") {
        console.log("✅ TEST PASSED: Both capsules decrypted successfully");
    } else {
        console.log("❌ TEST FAILED: Decryption mismatch");
    }
}

// -------------------------------------------------------------------
// Run test
// -------------------------------------------------------------------
test().catch(err => {
    console.error("❌ Test error:", err);
    process.exit(1);
});
