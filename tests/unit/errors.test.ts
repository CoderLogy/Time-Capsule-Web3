// Tests for error classification utility
import { classifyError, isDrandError, isWalletError, isNetworkError } from '../../src/lib/errors';
import { describe, it, expect } from 'vitest';

describe('Error Classification', () => {
  it('should classify drand not ready errors', () => {
    const error = new Error('round not yet available');
    const result = classifyError(error);

    expect(result.type).toBe('drand_not_ready');
    expect(isDrandError(error)).toBe(true);
  });

  it('should classify wallet connection errors', () => {
    const error = new Error('wallet connection failed');
    const result = classifyError(error);

    expect(result.type).toBe('wallet_disconnected');
    expect(isWalletError(error)).toBe(true);
  });

  it('should classify network errors', () => {
    const error = new Error('Failed to fetch from network');
    const result = classifyError(error);

    expect(result.type).toBe('network_error');
    expect(isNetworkError(error)).toBe(true);
  });

  it('should return user-friendly messages', () => {
    const error = new Error('round not available');
    const result = classifyError(error);

    expect(result.userMessage).toBeDefined();
    expect(result.userMessage.length > 0).toBe(true);
  });
});
