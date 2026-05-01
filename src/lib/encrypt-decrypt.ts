import { BrowserProvider, ethers } from "ethers";
import { getWalletClient } from "@wagmi/core";
import { getConfig } from "@/components/Wallet";
import { WalletClient } from "viem";
import { BLOCKCHAIN_CONFIG } from "@/lib/config";
import { quicknet, encrypt as drandEncrypt, decrypt as drandDecrypt } from "@/lib/drand";


const SEPOLIA_CHAIN_ID = BigInt(BLOCKCHAIN_CONFIG.chainId);
export const CONTRACT_ADDRESS = ethers.getAddress(BLOCKCHAIN_CONFIG.contractAddress);

// Supported versions - add new ones here, never remove old ones
const SUPPORTED_VERSIONS = new Set([3]);

// Round timestamps to 15-minute windows to reduce timing oracle precision
const TIMESTAMP_GRANULARITY_SECONDS = 15 * 60;
function roundTimestamp(ts: number): number {
  return Math.floor(ts / TIMESTAMP_GRANULARITY_SECONDS) * TIMESTAMP_GRANULARITY_SECONDS;
}

// Wallet signer
let _signer: ethers.Signer | null = null;
let _lastSignerAddress: string | null = null;

export async function setSignatureSigner(
  walletClient?: WalletClient,
): Promise<ethers.Signer> {
  const provider = await getProvider(walletClient);
  const s = await provider.getSigner();
  _signer = s;
  _lastSignerAddress = await s.getAddress();
  console.log(`[Signer] Set signer for address: ${_lastSignerAddress}`);
  return s;
}

/** this needs to be fixed @deprecated */
export function getSigner(): ethers.Signer {
  if (!_signer) throw new Error("Signer not initialized");
  return _signer;
}

export async function isSignerValid(): Promise<boolean> {
  if (!_signer) return false;
  try {
    const addr = await _signer.getAddress();
    return addr === _lastSignerAddress;
  } catch {
    return false;
  }
}

export function clearSignatureSigner() {
  _signer = null;
  _lastSignerAddress = null;
}

// Provider pooling to avoid rpc errors
let _provider: ethers.BrowserProvider | null = null;
let _providerWalletClient: WalletClient | null = null;

export async function getProvider(walletClient?: WalletClient): Promise<ethers.BrowserProvider> {
  if (walletClient && walletClient !== _providerWalletClient) {
    _provider = new ethers.BrowserProvider(walletClient.transport);
    _providerWalletClient = walletClient;
    console.log("[Provider] Created new BrowserProvider instance");
    return _provider;
  }

  if (_provider && walletClient === _providerWalletClient) {
    console.log("[Provider] Reusing cached BrowserProvider instance");
    return _provider;
  }

  if (_provider && !walletClient) {
    console.log("[Provider] Reusing cached BrowserProvider instance (no wallet specified)");
    return _provider;
  }

  if (!walletClient && !_provider) {
    const wc = await getWalletClient(getConfig() as Parameters<typeof getWalletClient>[0]);
    if (!wc) {
      throw new Error("[Provider] No wallet client available");
    }
    _provider = new ethers.BrowserProvider(wc.transport);
    _providerWalletClient = wc;
    console.log("[Provider] Created BrowserProvider from default wallet");
    return _provider;
  }

  throw new Error("[Provider] No provider available");
}

export function clearProvider() {
  _provider = null;
  _providerWalletClient = null;
  console.log("[Provider] Cleared cached provider");
}

// Utility functions for hex and random bytes
export function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Validate hex input before parsing to produce clean errors
export function fromHex(hex: string): Uint8Array {
  if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
    throw new Error(`Invalid hex string (length=${hex?.length ?? "n/a"})`);
  }
  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error("Invalid hex string: non-hex characters detected");
  }
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
}

/** Zero-fill a byte array after use to limit key material lifetime in heap. */
function zeroize(buf: Uint8Array): void {
  buf.fill(0);
}

// Typed data for authorization (EIP-712 signing)
function getTypedData(capsuleNonce: string, issuedAt: number, expiresAt: number) {
  return {
    domain: {
      name: "TimeCapsule",
      version: "3",
      chainId: SEPOLIA_CHAIN_ID,
      verifyingContract: CONTRACT_ADDRESS,
    },
    types: {
      Auth: [
        { name: "purpose", type: "string" },
        { name: "capsuleNonce", type: "string" },
        { name: "issuedAt", type: "uint256" },
        { name: "expiresAt", type: "uint256" },
      ],
    },
    value: {
      purpose: "Authorize TimeCapsule access",
      capsuleNonce,
      issuedAt,
      expiresAt,
    },
  };
}

