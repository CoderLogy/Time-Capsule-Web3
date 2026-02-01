import { createCapsule } from "@/lib/contract-api.ts"
import { uploadCapsule } from "@/lib/ipfs.ts";
import { encryptForWallet } from "./encrypt-decrypt";

export async function createEncryptedCapsule(plaintext: string, unlockDate: number) {
    const signer = await import("@/lib/encrypt-decrypt").then(m => m.setSignatureSigner());

    // Encrypt data for wallet
    const payload = await encryptForWallet(signer, plaintext);

    // Upload encrypted payload to IPFS
    const dataURI = await uploadCapsule(payload);

    // Send transaction
    const tx = await createCapsule(unlockDate, dataURI);
    await tx.wait();
    return tx;
}