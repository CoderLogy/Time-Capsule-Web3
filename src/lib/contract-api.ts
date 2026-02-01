import { setSignatureSigner } from "./encrypt-decrypt";
import TimeCapsuleAbi from "../../contracts/TimeCapsule.json"
import { ethers } from "ethers";

const abi = TimeCapsuleAbi.abi;
const CONTRACT_ADDRESS = "0xFf2E2B3C12f2cCA37b6eDC0F57B24698130EB0F8";
let contract: ethers.Contract | null;

export async function getContract(): Promise<ethers.Contract> {
    if (contract) return contract;
    const signer = await setSignatureSigner();
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    return contract;
}



//TODO ADD ALL OTHER API FUNCTIONS