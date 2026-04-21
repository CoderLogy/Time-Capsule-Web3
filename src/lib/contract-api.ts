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

/**
 * Fetch current gas prices from the RPC
 */
export async function getGasPrices(): Promise<{
  maxFeePerGas: ethers.BigNumberish;
  maxPriorityFeePerGas: ethers.BigNumberish;
  baseFee: ethers.BigNumberish;
} | null> {
  try {
    const provider = await getProvider();
    const feeData = await provider.getFeeData();

    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      console.warn('[GasPrices] FeeData incomplete:', feeData);
      return null;
    }

    return {
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      baseFee: feeData.gasPrice || feeData.maxFeePerGas, // fallback to maxFeePerGas if gasPrice unavailable
    };
  } catch (error) {
    console.error('[GasPrices] Failed to fetch gas prices:', error);
    return null;
  }
}

export async function getContract(walletClient?: WalletClient): Promise<ethers.Contract> {
    // Use getProvider to ensure we have a single provider instance
    const provider = await getProvider(walletClient);
    // Use setSignatureSigner which will also use the same provider
    const signer = await setSignatureSigner(walletClient);
    contract = new ethers.Contract(BLOCKCHAIN_CONFIG.contractAddress, TimeCapsuleAbi.abi, signer);
    console.log("[Contract] Created contract with shared provider instance");
    return contract;
}

/**
 * Clear cached contract instance - call this when wallet state changes
 */
export function clearContract() {
    console.log("[Contract] Clearing cached contract");
    contract = null;
}

export async function createCapsule(
    title: string,
    unlockDate: number,
    dataURI: string,
    walletClient?: WalletClient
): Promise<TransactionResponse> {
    const c = await getContract(walletClient);
    const fee: ethers.BigNumberish = await c.capsuleFee();

    const tx: TransactionResponse = await c.createCapsule(title, unlockDate, dataURI, {
        value: fee
    });
    console.log("Capsule fee in wei:", fee.toString());
    return tx;
}

export async function fetchCapsulePayload(dataUri: string): Promise<CapsulePayload> {
    const res = await fetch(dataUri);
    if (!res.ok) throw new Error("Failed to fetch IP");
    return res.json();
}

export async function getCapsules(owner: string): Promise<Capsule[]> {
    const capsules = await GetUserCapsules(owner);
    return capsules.map((c) => ({ ...c, message: undefined }));
}

// Called only when user clicks "Open Capsule" — fetches IPFS then decrypts
export async function openCapsule(dataURI: string): Promise<string> {
    const signer = await setSignatureSigner();
    const payload = await fetchCapsulePayload(dataURI);
    console.log("Payload from Pinata:", payload);
    try {
        // Unwrap drand time-lock if present
        let decryptPayload = payload;
        if (payload.isDrandLocked && payload.drandCiphertext) {
            console.log("[OpenCapsule] Unwrapping drand time-locked payload...");
            decryptPayload = await unwrapDrandTimelock(payload);
        }

        return await decryptForWallet(signer, decryptPayload);
    } finally {
        // Clear cache after use to ensure fresh state
        clearProvider();
        clearContract();
    }
}
