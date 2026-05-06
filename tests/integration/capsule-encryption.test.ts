// Tests the full lifecycle of creating, encrypting, and decrypting capsules
// RUN: `pnpm vitest tests/integration/capsule-encryption.test.ts` - requires local Hardhat node

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ethers } from "ethers";
import {
    encryptForWallet,
    decryptForWallet,
    deriveMasterKeyFromAddress
} from "@/lib/encrypt-decrypt";

describe("Capsule Encryption Integration - End-to-end encryption and time-locking", () => {
    let signer: ethers.Signer;
    let signerAddress: string;

    beforeAll(async () => {
        // Create a test signer
        const provider = new ethers.JsonRpcProvider("http://localhost:8545");
        signer = new ethers.Wallet(ethers.hexlify(ethers.randomBytes(32)), provider);
        signerAddress = await signer.getAddress();
        console.log("Test signer address:", signerAddress);
    });

    describe("Basic Encryption and Decryption - Core encryption functionality", () => {
        it("should encrypt and decrypt a message with wallet signature", async () => {
            const message = "Simple test message";
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = now - 1; // Expire immediately for test

            const encrypted = await encryptForWallet(signer, message, expiresAt);
            const decrypted = await decryptForWallet(signer, encrypted);

            expect(decrypted).toBe(message);
        });
    });

    describe("Encryption Payload Structure - Validation of encrypted data format", () => {
        it("should create valid encryption payload with all required fields", async () => {
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = now + 3600;

            const encrypted = await encryptForWallet(signer, "test", expiresAt);

            expect(encrypted).toHaveProperty("encryptedMessage");
            expect(encrypted).toHaveProperty("encryptedDataKey");
            expect(encrypted).toHaveProperty("dataIv");
            expect(encrypted).toHaveProperty("keyIv");
            expect(encrypted).toHaveProperty("capsuleNonce");
            expect(encrypted).toHaveProperty("issuedAt");
            expect(encrypted).toHaveProperty("expiresAt");
            expect(encrypted).toHaveProperty("version");
            expect(encrypted.version).toBe(3);
        });

        it("should generate unique nonce for each encryption (CSPRNG randomness)", async () => {
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = now + 3600;

            const encrypted1 = await encryptForWallet(signer, "message", expiresAt);
            const encrypted2 = await encryptForWallet(signer, "message", expiresAt);

            expect(encrypted1.capsuleNonce).not.toBe(encrypted2.capsuleNonce);
            expect(encrypted1.encryptedMessage).not.toBe(encrypted2.encryptedMessage);
        });
    });

    describe("Time Lock Validation - Verify time-locking prevents early access", () => {
        it("should reject decryption of future-locked capsules (security gate)", async () => {
            const now = Math.floor(Date.now() / 1000);
            const futureExpiresAt = now + 7200; // 2 hours in future

            const encrypted = await encryptForWallet(signer, "locked message", futureExpiresAt);

            // Try to decrypt before expiration
            await expect(decryptForWallet(signer, encrypted)).rejects.toThrow("time-locked");
        });

        it("should allow decryption of expired capsules (time passed)", async () => {
            const now = Math.floor(Date.now() / 1000);
            const pastExpiresAt = now - 3600; // 1 hour in past

            const encrypted = await encryptForWallet(signer, "unlocked message", pastExpiresAt);

            const decrypted = await decryptForWallet(signer, encrypted);
            expect(decrypted).toBe("unlocked message");
        });
    });

    describe("Decryption Edge Cases - Tamper detection via AEAD authentication", () => {
        it("should fail on tampering with AAD metadata (AEAD authentication)", async () => {
            const now = Math.floor(Date.now() / 1000);
            const expiresAt = now + 3600;

            const encrypted = await encryptForWallet(signer, "test", expiresAt);

            // Lets Tamper with metadata
            const tampered = { ...encrypted, issuedAt: encrypted.issuedAt + 100 };

            await expect(decryptForWallet(signer, tampered)).rejects.toThrow();
        });
    });

    afterAll(() => {});
});
