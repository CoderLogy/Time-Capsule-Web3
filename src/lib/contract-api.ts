import {
    CapsulePayload,
    setSignatureSigner,
    decryptForWallet,
    unwrapDrandTimelock,
    getProvider,
    clearProvider
} from "./encrypt-decrypt";
import TimeCapsuleAbi from "../../contracts/TimeCapsule.json";
import type { TransactionResponse } from "ethers";
import { ethers } from "ethers";
import { GetUserCapsules, type Capsule } from "./capsule-query";
import { BLOCKCHAIN_CONFIG } from "./config";
import { WalletClient } from "viem";

let contract: ethers.Contract | null = null;

let cachedFee: ethers.BigNumberish | null = null;
let cachedFeeExpiry: number = 0;
const FEE_CACHE_TTL = 60 * 1000;

function getReadOnlyProvider(): ethers.JsonRpcProvider {
    return new ethers.JsonRpcProvider(BLOCKCHAIN_CONFIG.rpcUrl);
}

export async function getCapsuleFee(): Promise<ethers.BigNumberish | null> {
    if (cachedFee && Date.now() < cachedFeeExpiry) {
        return cachedFee;
    }

    try {
        const provider = getReadOnlyProvider();
        const c = new ethers.Contract(BLOCKCHAIN_CONFIG.contractAddress, TimeCapsuleAbi.abi, provider);
        cachedFee = await c.capsuleFee();
        cachedFeeExpiry = Date.now() + FEE_CACHE_TTL;
        return cachedFee;
    } catch (error) {
        console.error('[CapsuleFee] Failed to fetch capsule fee:', error);
        return null;
    }
}

export async function getGasPrices(): Promise<{
    maxFeePerGas: ethers.BigNumberish;
    maxPriorityFeePerGas: ethers.BigNumberish;
    baseFee: ethers.BigNumberish;
} | null> {
    try {
        const provider = getReadOnlyProvider();
        const feeData = await provider.getFeeData();

        if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
            return null;
        }

        return {
            maxFeePerGas: feeData.maxFeePerGas,
            maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
            baseFee: feeData.gasPrice || feeData.maxFeePerGas,
        };
    } catch (error) {
        console.error('[GasPrices] Failed to fetch gas prices:', error);
        return null;
    }
}

export async function getTotalCapsuleCost(): Promise<{
    capsuleFee: ethers.BigNumberish | null;
    gasCost: ethers.BigNumberish | null;
    totalCost: ethers.BigNumberish | null;
} | null> {
    try {
        const [capsuleFee, gasData] = await Promise.all([
            getCapsuleFee(),
            getGasPrices(),
        ]);

        if (!capsuleFee || !gasData?.maxFeePerGas) {
            return null;
        }

        const estimatedGas = BigInt(150000);
        const gasCost = estimatedGas * BigInt(gasData.maxFeePerGas.toString());
        const totalCost = BigInt(capsuleFee.toString()) + gasCost;

        return { capsuleFee, gasCost, totalCost };
    } catch (error) {
        console.error('[TotalCost] Failed to calculate total cost:', error);
        return null;
    }
}

async function getSignerForContract(walletClient?: WalletClient): Promise<ethers.Signer> {
    if (typeof window !== "undefined" && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        return provider.getSigner();
    }

    const provider = await getProvider(walletClient);
    return setSignatureSigner(walletClient);
}

export async function getContract(walletClient?: WalletClient): Promise<ethers.Contract> {
    const signer = await getSignerForContract(walletClient);
    contract = new ethers.Contract(BLOCKCHAIN_CONFIG.contractAddress, TimeCapsuleAbi.abi, signer);
    return contract;
}

export function clearContract() {
    contract = null;
}

export async function createCapsule(
    title: string,
    unlockDate: number,
    dataURI: string,
    walletClient?: WalletClient
): Promise<TransactionResponse> {
    const c = await getContract(walletClient);
    const fee = await getCapsuleFee() ?? await c.capsuleFee();

    const tx: TransactionResponse = await c.createCapsule(title, unlockDate, dataURI, {
      value: fee,
       gasLimit: 250000
    });
    return tx;
}

function validateDataUri(uri: string): { valid: boolean; error?: string } {
    if (typeof uri !== "string" || uri.length === 0) {
        return { valid: false, error: "dataUri must be a non-empty string" };
    }

    if (uri.startsWith("ipfs://")) {
        return { valid: true };
    }

    if (uri.startsWith("https://")) {
        const allowedGateways = [
            "gateway.pinata.cloud",
            "aquamarine-kind-gull-833.mypinata.cloud",
        ];

        const uriUrl = new URL(uri);
        const isAllowed = allowedGateways.some((gateway) =>
            uriUrl.hostname.includes(gateway)
        );

        if (!isAllowed) {
            return {
                valid: false,
                error: "dataUri domain not whitelisted for IPFS gateway",
            };
        }

        return { valid: true };
    }

    return {
        valid: false,
        error: "dataUri must start with ipfs:// or https:// from whitelisted gateway",
    };
}

export async function fetchCapsulePayload(
    dataUri: string
): Promise<CapsulePayload> {
    const uriValidation = validateDataUri(dataUri);
    if (!uriValidation.valid) {
        throw new Error(`Invalid data URI: ${uriValidation.error}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(dataUri, { signal: controller.signal });

        if (!res.ok) {
            throw new Error(`Failed to fetch capsule payload: HTTP ${res.status}`);
        }

        const contentLength = res.headers.get("content-length");
        if (contentLength) {
            const size = parseInt(contentLength, 10);
            const maxSize = 1024 * 1024;
            if (size > maxSize) {
                throw new Error(
                    `Capsule payload too large: ${size} bytes (max ${maxSize} bytes)`
                );
            }
        }

        const data = await res.json();

        let payload = data;
        if (data.data && typeof data.data === "string") {
            try {
                payload = JSON.parse(data.data);
            } catch (e) {
                payload = data;
            }
        }

        if (!payload.version) {
            throw new Error(
                `Invalid capsule payload: missing or undefined version. Got: ${JSON.stringify(Object.keys(payload))}`
            );
        }

        return payload;
    } catch (error) {
        const msg =
            error instanceof Error ? error.message : "Unknown error fetching payload";

        if (msg.includes("CORS")) {
            throw new Error("Failed to fetch capsule: Network error (CORS)");
        }
        if (msg.includes("abort")) {
            throw new Error("Capsule fetch timeout - please try again");
        }

        throw new Error(msg);
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function getCapsules(owner: string): Promise<Capsule[]> {
    const capsules = await GetUserCapsules(owner);
    return capsules.map((c) => ({ ...c, message: undefined }));
}

export async function openCapsule(dataURI: string): Promise<string> {
    const signer = await setSignatureSigner();
    const payload = await fetchCapsulePayload(dataURI);
    try {
        let decryptPayload = payload;
        if (payload.isDrandLocked && payload.drandCiphertext) {
            decryptPayload = await unwrapDrandTimelock(payload);
        }

        return await decryptForWallet(signer, decryptPayload);
    } finally {
        clearProvider();
        clearContract();
    }
}