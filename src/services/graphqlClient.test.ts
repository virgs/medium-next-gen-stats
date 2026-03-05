import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractUsername, graphqlFetch, getCacheStats } from './graphqlClient';

vi.mock('../utils/logger', () => ({
  nextGenerationLog: vi.fn(),
}));

vi.mock('./cache', () => ({
  addToCache: vi.fn().mockResolvedValue(undefined),
  loadCache: vi.fn().mockResolvedValue(undefined),
}));

describe('extractUsername', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('extracts username from __PRELOADED_STATE__ script', () => {
    const script = document.createElement('script');
    document.body.appendChild(script);
    Object.defineProperty(script, 'textContent', {
      get: () =>
        'window.__PRELOADED_STATE__ = {"nav":{},"username":"testuser"}',
    });

    expect(extractUsername()).toBe('testuser');
  });

  it('falls back to profile link', () => {
    const link = document.createElement('a');
    link.href = 'https://medium.com/@myuser/story';
    document.body.appendChild(link);

    expect(extractUsername()).toBe('myuser');
  });

  it('throws when no username found', () => {
    expect(() => extractUsername()).toThrow(
      'Could not determine Medium username from page'
    );
  });
});

describe('graphqlFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('sends POST request and returns parsed data', async () => {
    const mockData = { user: { id: '123' } };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      json: async () => [{ data: mockData }],
    } as Response);

    const result = await graphqlFetch<typeof mockData>(
      'TestOp',
      'query { test }',
      { foo: 'bar' }
    );

    expect(result).toEqual(mockData);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://medium.com/_/graphql',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'graphql-operation': 'TestOp',
        }),
      })
    );
  });

  it('throws on non-200 status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 500,
      statusText: 'Server Error',
    } as Response);

    await expect(
      graphqlFetch('TestOp', 'query { test }', {})
    ).rejects.toThrow('GraphQL request failed: 500');
  });
});

describe('getCacheStats', () => {
  it('returns cache counter', () => {
    const stats = getCacheStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('used');
  });
});

