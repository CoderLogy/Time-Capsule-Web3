// Environment configuration with type safety - separates public from server-only variables

// PUBLIC VARIABLES (safe to expose in browser - loaded into VITE_*)
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
    cryptoPriceApiUrl: import.meta.env.CRYPTOPRICE_API_URL || "https://min-api.cryptocompare.com"
} as const;

// SERVER-SIDE ONLY VARIABLES (accessed via process.env, never in browser)
export const serverEnv = {
    // The Graph
    subgraphApiKey: process.env.VITE_SUBGRAPH_API_KEY || "",

    // IPFS / Pinata
    pinataJwt: process.env.VITE_PINATA_JWT || "",
    pinataApiSecret: process.env.VITE_PINATA_API_SECRET || "",

    // Ethereum RPC (for deployment/testing)
    sepoliaRpcUrl: process.env.SEPOLIA_URL || "https://ethereum-sepolia-rpc.publicnode.com",
    privateKey: process.env.PRIVATE_KEY || "",
    etherscanApiKey: process.env.ETHERSCAN_API_KEY || ""
} as const;

// VALIDATION
const requiredPublicVars = [
    "contractAddress",
    "chainId",
    "walletConnectId",
    "subgraphUrl",
    "pinataGateway"
] as const;

const requiredServerVars = ["subgraphApiKey", "pinataJwt", "pinataApiSecret"] as const;

// Validate public environment variables exist and have valid values
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

// Validate server environment variables exist and have valid values
export function validateServerEnv() {
    const missing: string[] = [];

    for (const key of requiredServerVars) {
        if (!serverEnv[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(`Missing server environment variables: ${missing.join(", ")}`);
    }
}

// Initialize and validate environment on app startup
export function initializeEnv() {
    try {
        validatePublicEnv();
        console.log("✓ Public environment variables validated");
    } catch (error) {
        console.error("Environment validation failed:", error);
        throw error;
    }
}
