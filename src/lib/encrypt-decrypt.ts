// wallet.ts
import { BrowserProvider, ethers } from "ethers";

const ARBITRUM_CHAIN_ID = 11155111n; // Sepolia
let signer: ethers.Signer | null = null;
const CONTRACT_ADDRESS = "0x330b880e6eAD0B2c7C837C3F2cb1B4c5D6D3e733"
/* ------------------------------------------------------------------ */
/* Wallet signer                                                      */
/* ------------------------------------------------------------------ */
export async function setSignatureSigner(): Promise<ethers.Signer> {
    if (!window.ethereum) throw new Error("No injected wallet found!");

    const provider = new BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);

    const network = await provider.getNetwork();
    if (network.chainId !== ARBITRUM_CHAIN_ID)
        throw new Error("Please switch to Arbitrum");

    signer = await provider.getSigner();
    if (!signer) throw new Error("Signature not initialized");
    return signer;
}

export function clearSignatureSigner() {
    signer = null;
}

/* ------------------------------------------------------------------ */
/* Random bytes utility                                               */
/* ------------------------------------------------------------------ */
function randomBytes(length: number): Uint8Array {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
}

/* ------------------------------------------------------------------ */
/* Sign authorization to derive master key                            */
/* ------------------------------------------------------------------ */
export async function deriveMasterKey(
    signer: ethers.Signer,
    capsuleNonce: string,
    issuedAt: number,
    signatureExpiresAt: number
): Promise<CryptoKey> {

    // EIP-712 typed data for capsule authorization
    const domain = {
        name: "TimeCapsule",
        version: "3",
        chainId: ARBITRUM_CHAIN_ID,
        verifyingContract: CONTRACT_ADDRESS,
    };

    const types = {
        Auth: [
            { name: "purpose", type: "string" },
            { name: "capsuleNonce", type: "string" },
            { name: "issuedAt", type: "uint256" },
            { name: "signatureExpiresAt", type: "uint256" },
        ],
    };

    const value = { purpose: "To signin the app", capsuleNonce, issuedAt, signatureExpiresAt };

    const signature = await signer.signTypedData(domain, types, value);

    // Optional: enforce expiry in code
    if (Math.floor(Date.now() / 1000) > signatureExpiresAt)
        throw new Error("Authorization expired");

    // Use signature as input to HKDF for master key
    const sigBuffer = new TextEncoder().encode(signature);
    const salt = new TextEncoder().encode(`TimeCapsule:${capsuleNonce}:${CONTRACT_ADDRESS}`);

    const baseKey = await crypto.subtle.importKey(
        "raw",
        sigBuffer,
        "HKDF",
        false,
        ["deriveKey"]
    );

    const masterKey = await crypto.subtle.deriveKey(
        {
            name: "HKDF",
            hash: "SHA-256",
            salt,
            info: new TextEncoder().encode("aes-key"),
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );

    return masterKey;
}

/* ------------------------------------------------------------------ */
/* Encrypt data with AES-GCM using per-capsule random data key        */
/* ------------------------------------------------------------------ */
export async function encryptForWallet(
    signer: ethers.Signer,
    plaintext: string,
    validForSeconds: number = 3600
) {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + validForSeconds;

    const capsuleNonce = Buffer.from(randomBytes(16)).toString("hex");

    const masterKey = await deriveMasterKey(signer, capsuleNonce, now, expiresAt);

    // Random data key for this capsule
    const dataKeyRaw = randomBytes(32);
    const dataKey = await crypto.subtle.importKey(
        "raw",
        dataKeyRaw,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
    );

    // Encrypt plaintext
    const dataIv = randomBytes(12);
    const encryptedMessageBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: dataIv },
        dataKey,
        new TextEncoder().encode(plaintext)
    );

    // Wrap data key with master key
    const keyIv = randomBytes(12);
    const encryptedDataKeyBuffer = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv: keyIv },
        masterKey,
        dataKeyRaw
    );

    return {
        encryptedMessage: Buffer.from(encryptedMessageBuffer).toString("hex"),
        encryptedDataKey: Buffer.from(encryptedDataKeyBuffer).toString("hex"),
        dataIv: Buffer.from(dataIv).toString("hex"),
        keyIv: Buffer.from(keyIv).toString("hex"),
        capsuleNonce,
        version: 3,
        issuedAt: now,
        //expiresAt
    };
}

/* ------------------------------------------------------------------ */
/* Decrypt data using signature-derived master key                    */
/* ------------------------------------------------------------------ */
export async function decryptForWallet(
    signer: ethers.Signer,
    payload: {
        encryptedMessage: string;
        encryptedDataKey: string;
        dataIv: string;
        keyIv: string;
        capsuleNonce: string;
        issuedAt: number;
        signatureExpiresAt: number;
    }
) {
    // Optional: enforce expiry

    //if (payload.expiresAt && Math.floor(Date.now() / 1000) > payload.expiresAt)
    //  throw new Error("Capsule expired");

    const masterKey = await deriveMasterKey(
        signer,
        payload.capsuleNonce,
        payload.issuedAt,
        payload.signatureExpiresAt
    );

    // Decrypt data key
    const encryptedDataKey = Uint8Array.from(Buffer.from(payload.encryptedDataKey, "hex"));
    const keyIv = Uint8Array.from(Buffer.from(payload.keyIv, "hex"));
    const dataKeyRaw = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: keyIv },
        masterKey,
        encryptedDataKey
    );

    // Import data key
    const dataKey = await crypto.subtle.importKey(
        "raw",
        dataKeyRaw,
        "AES-GCM",
        false,
        ["encrypt", "decrypt"]
    );

    // Decrypt text
    const encryptedMessage = Uint8Array.from(Buffer.from(payload.encryptedMessage, "hex"));
    const dataIv = Uint8Array.from(Buffer.from(payload.dataIv, "hex"));
    const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: dataIv },
        dataKey,
        encryptedMessage
    );

    return new TextDecoder().decode(decryptedBuffer);
}
