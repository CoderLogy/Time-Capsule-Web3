// I made this environment configuration to separate public from server-only variables

// PUBLIC VARIABLES (Safe to expose in frontend bundle)
export const publicEnv = {
  // Blockchain
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  chainId: parseInt(import.meta.env.VITE_CHAIN_ID || "11155111"),
  walletConnectId: import.meta.env.VITE_WALLETCONNECT_ID,

  // The Graph
  subgraphUrl: import.meta.env.VITE_SUBGRAPH_URL,

  // IPFS
  pinataGateway: import.meta.env.VITE_PINATA_GATEWAY,

  // External APIs
  cryptoPriceApiUrl:
    import.meta.env.CRYPTOPRICE_API_URL ||
    "https://min-api.cryptocompare.com",
} as const;

// SERVER-SIDE ONLY VARIABLES
// WARNING: These should ONLY be accessed in API routes (api/* files)
// If you import this on the client-side, it will break the build or leak secrets
export const serverEnv = {
  // The Graph
  subgraphApiKey: process.env.VITE_SUBGRAPH_API_KEY || "",

  // IPFS / Pinata
  pinataJwt: process.env.PINATA_JWT || "",
  pinataApiSecret: process.env.VITE_PINATA_API_SECRET || "",

  // Ethereum RPC
  sepoliaRpcUrl: process.env.SEPOLIA_URL || "https://1rpc.io/sepolia",
  privateKey: process.env.PRIVATE_KEY || "",
  etherscanApiKey: process.env.ETHERSCAN_API_KEY || "",
} as const;

// VALIDATION
const requiredPublicVars = [
  "contractAddress",
  "chainId",
  "walletConnectId",
  "subgraphUrl",
  "pinataGateway",
] as const;

const requiredServerVars = [
  "subgraphApiKey",
  "pinataJwt",
  "pinataApiSecret",
] as const;

// Validates public variables exist and have valid values
export function validatePublicEnv() {
  const missing: string[] = [];

  for (const key of requiredPublicVars) {
    if (!publicEnv[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error("Missing required public environment variables:", missing);
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);
  }
}

// Validates server variables exist and have valid values
// Only call this in API routes, never on the client-side
export function validateServerEnv() {
  // Check if running on server-side (API routes)
  if (typeof window !== "undefined") {
    console.error(
      "[ENV] ERROR: validateServerEnv() called on client-side. Server secrets must not be accessed from frontend code."
    );
    throw new Error(
      "Server environment validation cannot run on client-side"
    );
  }

  const missing: string[] = [];

  for (const key of requiredServerVars) {
    if (!serverEnv[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing server environment variables: ${missing.join(", ")}`
    );
  }
}

export function initializeEnv() {
  try {
    validatePublicEnv();
    console.log("✓ Public environment variables validated");
  } catch (error) {
    console.error("Environment validation failed:", error);
    throw error;
  }
}