// Master key derivation from wallet signer - per-capsule signature isolation
export async function deriveMasterKeyFromAddress(
  signer: ethers.Signer,
  capsuleNonce: string,
  issuedAt: number,
  expiresAt: number,
): Promise<CryptoKey> {
  const { domain, types, value } = getTypedData(capsuleNonce, issuedAt, expiresAt);
  const signature = await signer.signTypedData(domain, types, value);
  const ikm = ethers.getBytes(ethers.keccak256(ethers.getBytes(signature)));

  const baseKey = await crypto.subtle.importKey(
    "raw",
    ikm,
    "HKDF",
    false,
    ["deriveKey"],
  );

  // Contract + capsule details in salt ensures keys don't cross contracts or capsules
  const salt = ethers.getBytes(
    ethers.keccak256(
      ethers.solidityPacked(
        ["string", "address"],
        ["TimeCapsule-v3", CONTRACT_ADDRESS],
      ),
    ),
  );

  const info = ethers.getBytes(
    ethers.solidityPacked(
      ["string",          "string",      "uint256",  "uint256",  "address"],
      ["capsule-aes-key", capsuleNonce,  issuedAt,   expiresAt,  CONTRACT_ADDRESS],
    ),
  );

  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

// Payload interface - includes optional drand time-lock fields
export interface CapsulePayload {
  encryptedMessage: string;
  encryptedDataKey: string;
  dataIv: string;
  keyIv: string;
  capsuleNonce: string;
  issuedAt: number;   // stored as rounded timestamp
  expiresAt: number;
  version: number;

  // Drand time-lock fields
  drandCiphertext?: string;      // Base64-encoded drand-encrypted payload
  drandRound?: number;           // Drand round when payload became decryptable
  isDrandLocked?: boolean;       // Flag: is payload wrapped with drand timelock?
}

// Additional Authenticated Data - detects tampering with metadata. If metadata is tampered with, AES-GCM authentication fails.
function buildAAD(
  capsuleNonce: string,
  issuedAt: number,
  expiresAt: number,
  version: number,
): Uint8Array {
  const enc = new TextEncoder();
  const parts = [
    enc.encode(capsuleNonce),
    enc.encode(String(issuedAt)),
    enc.encode(String(expiresAt)),
    enc.encode(String(version)),
    enc.encode(CONTRACT_ADDRESS),
  ];
  // Length prefix prevents concatenation tricks (e.g. "12"+"34" vs "1"+"234")
  const total = parts.reduce((n, p) => n + 4 + p.byteLength, 0);
  const aad = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    new DataView(aad.buffer).setUint32(offset, part.byteLength, false);
    offset += 4;
    aad.set(part, offset);
    offset += part.byteLength;
  }
  return aad;
}

// Encrypt message for wallet - creates CapsulePayload with encryption and signature
export async function encryptForWallet(
  signer: ethers.Signer,
  plaintext: string,
  unlockDate: number,
): Promise<CapsulePayload> {
  await signer.getAddress().catch(() => {
    throw new Error("[Encrypt] Signer is not usable — call setSignatureSigner() first");
  });

  const issuedAt = roundTimestamp(Math.floor(Date.now() / 1000));
  const expiresAt = unlockDate;
  const version = 3;
  const capsuleNonce = toHex(randomBytes(16));

  const aad = buildAAD(capsuleNonce, issuedAt, expiresAt, version);
  const masterKey = await deriveMasterKeyFromAddress(
    signer,
    capsuleNonce,
    issuedAt,
    expiresAt,
  );

  // Generate a random per-message data key.
  const dataKeyRaw = randomBytes(32);
  const dataIv = randomBytes(12);
  const keyIv = randomBytes(12);

  try {
    const dataKey = await crypto.subtle.importKey(
      "raw",
      dataKeyRaw,
      "AES-GCM",
      false,
      ["encrypt", "decrypt"],
    );

    // Pass AAD to encrypt calls so MAC covers metadata
    const encryptedMessage = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: dataIv, additionalData: aad },
      dataKey,
      new TextEncoder().encode(plaintext),
    );

    const encryptedDataKey = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: keyIv, additionalData: aad },
      masterKey,
      dataKeyRaw,
    );

    return {
      encryptedMessage: toHex(new Uint8Array(encryptedMessage)),
      encryptedDataKey: toHex(new Uint8Array(encryptedDataKey)),
      dataIv: toHex(dataIv),
      keyIv: toHex(keyIv),
      capsuleNonce,
      issuedAt,
      expiresAt,
      version,
    };
  } finally {
    zeroize(dataKeyRaw);
  }
}

