import {
  HttpCachingChain,
  HttpChainClient,
  roundAt,
  timelockDecrypt,
  timelockEncrypt,
} from "tlock-js";
import { MAINNET_CHAIN_URL } from "tlock-js/drand/defaults.js";

export function quicknet(): HttpChainClient {
  const clientOpts = {
    disableBeaconVerification: false,
    noCache: false,
    chainVerificationParams: {
      chainHash:
        "52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971",
      publicKey:
        "83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a",
    },
  };
  // passing an empty httpOptions arg to strip the user agent header to stop CORS issues
  return new HttpChainClient(
    new HttpCachingChain(MAINNET_CHAIN_URL, clientOpts),
    clientOpts,
    {},
  );
}

export async function encrypt(
  client: HttpChainClient,
  plaintext: string,
  decryptionTime: number,
) {
  const chainInfo = await client.chain().info();
  const roundNumber = roundAt(decryptionTime, chainInfo);
  const ciphertext = await timelockEncrypt(
    roundNumber,
    Buffer.from(plaintext),
    client,
  );
  return {
    plaintext,
    decryptionTime,
    ciphertext,
  };
}

export async function decrypt(
  client: HttpChainClient,
  ciphertext: string,
  decryptionTime: number,
) {
  const plaintext = await timelockDecrypt(ciphertext, client);
  return {
    plaintext: plaintext.toString(),
    decryptionTime,
    ciphertext,
  };
}
const encryptedMessage = await encrypt(
  quicknet(),
  "Hello Worlds",
  Date.now() + 2 * 1000,
);
//const decryptedText = await decrypt(quicknet(),encryptedMessage.ciphertext,encryptedMessage.decryptionTime)
console.log("encryption started", encryptedMessage);
//console.log("decryption started",decryptedText)
