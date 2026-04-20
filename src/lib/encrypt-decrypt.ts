import { BrowserProvider, ethers } from "ethers";
import { getWalletClient } from "@wagmi/core";
import { config } from "@/components/Wallet";
import { WalletClient } from "viem";
import { BLOCKCHAIN_CONFIG } from "@/lib/config";

/* ------------------------------------------------------------------ */
/* Config                                                               */
/* ------------------------------------------------------------------ */

// Chain ID and contract address sourced from central config — no magic constants.
// CONTRACT_ADDRESS is checksum-validated at module load so a bad config value
// throws immediately rather than silently deriving wrong keys at runtime.
const SEPOLIA_CHAIN_ID = BigInt(BLOCKCHAIN_CONFIG.chainId);
export const CONTRACT_ADDRESS = ethers.getAddress(BLOCKCHAIN_CONFIG.contractAddress);

// SUPPORTED_VERSIONS — add new versions here, never remove old ones.
const SUPPORTED_VERSIONS = new Set([3]);

// FIX [High]: Round issuedAt to 15-minute windows to reduce timing oracle
// precision. Still unique enough for key derivation, but no longer leaks
// exact creation time.
const TIMESTAMP_GRANULARITY_SECONDS = 15 * 60;
function roundTimestamp(ts: number): number {
  return Math.floor(ts / TIMESTAMP_GRANULARITY_SECONDS) * TIMESTAMP_GRANULARITY_SECONDS;
}

/* ------------------------------------------------------------------ */
/* Wallet signer                                                        */
/* ------------------------------------------------------------------ */

// FIX [High]: Eliminate module-level mutable global signer.
// Callers should hold their own signer reference obtained from
// setSignatureSigner() and pass it directly into encrypt/decrypt.
// The legacy getSigner() accessor is retained for backward compat but
// deprecated — it cannot be made safe in a multi-tab context.

let _signer: ethers.Signer | null = null;
let _lastSignerAddress: string | null = null;

export async function setSignatureSigner(
  walletClient?: WalletClient,
): Promise<ethers.Signer> {
  if (walletClient) {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    const s = await provider.getSigner();
    _signer = s;
    _lastSignerAddress = await s.getAddress();
    console.log(`[Signer] Set signer for address: ${_lastSignerAddress}`);
    return s;
  }
  const wc = await getWalletClient(config as Parameters<typeof getWalletClient>[0]);
  if (!wc) {
    console.warn("[Signer] No wallet client available");
    _signer = null;
    _lastSignerAddress = null;
    throw new Error("No wallet connected");
  }
  const provider = new ethers.BrowserProvider(wc.transport);
  const s = await provider.getSigner();
  _signer = s;
  _lastSignerAddress = await s.getAddress();
  console.log(`[Signer] Set signer for address: ${_lastSignerAddress}`);
  return s;
}

/** @deprecated — hold the signer returned by setSignatureSigner() instead */
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

/* ------------------------------------------------------------------ */
/* Utils                                                                */
/* ------------------------------------------------------------------ */

