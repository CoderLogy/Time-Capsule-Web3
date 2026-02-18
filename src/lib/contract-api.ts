import { setSignatureSigner } from "./encrypt-decrypt";
import TimeCapsuleAbi from "../../contracts/TimeCapsule.json";
import type { TransactionResponse } from "ethers";
import { ethers } from "ethers";

const CONTRACT_ADDRESS = "0x19FF5dc69033523f1C5b1B5589f95D49b5EF7926";
let contract: ethers.Contract | null;

export async function getContract(): Promise<ethers.Contract> {
    if (contract) return contract;
    const signer = await setSignatureSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, TimeCapsuleAbi.abi, signer);
    return contract;
}

export async function createCapsule(
    title: string,
    unlockDate: number,
    dataURI: string
): Promise<TransactionResponse> {
    const c = await getContract();
    const fee: ethers.BigNumberish = await c.capsuleFee();

    const tx: TransactionResponse = await c.createCapsule(title,unlockDate, dataURI, {
        value: fee,
    });
    console.log("Capsule fee in wei:", fee.toString());
    return tx;
}
