import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  extractUsername,
  getPostsFromUser,
  getActivities,
  convertGraphQlToPostData,
  getCacheStats,
} from './api';
import { DailyEarning, PostSummary } from '../types';

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
    // Use textContent assignment after appending to avoid jsdom executing the script
    document.body.appendChild(script);
    Object.defineProperty(script, 'textContent', {
      get: () =>
        'window.__PRELOADED_STATE__ = {"navigation":{"currentLocation":"https://medium.com/me/stats"},"config":{}}; "username":"testuser" ',
    });

    expect(extractUsername()).toBe('testuser');
  });

  it('falls back to profile link when __PRELOADED_STATE__ is missing', () => {
    const link = document.createElement('a');
    link.href = 'https://medium.com/@myuser/some-story';
    document.body.appendChild(link);

    expect(extractUsername()).toBe('myuser');
  });

  it('throws when no username can be found', () => {
    expect(() => extractUsername()).toThrow(
      'Could not determine Medium username from page'
    );
  });
});

describe('getPostsFromUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
    const script = document.createElement('script');
    document.body.appendChild(script);
    Object.defineProperty(script, 'textContent', {
      get: () =>
        'window.__PRELOADED_STATE__ = {"x":"y","username":"virgs"}',
    });
  });

  it('fetches posts via GraphQL and paginates', async () => {
    const page1Response = [
      {
        data: {
          user: {
            id: 'user1',
            postsConnection: {
              edges: [
                {
                  node: {
                    id: 'post1',
                    firstPublishedAt: 1000,
                    title: 'Post 1',
                    readingTime: 3,
                    isLocked: false,
                    totalStats: { views: 100, reads: 50, presentations: 10 },
                    earnings: { total: { units: 0, nanos: 0 } },
                    creator: { id: 'user1', username: 'virgs', name: 'Test' },
                  },
                },
              ],
              pageInfo: { endCursor: 'cursor1', hasNextPage: true },
            },
          },
        },
      },
    ];

    const page2Response = [
      {
        data: {
          user: {
            id: 'user1',
            postsConnection: {
              edges: [
                {
                  node: {
                    id: 'post2',
                    firstPublishedAt: 2000,
                    title: 'Post 2',
                    readingTime: 5,
                    isLocked: true,
                    totalStats: { views: 200, reads: 100, presentations: null },
                    earnings: { total: { units: 1, nanos: 500000000 } },
                    creator: { id: 'user1', username: 'virgs', name: 'Test' },
                  },
                },
              ],
              pageInfo: { endCursor: 'cursor2', hasNextPage: false },
            },
          },
        },
      },
    ];

    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
      callCount++;
      return {
        status: 200,
        json: async () =>
          callCount === 1 ? page1Response : page2Response,
      } as Response;
    });

    const result = await getPostsFromUser();
    expect(result.posts).toHaveLength(2);
    expect(result.posts[0].id).toBe('post1');
    expect(result.posts[0].views).toBe(100);
    expect(result.posts[1].id).toBe('post2');
    expect(result.posts[1].views).toBe(200);
    expect(result.user).not.toBeNull();
  });
});

describe('getActivities', () => {
  it('returns empty array (old REST API no longer available)', async () => {
    const result = await getActivities();
    expect(result).toEqual([]);
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

