import { BrowserProvider, ethers } from "ethers";
import { getWalletClient } from "@wagmi/core";
import { config } from "@/components/Wallet";
import { WalletClient } from "viem";
/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */

const SEPOLIA_CHAIN_ID = 11155111n;
const CONTRACT_ADDRESS = "0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926";

let signer: ethers.Signer | null = null;

/* ------------------------------------------------------------------ */
/* Wallet signer                                                      */
/* ------------------------------------------------------------------ */

export async function setSignatureSigner(
  walletClient?: WalletClient,
): Promise<ethers.Signer> {
  if (walletClient) {
    const provider = new ethers.BrowserProvider(walletClient.transport);
    signer = await provider.getSigner();
    return signer;
  }
  // fallback to existing logic
  const wc = await getWalletClient(config);
  if (!wc) throw new Error("No wallet connected");
  const provider = new ethers.BrowserProvider(wc.transport);
  signer = await provider.getSigner();
  return signer;
}

export function getSigner(): ethers.Signer {
  if (!signer) throw new Error("Signer not initialized");
  return signer;
}

export function clearSignatureSigner() {
  signer = null;
}

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */

export function randomBytes(length: number) {
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  return arr;
}

export function toHex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string) {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
}

/* ------------------------------------------------------------------ */
/* Typed data (authorization only)                                    */
/* ------------------------------------------------------------------ */

function getTypedData(
  capsuleNonce: string,
  issuedAt: number,
  expiresAt: number,
) {
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
/* Master key derivation (CASE 2 / session key)                       */
/* ------------------------------------------------------------------ */

export async function deriveMasterKeyFromAddress(
  signer: ethers.Signer,
  capsuleNonce: string,
  issuedAt: number,
  expiresAt: number,
): Promise<CryptoKey> {
  const { domain, types, value } = getTypedData(
    capsuleNonce,
    issuedAt,
    expiresAt,
  );

  // Sign typed data
  const signature = await signer.signTypedData(domain, types, value);

  // Recover address for deterministic identity
  const address = ethers.verifyTypedData(domain, types, value, signature);

  // KDF input
  const kdfInput = ethers.solidityPacked(
    ["address", "bytes16", "uint256", "uint256"],
    [address, "0x" + capsuleNonce, issuedAt, expiresAt],
  );

  const baseKey = await crypto.subtle.importKey(
    "raw",
    ethers.getBytes(ethers.keccak256(kdfInput)),
    "HKDF",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: ethers.getBytes(
        ethers.keccak256(
          ethers.solidityPacked(
            ["string", "address"],
            ["TimeCapsule", CONTRACT_ADDRESS],
          ),
        ),
      ),
      info: new TextEncoder().encode("capsule-aes-key"),
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

/* ------------------------------------------------------------------ */
/* Encrypt / Decrypt                                                  */
/* ------------------------------------------------------------------ */

export interface CapsulePayload {
  encryptedMessage: string;
  encryptedDataKey: string;
  dataIv: string;
  keyIv: string;
  capsuleNonce: string;
  issuedAt: number;
  expiresAt: number;
  version: number;
}

/**
 * Encrypt a plaintext message
 * If `sessionKey` is provided, it is used instead of deriving a new master key
 */
export async function encryptForWallet(
  signer: ethers.Signer,
  plaintext: string,
  unlockDate: number,
  //sessionKey?: CryptoKey //ignore this
): Promise<CapsulePayload> {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = unlockDate;
  const capsuleNonce = toHex(randomBytes(16));

  const masterKey = await deriveMasterKeyFromAddress(
    signer,
    capsuleNonce,
    issuedAt,
    expiresAt,
  );

  const dataKeyRaw = randomBytes(32);
  const dataIv = randomBytes(12);
  const keyIv = randomBytes(12);

  const dataKey = await crypto.subtle.importKey(
    "raw",
    dataKeyRaw,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );

  const encryptedMessage = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: dataIv },
    dataKey,
    new TextEncoder().encode(plaintext),
  );

  const encryptedDataKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: keyIv },
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
    version: 3,
  };
}

/**
 * Decrypt capsule using session or derived master key
 */
export async function decryptForWallet(
  signer: ethers.Signer,
  payload: CapsulePayload,
): Promise<string> {
  const masterKey = await deriveMasterKeyFromAddress(
    signer,
    payload.capsuleNonce,
    payload.issuedAt,
    payload.expiresAt,
  );

  const dataKeyRaw = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromHex(payload.keyIv) },
    masterKey,
    fromHex(payload.encryptedDataKey),
  );

  const dataKey = await crypto.subtle.importKey(
    "raw",
    dataKeyRaw,
    "AES-GCM",
    false,
    ["decrypt"],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromHex(payload.dataIv) },
    dataKey,
    fromHex(payload.encryptedMessage),
  );

  return new TextDecoder().decode(decrypted);
}
