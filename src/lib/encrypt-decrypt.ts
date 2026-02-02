import { BrowserProvider, ethers } from "ethers";

/* ------------------------------------------------------------------ */
/* Config                                                             */
/* ------------------------------------------------------------------ */

const SEPOLIA_CHAIN_ID = 11155111n;
const CONTRACT_ADDRESS = "0x330b880e6eAD0B2c7C837C3F2cb1B4c5D6D3e733";

let signer: ethers.Signer | null = null;

/* ------------------------------------------------------------------ */
/* Wallet signer                                                      */
/* ------------------------------------------------------------------ */

export async function setSignatureSigner(): Promise<ethers.Signer> {
    if (!window.ethereum) throw new Error("No injected wallet");

    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_CHAIN_ID) {
        throw new Error("Please switch to Sepolia");
    }

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
    return [...bytes].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function fromHex(hex: string) {
    return new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
}

/* ------------------------------------------------------------------ */
/* Typed data (authorization only)                                    */
/* ------------------------------------------------------------------ */

function getTypedData(
    capsuleNonce: string,
    issuedAt: number,
    expiresAt: number
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
    expiresAt: number
): Promise<CryptoKey> {
    if (Math.floor(Date.now() / 1000) > expiresAt) {
        throw new Error("Authorization expired");
    }

    const { domain, types, value } = getTypedData(
        capsuleNonce,
        issuedAt,
        expiresAt
    );

    // Sign typed data
    const signature = await signer.signTypedData(domain, types, value);

    // Recover address for deterministic identity
    const address = ethers.verifyTypedData(domain, types, value, signature);

    // KDF input
    const kdfInput = ethers.solidityPacked(
        ["address", "bytes16", "uint256", "uint256"],
        [address, "0x" + capsuleNonce, issuedAt, expiresAt]
    );

    const baseKey = await crypto.subtle.importKey(
        "raw",
        ethers.getBytes(ethers.keccak256(kdfInput)),
        "HKDF",
        false,
        ["deriveKey"]
    );

    return crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt: ethers.getBytes(
                ethers.keccak256(
                    ethers.solidityPacked(
                        ["string", "address"],
                        ["TimeCapsule", CONTRACT_ADDRESS]
                    )
                )
            ),
            info: new TextEncoder().encode("capsule-aes-key"),
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
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
    validForSeconds = 300,
    sessionKey?: CryptoKey
): Promise<CapsulePayload> {
    const issuedAt = Math.floor(Date.now() / 1000);
    const expiresAt = issuedAt + validForSeconds;
    const capsuleNonce = toHex(randomBytes(16));

    const masterKey = sessionKey ?? await deriveMasterKeyFromAddress(
        signer,
        capsuleNonce,
        issuedAt,
        expiresAt
    );

    const dataKeyRaw = randomBytes(32);
    const dataIv = randomBytes(12);
    const keyIv = randomBytes(12);

    const dataKey = await crypto.subtle.importKey(
        "raw",
        dataKeyRaw,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
    );

    const encryptedMessage = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: dataIv },
        dataKey,
        new TextEncoder().encode(plaintext)
    );

    const encryptedDataKey = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: keyIv },
        masterKey,
        dataKeyRaw
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
    payload: CapsulePayload
): Promise<string> {
    const masterKey = await deriveMasterKeyFromAddress(
        signer,
        payload.capsuleNonce,
        payload.issuedAt,
        payload.expiresAt
    );

    const dataKeyRaw = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromHex(payload.keyIv) },
        masterKey,
        fromHex(payload.encryptedDataKey)
    );

    const dataKey = await crypto.subtle.importKey(
        "raw",
        dataKeyRaw,
        "AES-GCM",
        false,
        ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: fromHex(payload.dataIv) },
        dataKey,
        fromHex(payload.encryptedMessage)
    );

    return new TextDecoder().decode(decrypted);
}