export function randomBytes(length: number): Uint8Array {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

export function toHex(bytes: Uint8Array): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// FIX [Medium]: Validate hex input before parsing to produce clean errors
// instead of bare TypeErrors on malformed payloads.
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

/* ------------------------------------------------------------------ */
/* Typed data (authorization only)                                      */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Master key derivation                                                */
/* ------------------------------------------------------------------ */

export async function deriveMasterKeyFromAddress(
  signer: ethers.Signer,
  capsuleNonce: string,
  issuedAt: number,
  expiresAt: number,
): Promise<CryptoKey> {
  // SECURITY — per-capsule signature isolation.
  //
  // capsuleNonce lives INSIDE the EIP-712 typed-data struct that is signed.
  // This means:
  //   - Each capsule requires its own independent wallet signature.
  //   - An attacker who captures signature_A can re-derive only capsule A's key.
  //   - Replaying signature_A against capsule B's payload fails: the IKM is
  //     bound to capsule A's nonce, so HKDF produces the wrong key entirely.
  //   - Blast radius of any single leaked signature = exactly ONE capsule.
  //
  // Determinism is fully preserved: given the same wallet + same capsule
  // inputs, signTypedData always returns the same signature (ECDSA with the
  // same private key + same hash = same (r, s) for deterministic wallets).
  const { domain, types, value } = getTypedData(capsuleNonce, issuedAt, expiresAt);
  const signature = await signer.signTypedData(domain, types, value);

  // IKM: keccak256 of the raw signature bytes → uniform 32-byte secret.
  // The signature already commits to capsuleNonce (via EIP-712 struct hash),
  // so this IKM is capsule-specific by construction.
  // ethers.getBytes(signature) converts the 0x-prefixed hex sig to raw bytes
  // before hashing — avoids encoding ambiguity.
  const ikm = ethers.getBytes(ethers.keccak256(ethers.getBytes(signature)));

  const baseKey = await crypto.subtle.importKey(
    "raw",
    ikm,
    "HKDF",
    false,
    ["deriveKey"],
  );

  // SALT: stable domain constant — independent of IKM (RFC 5869 §3.1).
  // Encodes protocol + version + contract so keys from different deployments
  // or protocol versions are fully disjoint even if IKM collides.
  const salt = ethers.getBytes(
    ethers.keccak256(
      ethers.solidityPacked(
        ["string", "address"],
        ["TimeCapsule-v3", CONTRACT_ADDRESS],
      ),
    ),
  );

  // INFO: structured per-capsule context binding.
  // Even in the (impossible) case of IKM collision across two capsules,
  // differing nonces here guarantee different output keys.
  // solidityPacked gives canonical, unambiguous encoding matching on-chain.
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

/* ------------------------------------------------------------------ */
/* Payload type                                                         */
/* ------------------------------------------------------------------ */

export interface CapsulePayload {
  encryptedMessage: string;
  encryptedDataKey: string;
  dataIv: string;
  keyIv: string;
  capsuleNonce: string;
  issuedAt: number;   // stored as rounded timestamp
  expiresAt: number;
  version: number;
}

/* ------------------------------------------------------------------ */
/* AAD construction                                                     */
/*                                                                      */
/* FIX [Critical]: Bind all plaintext metadata fields into AES-GCM's   */
/* Additional Authenticated Data so that tampering with capsuleNonce,  */
/* issuedAt, expiresAt, or version is detected and causes decryption   */
/* to fail with an explicit authentication error.                       */
/* ------------------------------------------------------------------ */

function buildAAD(
  capsuleNonce: string,
  issuedAt: number,
  expiresAt: number,
  version: number,
): Uint8Array {
  // Deterministic canonical encoding: fields are length-prefixed to prevent
  // ambiguous concatenations (e.g. "12" + "34" vs "1" + "234").
  const enc = new TextEncoder();
  const parts = [
    enc.encode(capsuleNonce),
    enc.encode(String(issuedAt)),
    enc.encode(String(expiresAt)),
    enc.encode(String(version)),
    enc.encode(CONTRACT_ADDRESS),
  ];
  // Compute total length
  const total = parts.reduce((n, p) => n + 4 + p.byteLength, 0);
  const aad = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    // 4-byte big-endian length prefix
    new DataView(aad.buffer).setUint32(offset, part.byteLength, false);
    offset += 4;
    aad.set(part, offset);
    offset += part.byteLength;
  }
  return aad;
}

/* ------------------------------------------------------------------ */
/* Encrypt                                                              */
/* ------------------------------------------------------------------ */

export async function encryptForWallet(
  signer: ethers.Signer,
  plaintext: string,
  unlockDate: number,
): Promise<CapsulePayload> {
  // FIX [High]: Validate the signer before proceeding to avoid silently
  // encrypting to the wrong key with a stale cached signer.
  const signerAddr = await signer.getAddress().catch(() => {
    throw new Error("[Encrypt] Signer is not usable — call setSignatureSigner() first");
  });
  console.log(`[Encrypt] Using signer address: ${signerAddr}`);

  // FIX [Low]: Round issuedAt to reduce timing oracle precision.
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

    // FIX [Critical]: Pass AAD to both encrypt calls so the ciphertext MAC
    // covers the metadata. Both calls must use the same AAD on decrypt.
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
    // FIX [Low]: Zero raw key bytes immediately after use regardless of
    // success or failure. JS GC does not zero memory.
    zeroize(dataKeyRaw);
  }
}

/* ------------------------------------------------------------------ */
/* Decrypt                                                              */
/* ------------------------------------------------------------------ */

export async function decryptForWallet(
  signer: ethers.Signer,
  payload: CapsulePayload,
): Promise<string> {
  // FIX [Medium]: Reject unsupported versions explicitly before any
  // crypto work, so schema mismatches produce a clear error.
  if (!SUPPORTED_VERSIONS.has(payload.version)) {
    throw new Error(
      `Unsupported capsule version: ${payload.version}. Supported: ${[...SUPPORTED_VERSIONS].join(", ")}`,
    );
  }

  // FIX [High]: Enforce the time lock. expiresAt is in the key derivation but
  // was never checked — callers could bypass it entirely.
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (nowSeconds < payload.expiresAt) {
    const unlockDate = new Date(payload.expiresAt * 1000).toISOString();
    throw new Error(`Capsule is time-locked until ${unlockDate}`);
  }

  // FIX [High]: Validate signer before deriving keys.
  const signerAddr = await signer.getAddress().catch(() => {
    throw new Error("[Decrypt] Signer is not usable — call setSignatureSigner() first");
  });
  console.log(`[Decrypt] Using signer address: ${signerAddr}`);

  // Reconstruct the same AAD that was used during encryption.
  // FIX [Critical]: Any tampering with these plaintext fields will cause
  // AES-GCM authentication to fail before any plaintext is produced.
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

  // FIX [Medium]: fromHex now validates input; any malformed hex throws a
  // clean descriptive error rather than a bare TypeError.
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
    // FIX [Low]: Zero decrypted key bytes immediately after import.
    zeroize(dataKeyRaw);
  }
}