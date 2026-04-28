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

export async function getCapsuleFee(): Promise<ethers.BigNumberish | null> {
  try {
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
    const c = new ethers.Contract(BLOCKCHAIN_CONFIG.contractAddress, TimeCapsuleAbi.abi, provider);
    const fee = await c.capsuleFee();
    console.log('[CapsuleFee] Fee fetched from contract:', fee.toString());
    return fee;
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
    const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
    const feeData = await provider.getFeeData();

    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      console.warn('[GasPrices] FeeData incomplete:', feeData);
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

// Calculate total cost (capsule fee + gas costs)
export async function getTotalCapsuleCost(): Promise<{
  capsuleFee: ethers.BigNumberish | null;
  gasCost: ethers.BigNumberish | null;
  totalCost: ethers.BigNumberish | null;
} | null> {
  try {
    const capsuleFee = await getCapsuleFee();
    const gasData = await getGasPrices();

    if (!capsuleFee || !gasData?.maxFeePerGas) {
      console.warn('[TotalCost] Missing fee or gas data');
      return null;
    }

    // Estimated gas for createCapsule transaction: ~150k gas
    const estimatedGas = BigInt(150000);
    const gasCost = estimatedGas * BigInt(gasData.maxFeePerGas.toString());
    const totalCost = BigInt(capsuleFee.toString()) + gasCost;

    return {
      capsuleFee,
      gasCost,
      totalCost,
    };
  } catch (error) {
    console.error('[TotalCost] Failed to calculate total cost:', error);
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
    const data = await res.json();

    // This supports both old format (nested) and new format (flat)
    let payload = data;
    if (data.data && typeof data.data === 'string') {
        try {
            payload = JSON.parse(data.data);
        } catch (e) {
            console.error('[FetchPayload] Failed to parse nested data field:', e);
            // Fall back to using data as-is if parsing fails
            payload = data;
        }
    }

    if (!payload.version) {
        throw new Error(
            `Invalid capsule payload: missing or undefined version. Got: ${JSON.stringify(Object.keys(payload))}`
        );
    }

    console.log('[FetchPayload] Successfully fetched payload with version:', payload.version);
    return payload;
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
        clearProvider();
        clearContract();
    }
}
