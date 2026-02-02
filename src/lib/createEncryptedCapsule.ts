import { ethers, TransactionResponse } from "ethers";
import { encryptForWallet, CapsulePayload } from "./encrypt-decrypt";
import { uploadCapsule } from "@/lib/ipfs";
import { createCapsule } from "@/lib/contract-api";

interface CreateEncryptedCapsuleArgs {
    signer: ethers.Signer;
    sessionKey: CryptoKey;
    plaintext: string;
    unlockDate: number;
    title: string;
}
export async function createEncryptedCapsule({
    signer,
    sessionKey,
    plaintext,
    unlockDate,
    title,
}: CreateEncryptedCapsuleArgs): Promise<TransactionResponse> {
    const payload: CapsulePayload = await encryptForWallet(signer, plaintext, undefined, sessionKey);

    const dataURI = await uploadCapsule(payload, title);
    
    try {
        const tx: TransactionResponse = await createCapsule(title, unlockDate, dataURI);
        console.log("Transaction hash:", tx.hash);
        await tx.wait();
        console.log("Capsule created ✅");
        return tx;
    } catch (err) {
        console.error("Capsule creation failed:", err);
        if (err.data) console.error("Revert data:", err.data);
        alert("Capsule creation failed — check console");
        throw err;
    }
}
