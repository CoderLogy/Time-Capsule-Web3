import { CapsulePayload, setSignatureSigner } from "./encrypt-decrypt";
import TimeCapsuleAbi from "../../contracts/TimeCapsule.json";
import type { TransactionResponse } from "ethers";
import { ethers } from "ethers";
import { GetUserCapsules, type Capsule } from "./capsule-query";
import { decryptForWallet } from "./encrypt-decrypt";
import { BLOCKCHAIN_CONFIG } from "./config";

let contract: ethers.Contract | null = null;

export async function getContract(): Promise<ethers.Contract> {
  // Always create fresh contract to ensure signer is current
  // This is important for mobile wallet recovery scenarios
  const signer = await setSignatureSigner();
  contract = new ethers.Contract(BLOCKCHAIN_CONFIG.contractAddress, TimeCapsuleAbi.abi, signer);
  console.log("[Contract] Created fresh contract instance with current signer");
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
): Promise<TransactionResponse> {
  const c = await getContract();
  const fee: ethers.BigNumberish = await c.capsuleFee();

  const tx: TransactionResponse = await c.createCapsule(
    title,
    unlockDate,
    dataURI,
    {
      value: fee,
    },
  );
  console.log("Capsule fee in wei:", fee.toString());
  return tx;
}

export async function fetchCapsulePayload(
  dataUri: string,
): Promise<CapsulePayload> {
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
    return await decryptForWallet(signer, payload);
  } finally {
    // Clear cache after use to ensure fresh state
    clearContract();
  }
}
