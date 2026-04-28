// Error handling and classification tests
// Tests that errors are properly classified and user-friendly messages are shown

import { describe, it, expect } from "vitest";
import { classifyError, isDrandError, isWalletError, isNetworkError } from "@/lib/errors";

describe("Error Classification", () => {
  describe("Drand Errors", () => {
    it("should classify drand not ready errors", () => {
      const err = new Error("round not yet available");
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_not_ready");
      expect(classified.userMessage).toContain("unlock soon");
    });

    it("should classify drand timeout errors", () => {
      const err = new Error("request timed out");
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_timeout");
      expect(classified.userMessage).toContain("slow");
    });

    it("should classify drand network errors", () => {
      const err = new Error("Failed to fetch from drand network");
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_network");
      expect(classified.userMessage).toContain("Network");
    });

    it("should detect drand errors with isDrandError helper", () => {
      const drandErr = new Error("round not available");
      const nonDrandErr = new Error("wallet rejected");

      expect(isDrandError(drandErr)).toBe(true);
      expect(isDrandError(nonDrandErr)).toBe(false);
    });
  });

  describe("Wallet Errors", () => {
    it("should classify wallet rejected errors", () => {
      const err = new Error("User rejected the transaction");
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_rejected");
      expect(classified.userMessage).toBe("User canceled authorization for this.");
    });

    it("should classify wallet wrong wallet errors", () => {
      const err = new Error("Please use the original wallet");
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_wrong");
      expect(classified.userMessage).toContain("same wallet");
    });

    it("should classify wallet disconnected errors", () => {
      const err = new Error("Wallet not connected");
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_disconnected");
      expect(classified.userMessage).toContain("Reconnect");
    });

    it("should detect wallet errors with isWalletError helper", () => {
      const walletErr = new Error("User rejected");
      const nonWalletErr = new Error("drand network error");

      expect(isWalletError(walletErr)).toBe(true);
      expect(isWalletError(nonWalletErr)).toBe(false);
    });
  });

  describe("Network Errors", () => {
    it("should classify fetch errors", () => {
      const err = new Error("Failed to fetch");
      const classified = classifyError(err);

      expect(classified.type).toBe("network_error");
      expect(classified.userMessage).toContain("Network");
    });

    it("should classify CORS errors", () => {
      const err = new Error("CORS policy blocked request");
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_network");
    });

    it("should detect network errors with isNetworkError helper", () => {
      const netErr = new Error("Failed to fetch");
      const nonNetErr = new Error("invalid data");

      expect(isNetworkError(netErr)).toBe(true);
      expect(isNetworkError(nonNetErr)).toBe(false);
    });
  });

  describe("Data Errors", () => {
    it("should classify malformed data errors", () => {
      const err = new Error("Invalid or malformed payload");
      const classified = classifyError(err);

      expect(classified.type).toBe("data_invalid");
      expect(classified.userMessage).toContain("corrupted");
    });

    it("should classify version unsupported errors", () => {
      const err = new Error("Unsupported capsule version: 5");
      const classified = classifyError(err);

      expect(classified.type).toBe("version_unsupported");
      expect(classified.userMessage).toContain("Update");
    });

    it("should classify time-locked capsule errors", () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const err = new Error(`Capsule is time-locked until ${futureDate}`);
      const classified = classifyError(err);

      expect(classified.type).toBe("drand_not_ready");
    });
  });

  describe("Unknown Errors", () => {
    it("should classify unknown error strings", () => {
      const err = "Something unexpected happened";
      const classified = classifyError(err);

      expect(classified.type).toBe("unknown");
      expect(classified.userMessage).toBe(err);
    });

    it("should handle objects without message property", () => {
      const err = { code: 500 } as any;
      const classified = classifyError(err);

      expect(classified.type).toBe("unknown");
      expect(classified.userMessage).toContain("went wrong");
    });

    it("should handle null or undefined errors", () => {
      const classifiedNull = classifyError(null as any);
      const classifiedUndef = classifyError(undefined as any);

      expect(classifiedNull.type).toBe("unknown");
      expect(classifiedUndef.type).toBe("unknown");
    });
  });

  describe("Error Classification Safety", () => {
    it("should not throw on recursive classification", () => {
      const err = new Error("test");
      expect(() => {
        classifyError(err);
        classifyError(err);
        classifyError(err);
      }).not.toThrow();
    });

    it("should handle deeply nested error messages", () => {
      const err = new Error(
        "User rejected" + "User rejected".repeat(100)
      );
      const classified = classifyError(err);

      expect(classified.type).toBe("wallet_rejected");
    });
  });
});
