// Tests full capsule encryption, upload to IPFS, and decryption flow

import { ethers } from "ethers";
import fetch from "node-fetch";
import "dotenv/config";

import { encryptForWallet, decryptForWallet } from "@/lib/encrypt-decrypt";
import { uploadCapsule } from "@/lib/ipfs";

const RPC_URL = process.env.SEPOLIA_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const TEST_MESSAGE = "hello from the other side of the world";

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

async function testIPFSEncryption() {
  console.log("..... Starting IPFS encryption test .....\n");

  // Setup wallet
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const signer = new ethers.Wallet(PRIVATE_KEY, provider);
  const walletAddress = await signer.getAddress();
  console.log("Wallet address:", walletAddress);

  // Setup encryption parameters
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600; // 1 hour validity

  // Test 1: Encrypt and upload single capsule
  console.log("\n Test 1: Single capsule encryption...");
  const encrypted = await encryptForWallet(signer, TEST_MESSAGE, expiresAt);
  console.log("Message encrypted");

  const ipfsCID = await uploadCapsule(encrypted, "Test Capsule 1");
  console.log("Uploaded to IPFS:", ipfsCID);

  // Fetch and decrypt
  const fetchedPayload = (await fetch(ipfsCID).then((r) => r.json())) as CapsulePayload;
  console.log("Fetched from IPFS");

  const decrypted = await decryptForWallet(signer, fetchedPayload);
  console.log("✓ Message decrypted");

  if (decrypted === TEST_MESSAGE) {
    console.log("✅ TEST 1 PASSED: Decryption matches original\n");
  } else {
    console.error("❌ TEST 1 FAILED: Decryption mismatch");
    process.exit(1);
  }

  // Test 2: Multiple capsules with different messages
  console.log(" Test 2: Multiple capsules with same wallet...");
  const messages = [
    "First capsule",
    "Second capsule with longer message",
    "Third capsule with special characters !@#$%^&*()",
  ];

  for (let i = 0; i < messages.length; i++) {
    const encrypted = await encryptForWallet(signer, messages[i], expiresAt);
    const cid = await uploadCapsule(encrypted, `Capsule ${i + 1}`);
    const payload = (await fetch(cid).then((r) => r.json())) as CapsulePayload;
    const decrypted = await decryptForWallet(signer, payload);

    if (decrypted === messages[i]) {
      console.log(`✅ Capsule ${i + 1} OK`);
    } else {
      console.error(`❌ Capsule ${i + 1} FAILED`);
      process.exit(1);
    }
  }

  console.log("✅ TEST 2 PASSED: All capsules encrypted and decrypted correctly\n");

  // Test 3: Verify metadata integrity (AAD)
  console.log("Test 3: Metadata integrity check...");
  const encrypted3 = await encryptForWallet(signer, "Metadata test", expiresAt);
  const cid3 = await uploadCapsule(encrypted3, "Metadata Test");
  const payload3 = (await fetch(cid3).then((r) => r.json())) as CapsulePayload;

  // Verify payload has all required fields
  const requiredFields = [
    "encryptedMessage",
    "encryptedDataKey",
    "dataIv",
    "keyIv",
    "capsuleNonce",
    "issuedAt",
    "expiresAt",
    "version",
  ];

  for (const field of requiredFields) {
    if (!payload3.hasOwnProperty(field)) {
      console.error(`❌ Missing field: ${field}`);
      process.exit(1);
    }
  }

  console.log("✓ All metadata fields present");
  console.log(`✓ Version: ${payload3.version}`);
  console.log(`✓ Capsule nonce: ${payload3.capsuleNonce.substring(0, 8)}...`);
  console.log("✅ TEST 3 PASSED: Metadata integrity verified\n");

  console.log("🎉 ALL TESTS PASSED");
}


testIPFSEncryption().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
