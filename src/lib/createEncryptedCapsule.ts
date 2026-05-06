import { ethers, TransactionResponse } from "ethers";
import { encryptForWallet, CapsulePayload, clearSignatureSigner, wrapWithDrandTimelock, shouldApplyDrandTimelock, getProvider, clearProvider } from "./encrypt-decrypt";
import { uploadCapsule } from "@/lib/ipfs";
import { createCapsule, getCapsules, clearContract } from "@/lib/contract-api";
import { toast } from "sonner";

interface CreateEncryptedCapsuleArgs {
  address: string;
  plaintext: string;
  unlockDate: number;
  title: string;
}

async function waitForIndexing(address: string, title: string): Promise<void> {
  const delays = [0, 1000, 2000, 5000, 10000, 15000, 20000, 25000, 60000];

  for (let i = 0; i < delays.length; i++) {
    await new Promise((r) => setTimeout(r, delays[i]));
    try {
      const capsules = await getCapsules(address);
      if (capsules.some((c) => c.title === title)) {
        return;
      }
    } catch (err) {
    }
  }
}

export async function createEncryptedCapsule({
    address,
    plaintext,
    unlockDate,
    title
}: CreateEncryptedCapsuleArgs): Promise<TransactionResponse> {
    try {
        if (!window.ethereum) {
            throw new Error(
                "Wallet not connected. Please make sure MetaMask is open and try again."
            );
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const walletSigner = await provider.getSigner();
        const signerAddress = await walletSigner.getAddress();

        if (signerAddress.toLowerCase() !== address.toLowerCase()) {
            throw new Error("Wallet address mismatch. Please check your wallet connection.");
        }

        const payload: CapsulePayload = await encryptForWallet(walletSigner, plaintext, unlockDate);

        let finalPayload = payload;
        if (shouldApplyDrandTimelock()) {
            finalPayload = await wrapWithDrandTimelock(payload, unlockDate);
        }

        const dataURI = await uploadCapsule(finalPayload, title, walletSigner);

        const transactionPromise = createCapsule(title, unlockDate, dataURI);

        const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(
                            "Transaction creation timed out after 30s. Please check MetaMask and retry."
                        )
                    ),
                30000
            )
        );

        const tx: TransactionResponse = await Promise.race([transactionPromise, timeoutPromise]);

        await tx.wait();

        await waitForIndexing(address, title);

        clearSignatureSigner();
        clearProvider();
        clearContract();

        return tx;
    } catch (err) {
        clearSignatureSigner();
        clearProvider();
        clearContract();

        const errorMessage = err instanceof Error ? err.message : String(err);

        if (errorMessage.includes("User rejected")) {
            toast.error("User canceled authorization for this.");
        } else if (errorMessage.includes("Wallet")) {
            toast.error("Wallet connection issue - please reconnect");
        } else if (errorMessage.includes("network")) {
            toast.error("Network error - please check your connection");
        } else {
            toast.error("Capsule creation failed — check console for details");
        }

        throw err;
    }
}