// Tests that errors are properly classified and user-friendly messages
// IMPACT: Critical for UX


import { describe, it, expect } from "vitest";
import { classifyError, isDrandError, isWalletError, isNetworkError } from "@/lib/errors";

describe("Error Classification - User-Facing Error Handling System", () => {
    describe("Drand Errors - Chainlink VRF randomness service errors", () => {
        it("should classify drand not ready errors and show 'unlock soon' message", () => {
            const err = new Error("round not yet available");
            const classified = classifyError(err);

            expect(classified.type).toBe("drand_not_ready");
            expect(classified.userMessage).toContain("unlock soon");
        });

        it("should detect drand errors with isDrandError helper for retry logic", () => {
            const drandErr = new Error("round not available");
            const nonDrandErr = new Error("wallet rejected");

            expect(isDrandError(drandErr)).toBe(true);
            expect(isDrandError(nonDrandErr)).toBe(false);
        });
    });

    describe("Wallet Errors - User wallet connection and transaction errors", () => {
        it("should classify wallet errors and prompt reconnection/authorization", () => {
            const rejectedErr = new Error("User rejected the transaction");
            const disconnectedErr = new Error("Wallet not connected");

            const classifiedRejected = classifyError(rejectedErr);
            const classifiedDisconnected = classifyError(disconnectedErr);

            expect(classifiedRejected.type).toBe("wallet_rejected");
            expect(classifiedRejected.userMessage).toBe("User canceled authorization for this.");
            expect(classifiedDisconnected.type).toBe("wallet_disconnected");
            expect(classifiedDisconnected.userMessage).toContain("Reconnect");
        });

        it("should detect wallet errors with isWalletError helper for UI state", () => {
            const walletErr = new Error("User rejected");
            const nonWalletErr = new Error("drand network error");

            expect(isWalletError(walletErr)).toBe(true);
            expect(isWalletError(nonWalletErr)).toBe(false);
        });
    });

    describe("Network Errors - Generic network connectivity issues", () => {
        it("should classify and detect network errors with helper function", () => {
            const netErr = new Error("Failed to fetch");
            const classified = classifyError(netErr);

            expect(classified.type).toBe("network_error");
            expect(classified.userMessage).toContain("Network");
            expect(isNetworkError(netErr)).toBe(true);
        });
    });

    describe("Data Errors - Cryptographic and data integrity issues", () => {
        it("should classify version unsupported errors (app needs update)", () => {
            const err = new Error("Unsupported capsule version: 5");
            const classified = classifyError(err);

            expect(classified.type).toBe("version_unsupported");
            expect(classified.userMessage).toContain("Update");
        });

        it("should classify time-locked capsule errors (future unlock time)", () => {
            const futureDate = new Date(Date.now() + 86400000).toISOString();
            const err = new Error(`Capsule is time-locked until ${futureDate}`);
            const classified = classifyError(err);

            expect(classified.type).toBe("drand_not_ready");
        });
    });

    describe("Unknown Errors - Fallback handling", () => {
        it("should classify unknown error strings safely and provide fallback message", () => {
            const err = "Something unexpected happened";
            const classified = classifyError(err);

            expect(classified.type).toBe("unknown");
            expect(classified.userMessage).toBe(err);
        });
    });
});
