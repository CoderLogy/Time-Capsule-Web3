import { ethers } from "ethers";
import { publicEnv } from "@/config/env";

export interface IPFSUploadResponse {
    success: boolean;
    cid?: string;
    gateway_url?: string;
    error?: string;
}

export async function getWalletAuthHeaders(signer: ethers.Signer): Promise<Record<string, string>> {
    const walletAddress = await signer.getAddress();

    return {
        "X-Wallet-Address": walletAddress
    };
}

export async function uploadToPinata(
    encryptedData: string,
    title: string,
    signer?: ethers.Signer
): Promise<{ cid: string; gateway_url: string }> {
    let authHeaders: Record<string, string> = {};

    if (signer) {
        authHeaders = await getWalletAuthHeaders(signer);
    }

    const response = await fetch("/api/ipfs/upload", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders
        },
        body: JSON.stringify({
            encryptedData,
            title
        })
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Upload failed: ${error.error || response.statusText}`);
    }

    const result = (await response.json()) as IPFSUploadResponse;

    if (!result.success) {
        throw new Error(result.error || "Upload failed");
    }

    if (!result.cid || !result.gateway_url) {
        throw new Error("Invalid response from upload endpoint");
    }

    return {
        cid: result.cid,
        gateway_url: result.gateway_url
    };
}

// GraphQL Queries

export interface GraphQLQueryOptions {
    query: string;
    variables?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
    data?: T;
    errors?: Array<{ message: string }>;
}

export async function querySubgraph<T = any>(
    query: string,
    variables?: Record<string, any>
): Promise<T> {
    const response = await fetch(publicEnv.subgraphUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query,
            variables: variables || {}
        })
    });

    if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`);
    }

    const result = (await response.json()) as GraphQLResponse<T>;

    if (result.errors && result.errors.length > 0) {
        throw new Error(`GraphQL error: ${result.errors.map((e) => e.message).join(", ")}`);
    }

    if (!result.data) {
        throw new Error("No data in GraphQL response");
    }

    return result.data;
}

export interface PriceData {
    price: number;
    lastUpdated: number;
}

export async function getEthPrice(): Promise<PriceData> {
    const response = await fetch("/api/prices/eth-price", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Price fetch failed: ${response.statusText}`);
    }

    return (await response.json()) as PriceData;
}
