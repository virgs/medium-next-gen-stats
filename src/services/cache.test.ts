import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addToCache, loadCache } from './cache';

describe('addToCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls chrome.storage.local.set with key-value pair', async () => {
    const setSpy = vi.fn((_items: Record<string, unknown>, callback?: () => void) => {
      callback?.();
    });
    chrome.storage.local.set = setSpy;

    await addToCache('test-key', { data: 'value' });
    expect(setSpy).toHaveBeenCalledWith(
      { 'test-key': { data: 'value' } },
      expect.any(Function)
    );
  });

  it('handles runtime errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const originalLastError = chrome.runtime.lastError;

    chrome.storage.local.set = vi.fn((_items: Record<string, unknown>, callback?: () => void) => {
      Object.defineProperty(chrome.runtime, 'lastError', {
        value: { message: 'storage error' },
        writable: true,
        configurable: true,
      });
      callback?.();
    });

    await addToCache('key', 'value');
    expect(consoleSpy).toHaveBeenCalled();

    Object.defineProperty(chrome.runtime, 'lastError', {
      value: originalLastError,
      writable: true,
      configurable: true,
    });
    consoleSpy.mockRestore();
  });
});

describe('loadCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached value when available', async () => {
    chrome.storage.local.get = vi.fn((keys: string[], callback: (result: Record<string, unknown>) => void) => {
      callback({ [keys[0]]: { cached: 'data' } });
    });

    const result = await loadCache('my-key');
    expect(result).toEqual({ cached: 'data' });
  });

  it('returns undefined when key is not cached', async () => {
    chrome.storage.local.get = vi.fn((_keys: string[], callback: (result: Record<string, unknown>) => void) => {
      callback({});
    });

    const result = await loadCache('missing-key');
    expect(result).toBeUndefined();
  });
});

