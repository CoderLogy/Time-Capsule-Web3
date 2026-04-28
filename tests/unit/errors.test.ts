// Tests for error classification utility
// IMPACT: Core error handling - ensures consistent error categorization across the app
// WHO: Frontend developers, QA engineers testing error scenarios, Support team understanding error types
// WHY: Unified error handling reduces bugs, improves debugging, ensures consistent UX
// RUN: `pnpm vitest tests/unit/errors.test.ts` - validate error classification logic

import { classifyError, isDrandError, isWalletError, isNetworkError } from '../../src/lib/errors';
import { describe, it, expect } from 'vitest';

describe('Error Classification Utility - Core error type identification', () => {
  it('should classify drand not ready errors (VRF randomness service)', () => {
    const error = new Error('round not yet available');
    const result = classifyError(error);

    expect(result.type).toBe('drand_not_ready');
    expect(isDrandError(error)).toBe(true);
  });

  it('should classify wallet connection errors (blockchain integration)', () => {
    const error = new Error('wallet connection failed');
    const result = classifyError(error);

    expect(result.type).toBe('wallet_disconnected');
    expect(isWalletError(error)).toBe(true);
  });

  it('should classify generic network errors (connectivity issues)', () => {
    const error = new Error('Failed to fetch from network');
    const result = classifyError(error);

    expect(result.type).toBe('network_error');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return user-friendly messages for all error types', () => {
    const error = new Error('round not available');
    const result = classifyError(error);

    expect(result.userMessage).toBeDefined();
    expect(result.userMessage.length > 0).toBe(true);
  });
});
