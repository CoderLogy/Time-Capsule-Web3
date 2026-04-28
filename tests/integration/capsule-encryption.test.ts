// Capsule encryption and decryption integration tests
// Tests the full lifecycle of creating, encrypting, and decrypting capsules

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ethers } from "ethers";
import {
  encryptForWallet,
  decryptForWallet,
  deriveMasterKeyFromAddress,
} from "@/lib/encrypt-decrypt";

describe("Capsule Encryption Integration", () => {
  let signer: ethers.Signer;
  let signerAddress: string;
  const testMessages = [
    "Simple message",
    "Message with special chars: é ñ 中文 🎉",
    "Long message: ".repeat(100),
  ];

  beforeAll(async () => {
    // Create a test signer
    const provider = new ethers.JsonRpcProvider("http://localhost:8545");
    signer = new ethers.Wallet(
      ethers.hexlify(ethers.randomBytes(32)),
      provider
    );
    signerAddress = await signer.getAddress();
    console.log("Test signer address:", signerAddress);
  });

  describe("Basic Encryption and Decryption", () => {
    it("should encrypt and decrypt a message", async () => {
      const message = testMessages[0];
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600; // 1 hour

      const encrypted = await encryptForWallet(signer, message, expiresAt);
      const decrypted = await decryptForWallet(signer, encrypted);

      expect(decrypted).toBe(message);
    });

    it("should encrypt messages with special characters", async () => {
      const message = testMessages[1];
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600;

      const encrypted = await encryptForWallet(signer, message, expiresAt);
      const decrypted = await decryptForWallet(signer, encrypted);

      expect(decrypted).toBe(message);
    });

    it("should encrypt and decrypt long messages", async () => {
      const message = testMessages[2];
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600;

      const encrypted = await encryptForWallet(signer, message, expiresAt);
      const decrypted = await decryptForWallet(signer, encrypted);

      expect(decrypted).toBe(message);
    });
  });

  describe("Encryption Payload Structure", () => {
    it("should create valid encryption payload", async () => {
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

    it("should generate unique nonce for each encryption", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600;

      const encrypted1 = await encryptForWallet(
        signer,
        "message",
        expiresAt
      );
      const encrypted2 = await encryptForWallet(
        signer,
        "message",
        expiresAt
      );

      expect(encrypted1.capsuleNonce).not.toBe(encrypted2.capsuleNonce);
      expect(encrypted1.encryptedMessage).not.toBe(encrypted2.encryptedMessage);
    });

    it("should round timestamp to 15-minute granularity", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600;

      const encrypted = await encryptForWallet(signer, "test", expiresAt);

      const fifteenMinutes = 15 * 60;
      expect(encrypted.issuedAt % fifteenMinutes).toBe(0);
    });
  });

  describe("Time Lock Validation", () => {
    it("should reject decryption of future-locked capsules", async () => {
      const now = Math.floor(Date.now() / 1000);
      const futureExpiresAt = now + 7200; // 2 hours in future

      const encrypted = await encryptForWallet(
        signer,
        "locked message",
        futureExpiresAt
      );

      // Try to decrypt before expiration
      await expect(
        decryptForWallet(signer, encrypted)
      ).rejects.toThrow("time-locked");
    });

    it("should allow decryption of expired capsules", async () => {
      const now = Math.floor(Date.now() / 1000);
      const pastExpiresAt = now - 3600; // 1 hour in past

      const encrypted = await encryptForWallet(
        signer,
        "unlocked message",
        pastExpiresAt
      );

      const decrypted = await decryptForWallet(signer, encrypted);
      expect(decrypted).toBe("unlocked message");
    });
  });

  describe("Version Support", () => {
    it("should support version 3 capsules", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600;

      const encrypted = await encryptForWallet(signer, "test", expiresAt);
      expect(encrypted.version).toBe(3);

      const decrypted = await decryptForWallet(signer, encrypted);
      expect(decrypted).toBe("test");
    });

    it("should reject unsupported versions", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600;

      const encrypted = await encryptForWallet(signer, "test", expiresAt);

      // Manually change version to unsupported
      const badPayload = { ...encrypted, version: 999 };

      await expect(
        decryptForWallet(signer, badPayload as any)
      ).rejects.toThrow("Unsupported capsule version");
    });
  });

  describe("Decryption Edge Cases", () => {
    it("should fail gracefully on invalid hex data", async () => {
      const payload = {
        encryptedMessage: "not-valid-hex",
        encryptedDataKey: "also-not-hex",
        dataIv: "nope",
        keyIv: "invalid",
        capsuleNonce: "test",
        issuedAt: Math.floor(Date.now() / 1000),
        expiresAt: Math.floor(Date.now() / 1000) + 3600,
        version: 3,
      };

      await expect(
        decryptForWallet(signer, payload as any)
      ).rejects.toThrow();
    });

    it("should fail on tampering with AAD metadata", async () => {
      const now = Math.floor(Date.now() / 1000);
      const expiresAt = now + 3600;

      const encrypted = await encryptForWallet(signer, "test", expiresAt);

      // Tamper with metadata
      const tampered = { ...encrypted, issuedAt: encrypted.issuedAt + 100 };

      await expect(
        decryptForWallet(signer, tampered)
      ).rejects.toThrow();
    });
  });

  afterAll(() => {
    // Cleanup if needed
  });
});