export async function decryptForWallet(
  signer: ethers.Signer,
  payload: CapsulePayload,
): Promise<string> {
  if (!SUPPORTED_VERSIONS.has(payload.version)) {
    throw new Error(
      `Unsupported capsule version: ${payload.version}. Supported: ${[...SUPPORTED_VERSIONS].join(", ")}`,
    );
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds < payload.expiresAt) {
    const unlockDate = new Date(payload.expiresAt * 1000).toISOString();
    throw new Error(`Capsule is time-locked until ${unlockDate}`);
  }

  await signer.getAddress().catch(() => {
    throw new Error("[Decrypt] Signer is not usable — call setSignatureSigner() first");
  });

  // Recreate AAD used during encryption
  const aad = buildAAD(
    payload.capsuleNonce,
    payload.issuedAt,
    payload.expiresAt,
    payload.version,
  );

  const masterKey = await deriveMasterKeyFromAddress(
    signer,
    payload.capsuleNonce,
    payload.issuedAt,
    payload.expiresAt,
  );

  const dataKeyRaw = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromHex(payload.keyIv), additionalData: aad },
      masterKey,
      fromHex(payload.encryptedDataKey),
    ),
  );

  try {
    const dataKey = await crypto.subtle.importKey(
      "raw",
      dataKeyRaw,
      "AES-GCM",
      false,
      ["decrypt"],
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromHex(payload.dataIv), additionalData: aad },
      dataKey,
      fromHex(payload.encryptedMessage),
    );

    return new TextDecoder().decode(decrypted);
  } finally {
    // Clear the key bytes from memory
    zeroize(dataKeyRaw);
  }
}


// Timeout wrapper for async operations
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

// Feature flag: enables drand time-lock encryption wrapper
export function shouldApplyDrandTimelock(): boolean {
  return import.meta.env.VITE_ENABLE_DRAND_TIMELOCK === "true";
}

// Wrap capsule payload with drand time-lock encryption
export async function wrapWithDrandTimelock(
  payload: CapsulePayload,
  unlockDate: number,
): Promise<CapsulePayload> {
  try {
    console.log("[Drand] Wrapping payload with time-lock encryption...");
    const payloadJson = JSON.stringify(payload);

    // Get drand client and encrypt the payload with 10-second timeout
    const client = quicknet();
    const encrypted = await withTimeout(
      drandEncrypt(client, payloadJson, unlockDate * 1000),
      10000,
      "[Drand] Encryption",
    );

    console.log(`[Drand] Payload wrapped successfully. Round: ${encrypted.drandRound}`);

    // Return wrapped payload with drand fields set
    return {
      encryptedMessage: "",    // Clear original encryption
      encryptedDataKey: "",
      dataIv: "",
      keyIv: "",
      capsuleNonce: payload.capsuleNonce,
      issuedAt: payload.issuedAt,
      expiresAt: unlockDate,
      version: payload.version,
      isDrandLocked: true,
      drandCiphertext: encrypted.ciphertext,
      drandRound: encrypted.drandRound,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Drand] Failed to wrap with timelock:", errorMsg);

    // Provide helpful error message to user
    let userMessage = "Failed to apply time-lock encryption";
    if (errorMsg.includes("timed out")) {
      userMessage = "Time-lock service is slow - please try again in a moment";
    } else if (errorMsg.includes("CORS")) {
      userMessage = "Network error connecting to time-lock service - please check your connection";
    } else if (errorMsg.includes("round")) {
      userMessage = "Invalid unlock time - please choose a future date";
    } else if (errorMsg.includes("NETWORK") || errorMsg.includes("fetch")) {
      userMessage = "Network error - please check your internet connection";
    }

    throw new Error(userMessage);
  }
}

// Unwrap drand time-locked payload to recover original capsule
export async function unwrapDrandTimelock(
  payload: CapsulePayload,
): Promise<CapsulePayload> {
  try {
    if (!payload.isDrandLocked || !payload.drandCiphertext) {
      throw new Error("Payload is not drand-locked or missing ciphertext");
    }

    console.log(`[Drand] Unwrapping drand-locked payload (round: ${payload.drandRound})...`);

    // Get drand client and decrypt with 10-second timeout
    const client = quicknet();
    const decrypted = await withTimeout(
      drandDecrypt(client, payload.drandCiphertext, payload.expiresAt * 1000),
      10000,
      "[Drand] Decryption",
    );

    const recoveredPayload = JSON.parse(decrypted.plaintext) as CapsulePayload;

    console.log("[Drand] Payload unwrapped successfully");

    if (
      !recoveredPayload.encryptedMessage ||
      !recoveredPayload.encryptedDataKey ||
      !recoveredPayload.capsuleNonce
    ) {
      throw new Error("Recovered payload is malformed");
    }

    // Return the recovered original payload (without drand fields)
    return recoveredPayload;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[Drand] Failed to unwrap timelock:", errorMsg);

    if (
      errorMsg.includes("round not available") ||
      errorMsg.includes("UNAVAILABLE")
    ) {
      throw new Error(
        `Drand round not yet available: Capsule is too early to unlock. Please wait for the drand round ${payload.drandRound} to be released.`,
      );
    }

    if (errorMsg.includes("timed out")) {
      throw new Error(
        "Drand service is taking too long to respond. Please try again in a moment.",
      );
    }

    if (errorMsg.includes("network") || errorMsg.includes("CORS")) {
      throw new Error(
        "Network error connecting to drand time-lock service. Please check your internet connection and try again.",
      );
    }

    if (errorMsg.includes("malformed")) {
      throw new Error(
        "Capsule data is corrupted or was modified. Unable to decrypt.",
      );
    }

    throw new Error(
      `Failed to decrypt time-locked capsule: ${errorMsg}`,
    );
  }
}