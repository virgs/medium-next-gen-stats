import { describe, it, expect, vi, beforeEach } from 'vitest';
import { request, getPosts, convertGraphQlToPostData, getCacheStats } from './api';
import { DailyEarning, PostSummary } from '../types';

vi.mock('../utils/logger', () => ({
  nextGenerationLog: vi.fn(),
}));

describe('request', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('fetches and parses medium API response with XSSI prefix', async () => {
    const mockPayload = { value: [{ id: '1' }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: async () => `])}while(1);</x>${JSON.stringify({ payload: mockPayload })}`,
    } as Response);

    const result = await request('https://medium.com/test');
    expect(result).toEqual(mockPayload);
  });

  it('fetches and parses plain JSON with payload wrapper', async () => {
    const mockPayload = { value: [{ id: '2' }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify({ payload: mockPayload }),
    } as Response);

    const result = await request('https://medium.com/test');
    expect(result).toEqual(mockPayload);
  });

  it('fetches and parses plain JSON without payload wrapper', async () => {
    const mockPayload = { value: [{ id: '3' }] };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: async () => JSON.stringify(mockPayload),
    } as Response);

    const result = await request('https://medium.com/test');
    expect(result).toEqual(mockPayload);
  });

  it('returns empty object on non-200 status', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const result = await request('https://medium.com/missing');
    expect(result).toEqual({});
    consoleSpy.mockRestore();
  });
});

describe('getPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('maps posts adding id from postId', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      status: 200,
      text: async () =>
        `])}while(1);</x>${JSON.stringify({
          payload: {
            value: [
              { postId: 'abc', title: 'Test Post', views: 100, reads: 50, claps: 10, upvotes: 5, firstPublishedAt: Date.now(), readingTime: 3 },
            ],
          },
        })}`,
    } as Response);

    const posts = await getPosts('https://medium.com/test/stats');
    expect(posts[0].id).toBe('abc');
    expect(posts[0].postId).toBe('abc');
  });
});

describe('convertGraphQlToPostData', () => {
  const mockPost: PostSummary = {
    id: 'post1',
    postId: 'post1',
    title: 'Test Article',
    views: 100,
    reads: 50,
    claps: 10,
    upvotes: 5,
    firstPublishedAt: Date.now(),
    readingTime: 3,
  };

  it('converts daily earnings to post data', () => {
    const earnings: DailyEarning[] = [
      { periodStartedAt: 1000, periodEndedAt: 2000, amount: 500 },
      { periodStartedAt: 3000, amount: 300 },
    ];

    const result = convertGraphQlToPostData(earnings, mockPost);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('post1');
    expect(result[0].title).toBe('Test Article');
    expect(result[0].earnings).toBe(5);
    expect(result[0].collectedAt).toBe(1500);
  });

  it('uses periodStartedAt when periodEndedAt is missing', () => {
    const earnings: DailyEarning[] = [
      { periodStartedAt: 3000, amount: 100 },
    ];

    const result = convertGraphQlToPostData(earnings, mockPost);
    expect(result[0].collectedAt).toBe(3000);
  });

  it('handles null/undefined dailyEarnings', () => {
    const result = convertGraphQlToPostData(
      null as unknown as DailyEarning[],
      mockPost
    );
    expect(result).toHaveLength(0);
  });
});

describe('getCacheStats', () => {
  it('returns cache counter stats', () => {
    const stats = getCacheStats();
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('used');
  });
});

