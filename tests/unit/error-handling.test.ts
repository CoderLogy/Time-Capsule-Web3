// Error handling and classification tests
// Tests that errors are properly classified and user-friendly messages are shown
// IMPACT: Critical for UX - ensures users see clear error messages instead of technical jargon
// WHO: Frontend team (users see these messages), DevOps (monitors error types), Product team
// WHY: Errors from drand, wallets, and network issues need distinct handling and messaging

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

    it("should classify drand timeout errors and indicate service is slow", () => {
      const err = new Error("request timed out");
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_timeout");
      expect(classified.userMessage).toContain("slow");
    });

    it("should classify drand network errors as infrastructure issues", () => {
      const err = new Error("Failed to fetch from drand network");
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_network");
      expect(classified.userMessage).toContain("Network");
    });

    it("should detect drand errors with isDrandError helper for retry logic", () => {
      const drandErr = new Error("round not available");
      const nonDrandErr = new Error("wallet rejected");

      expect(isDrandError(drandErr)).toBe(true);
      expect(isDrandError(nonDrandErr)).toBe(false);
    });
  });

  describe("Wallet Errors - User wallet connection and transaction errors", () => {
    it("should classify wallet rejected errors when user denies transaction", () => {
      const err = new Error("User rejected the transaction");
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_rejected");
      expect(classified.userMessage).toBe("User canceled authorization for this.");
    });

    it("should classify wallet wrong wallet errors (security check)", () => {
      const err = new Error("Please use the original wallet");
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_wrong");
      expect(classified.userMessage).toContain("same wallet");
    });

    it("should classify wallet disconnected errors and prompt reconnection", () => {
      const err = new Error("Wallet not connected");
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_disconnected");
      expect(classified.userMessage).toContain("Reconnect");
    });

    it("should detect wallet errors with isWalletError helper for UI state", () => {
      const walletErr = new Error("User rejected");
      const nonWalletErr = new Error("drand network error");

      expect(isWalletError(walletErr)).toBe(true);
      expect(isWalletError(nonWalletErr)).toBe(false);
    });
  });

  describe("Network Errors - Generic network connectivity issues", () => {
    it("should classify fetch errors as generic network problems", () => {
      const err = new Error("Failed to fetch");
      const classified = classifyError(err);

      expect(classified.type).toBe("network_error");
      expect(classified.userMessage).toContain("Network");
    });

    it("should classify CORS errors as infrastructure/network issues", () => {
      const err = new Error("CORS policy blocked request");
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_network");
    });

    it("should detect network errors with isNetworkError helper for retry logic", () => {
      const netErr = new Error("Failed to fetch");
      const nonNetErr = new Error("invalid data");

      expect(isNetworkError(netErr)).toBe(true);
      expect(isNetworkError(nonNetErr)).toBe(false);
    });
  });

  describe("Data Errors - Cryptographic and data integrity issues", () => {
    it("should classify malformed data errors and indicate corruption", () => {
      const err = new Error("Invalid or malformed payload");
      const classified = classifyError(err);

      expect(classified.type).toBe("data_invalid");
      expect(classified.userMessage).toContain("corrupted");
    });

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

  describe("Unknown Errors - Fallback and edge case handling", () => {
    it("should classify unknown error strings and pass them through", () => {
      const err = "Something unexpected happened";
      const classified = classifyError(err);

      expect(classified.type).toBe("unknown");
      expect(classified.userMessage).toBe(err);
    });

    it("should handle objects without message property gracefully", () => {
      const err = { code: 500 } as any;
      const classified = classifyError(err);

      expect(classified.type).toBe("unknown");
      expect(classified.userMessage).toContain("went wrong");
    });

    it("should handle null or undefined errors safely", () => {
      const classifiedNull = classifyError(null as any);
      const classifiedUndef = classifyError(undefined as any);

      expect(classifiedNull.type).toBe("unknown");
      expect(classifiedUndef.type).toBe("unknown");
    });
  });

  describe("Error Classification Safety - Robustness and edge case handling", () => {
    it("should not throw on recursive classification (prevents stack overflow)", () => {
      const err = new Error("test");
      expect(() => {
        classifyError(err);
        classifyError(err);
        classifyError(err);
      }).not.toThrow();
    });

    it("should handle deeply nested error messages efficiently", () => {
      const err = new Error(
        "User rejected" + "User rejected".repeat(100)
      );
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_rejected");
    });
  });
});
