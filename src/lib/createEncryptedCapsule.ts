import { ethers, TransactionResponse } from "ethers";
import { encryptForWallet, CapsulePayload } from "./encrypt-decrypt";
import { uploadCapsule } from "@/lib/ipfs";
import { createCapsule, getCapsules } from "@/lib/contract-api";
import { toast } from "sonner";
import { getWalletClient } from '@wagmi/core'
import { config } from '@/components/Wallet'

interface CreateEncryptedCapsuleArgs {
    address: string,
    plaintext: string;
    unlockDate: number;
    title: string;
}

 async function waitForIndexing(address: string, title: string): Promise<void> {
        for (let i = 0; i < 3; i++) {
            await new Promise(r => setTimeout(r, 3000));
            try {
                const capsules = await getCapsules(address);
                if (capsules.some(c => c.title === title)) return;
            } catch(err) {
                console.log(err)
                toast.error("Error polling new results!")
            }
        }
}
    
export async function createEncryptedCapsule({
    address,
    plaintext,
    unlockDate,
    title,
}: CreateEncryptedCapsuleArgs): Promise<TransactionResponse> {
    const walletClient = await getWalletClient(config)
    if (!walletClient) throw new Error("No wallet connected")
    
    const provider = new ethers.BrowserProvider(walletClient.transport)
    const walletSigner = await provider.getSigner()
    const payload: CapsulePayload = await encryptForWallet(walletSigner, plaintext, unlockDate)

    const dataURI = await uploadCapsule(payload, title)
    
    try {
        const tx: TransactionResponse = await createCapsule(title, unlockDate, dataURI)
        console.log("Transaction hash:", tx.hash)
        await tx.wait()
        await waitForIndexing(address, plaintext)
        console.log("Capsule created ✅")
        return tx
    } catch (err) {
        console.error("Capsule creation failed:", err)
        if (err.data) console.error("Revert data:", err.data)
        toast.error("Capsule creation failed — check console")
        throw err
    }
}