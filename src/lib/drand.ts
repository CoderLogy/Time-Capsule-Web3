import {
    HttpCachingChain,
    HttpChainClient,
    roundAt,
    timelockDecrypt,
    timelockEncrypt
} from "tlock-js";
import { MAINNET_CHAIN_URL } from "tlock-js/drand/defaults.js";

export function quicknet(): HttpChainClient {
    const clientOpts = {
        disableBeaconVerification: false,
        noCache: false,
        chainVerificationParams: {
            chainHash: "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971",
            publicKey:
                "83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a"
        }
    };
    // passes empty httpOptions arg to stop CORS issues
    return new HttpChainClient(new HttpCachingChain(MAINNET_CHAIN_URL, clientOpts), clientOpts, {});
}

export async function encrypt(client: HttpChainClient, plaintext: string, decryptionTime: number) {
    if (!plaintext || plaintext.length === 0) {
        throw new Error("Cannot encrypt empty plaintext");
    }
    if (decryptionTime < Date.now()) {
        throw new Error("Decryption time must be in the future");
    }

    const chainInfo = await client.chain().info();

    if (!chainInfo || typeof chainInfo.period !== "number") {
        throw new Error("Invalid chain info from drand service - cannot calculate round");
    }

    // Calculate the future round number
    const roundNumber = roundAt(decryptionTime, chainInfo);

    if (!roundNumber || typeof roundNumber !== "number" || roundNumber < 1) {
        throw new Error(
            `Invalid drand round calculated: ${roundNumber}. Please verify unlock time.`
        );
    }

    // Encrypt with time
    const ciphertext = await timelockEncrypt(roundNumber, Buffer.from(plaintext), client);

    if (!ciphertext || ciphertext.length === 0) {
        throw new Error("Drand encryption produced empty ciphertext");
    }

    return {
        plaintext,
        decryptionTime,
        ciphertext,
        drandRound: roundNumber
    };
}

export async function decrypt(client: HttpChainClient, ciphertext: string, decryptionTime: number) {
    const plaintext = await timelockDecrypt(ciphertext, client);
    return {
        plaintext: plaintext.toString(),
        decryptionTime,
        ciphertext
    };
}
