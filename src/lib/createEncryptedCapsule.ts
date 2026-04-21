import { ethers, TransactionResponse } from "ethers";
import { encryptForWallet, CapsulePayload, clearSignatureSigner, wrapWithDrandTimelock, shouldApplyDrandTimelock, getProvider, clearProvider } from "./encrypt-decrypt";
import { uploadCapsule } from "@/lib/ipfs";
import { createCapsule, getCapsules, clearContract } from "@/lib/contract-api";
import { toast } from "sonner";
import { getWalletClient } from "@wagmi/core";
import { config } from "@/components/Wallet";

interface CreateEncryptedCapsuleArgs {
  address: string;
  plaintext: string;
  unlockDate: number;
  title: string;
}

async function waitForIndexing(address: string, title: string): Promise<void> {
  // Exponential backoff: poll frequently at first, then slower
  // Sepolia subgraph typically needs 12-30+ seconds to index events
  // Delays: 0ms, 1s, 2s, 5s, 10s, 15s, 20s, 25s, 30s = ~110 seconds total
  const delays = [0, 1000, 2000, 5000, 10000, 15000, 20000, 25000, 30000];

  for (let i = 0; i < delays.length; i++) {
    await new Promise((r) => setTimeout(r, delays[i]));
    try {
      console.log(`[Indexing] Polling for capsule '${title}' (attempt ${i + 1}/${delays.length})...`);
      const capsules = await getCapsules(address);
      if (capsules.some((c) => c.title === title)) {
        console.log(`[Indexing] ✅ Capsule found after ${i} poll attempts (~${delays[i] / 1000}s)`);
        return;
      }
    } catch (err) {
      console.warn(
        `[Indexing] ⚠️  Query failed on attempt ${i + 1}:`,
        err instanceof Error ? err.message : String(err)
      );
      // Continue to next attempt - subgraph may be temporarily unavailable
    }
  }

  // After exhausting all retries, don't throw - capsule may still appear later
  // User will see it on next dashboard refresh (5-second interval)
  console.warn(
    `[Indexing] ⚠️  Capsule not found after ${delays.length} attempts (~${Math.floor(delays.reduce((a, b) => a + b) / 1000)}s total). Indexing may be delayed. Dashboard will auto-refresh shortly.`
  );
}


export async function createEncryptedCapsule({
  address,
  plaintext,
  unlockDate,
  title,
}: CreateEncryptedCapsuleArgs): Promise<TransactionResponse> {
  try {
    console.log("[CreateCapsule] Starting capsule creation for:", title);

    // Get fresh wallet client - retry on mobile since connection can be lost when MetaMask opens
    let walletClient = null;
    let retries = 0;
    const maxRetries = 3;

    while (!walletClient && retries < maxRetries) {
      try {
        walletClient = await getWalletClient(config as Parameters<typeof getWalletClient>[0]);
        if (walletClient) break;
      } catch (err) {
        retries++;
        console.warn(`[CreateCapsule] Wallet client fetch failed (attempt ${retries}/${maxRetries}):`, err);
        if (retries < maxRetries) {
          // Wait before retry
          await new Promise(r => setTimeout(r, 1000 * retries));
        }
      }
    }

    if (!walletClient) {
      console.error("[CreateCapsule] No wallet client available after retries");
      throw new Error("Wallet not connected. Please make sure MetaMask is open and try again.");
    }

    console.log("[CreateCapsule] Got wallet client");

    const provider = await getProvider(walletClient);
    const walletSigner = await provider.getSigner();

    // Validate signer is usable
    const signerAddress = await walletSigner.getAddress();
    console.log("[CreateCapsule] Got signer for address:", signerAddress);

    if (signerAddress.toLowerCase() !== address.toLowerCase()) {
      console.error("[CreateCapsule] Signer address mismatch:", signerAddress, "vs", address);
      throw new Error("Wallet address mismatch. Please check your wallet connection.");
    }

    console.log("[CreateCapsule] Encrypting message...");
    const payload: CapsulePayload = await encryptForWallet(
      walletSigner,
      plaintext,
      unlockDate,
    );

    // Apply drand time-lock encryption if enabled
    let finalPayload = payload;
    if (shouldApplyDrandTimelock()) {
      console.log("[CreateCapsule] Applying drand time-lock encryption...");
      finalPayload = await wrapWithDrandTimelock(payload, unlockDate);
    }

    console.log("[CreateCapsule] Uploading encrypted payload to IPFS...");
    const dataURI = await uploadCapsule(finalPayload, title);

    console.log("[CreateCapsule] Creating transaction...");

    // Add timeout for transaction creation (MetaMask gas price page)
    const transactionPromise = createCapsule(
      title,
      unlockDate,
      dataURI,
      walletClient,
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Transaction creation timed out after 30s. Please check MetaMask and retry.")), 30000)
    );

    const tx: TransactionResponse = await Promise.race([transactionPromise, timeoutPromise]);
    console.log("[CreateCapsule] Transaction hash:", tx.hash);

    console.log("[CreateCapsule] Waiting for transaction confirmation...");
    await tx.wait();

    console.log("[CreateCapsule] Waiting for subgraph indexing...");
    await waitForIndexing(address, title);

    console.log("[CreateCapsule] Capsule created ✅");
    // Clear cached signer and contract to force re-creation on next use
    clearSignatureSigner();
    clearProvider();
    clearContract();

    return tx;
  } catch (err) {
    console.error("[CreateCapsule] Capsule creation failed:", err);

    // Clear cached signer and contract on any error
    clearSignatureSigner();
    clearProvider();
    clearContract();

    const errorMessage = err instanceof Error ? err.message : String(err);

    // User-friendly error messages for common issues
    if (errorMessage.includes("User rejected")) {
      toast.error("You rejected the transaction in your wallet");
    } else if (errorMessage.includes("Wallet")) {
      toast.error("Wallet connection issue - please reconnect");
    } else if (errorMessage.includes("network")) {
      toast.error("Network error - please check your connection");
    } else {
      toast.error("Capsule creation failed — check console for details");
      if ((err as Error & { data?: unknown }).data)
        console.error("[CreateCapsule] Revert data:", (err as Error & { data?: unknown }).data);
    }

    throw err;
  }
}

