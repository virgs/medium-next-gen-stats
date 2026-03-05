import { DailyEarning, PostData, PostSummary } from '../types';
import { nextGenerationLog } from '../utils/logger';
import { ONE_DAY_IN_MS, getNumber } from '../utils/formatters';
import { extractUsername, graphqlFetch, getCacheStats } from './graphqlClient';
import {
  GRAPHQL_ENDPOINT,
  GraphQlPostNode,
  PostsConnectionPage,
  TimeseriesPoint,
  LIFETIME_QUERY,
  TIMESERIES_QUERY,
  EARNINGS_QUERY,
} from './graphqlQueries';

export { extractUsername, getCacheStats } from './graphqlClient';

const POSTS_PAGE_SIZE = 25;

const convertNodeToPostSummary = (
  node: GraphQlPostNode
): PostSummary => ({
  id: node.id,
  postId: node.id,
  title: node.title,
  views: node.totalStats?.views ?? 0,
  reads: node.totalStats?.reads ?? 0,
  claps: 0,
  upvotes: 0,
  firstPublishedAt: node.firstPublishedAt,
  readingTime: node.readingTime,
});

export const getPostsFromUser = async (): Promise<{
  posts: PostSummary[];
  user: Record<string, unknown> | null;
}> => {
  const username = extractUsername();
  nextGenerationLog(`Fetching user posts via GraphQL for @${username}`);

  const allPosts: PostSummary[] = [];
  let after = '';
  let hasNextPage = true;
  let user: Record<string, unknown> | null = null;

  while (hasNextPage) {
    nextGenerationLog(
      `Fetching posts page (${allPosts.length} so far, cursor: ${after ? '...' : 'start'})`
    );
    const data = await graphqlFetch<{
      user: {
        id: string;
        postsConnection: PostsConnectionPage;
      };
    }>('UserLifetimeStoryStatsPostsQuery', LIFETIME_QUERY, {
      username,
      first: POSTS_PAGE_SIZE,
      after,
      orderBy: { publishedAt: 'DESC' },
      filter: { published: true },
    });

    if (!user && data.user) {
      user = { [data.user.id]: { username, userId: data.user.id } };
    }

    const page = data.user.postsConnection;
    for (const edge of page.edges) {
      allPosts.push(convertNodeToPostSummary(edge.node));
    }

    hasNextPage = page.pageInfo.hasNextPage;
    after = page.pageInfo.endCursor;
  }

  nextGenerationLog(`Found ${allPosts.length} posts via GraphQL`);
  return { posts: allPosts, user };
};

export const getPostsFromPublication = async (
  _publication: string
): Promise<PostSummary[]> => {
  nextGenerationLog(
    `Publication stats not yet supported via GraphQL, falling back to user posts`
  );
  const { posts } = await getPostsFromUser();
  return posts;
};

export const getPostStats = async (
  _post: PostSummary,
  begin: number,
  end: number
): Promise<PostData[]> => {
  const username = extractUsername();
  const cacheKey = `timeseries:${username}:${begin}:${end}`;
  nextGenerationLog(
    `Fetching timeseries stats via GraphQL (${new Date(begin).toISOString()} – ${new Date(end).toISOString()})`
  );

  try {
    const data = await graphqlFetch<{
      user: {
        postsAggregateTimeseriesStats: {
          totalStats: {
            viewers: number;
            readers: number;
            netFollowersGained: number;
          };
          points: TimeseriesPoint[];
        };
      };
    }>(
      'UserMonthlyStoryStatsTimeseriesQuery',
      TIMESERIES_QUERY,
      { username, input: { startTime: begin, endTime: end } },
      cacheKey
    );

    const points =
      data.user?.postsAggregateTimeseriesStats?.points ?? [];

    return points.map((point) => ({
      id: 'aggregate',
      title: 'All stories',
      views: point.stats.total.viewers,
      reads: point.stats.total.readers,
      collectedAt: point.timestamp,
    }));
  } catch (err) {
    nextGenerationLog(`Timeseries fetch failed: ${err}`);
    return [];
  }
};

export const getActivities = async (): Promise<PostData[]> => {
  nextGenerationLog(
    'Skipping activities fetch (old REST API no longer available)'
  );
  return [];
};

export const getEarningsOfPost = async (
  post: PostSummary
): Promise<DailyEarning[]> => {
  try {
    nextGenerationLog(`Fetching earnings for: "${post.title}" (${post.id})`);
    const res = await fetch(GRAPHQL_ENDPOINT, {
      credentials: 'same-origin',
      method: 'POST',
      headers: {
        accept: '*/*',
        'graphql-operation': 'StatsPostChart',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        operationName: 'StatsPostChart',
        variables: {
          postId: post.id,
          startAt: 0,
          endAt: Date.now() + ONE_DAY_IN_MS,
        },
        query: EARNINGS_QUERY,
      }),
    });
    if (res.status !== 200) {
      nextGenerationLog(
        `Earnings fetch failed: (${res.status}) - ${res.statusText}`
      );
      return [];
    }
    const text = await res.text();
    const payload = JSON.parse(text);
    return payload.data.post.earnings.dailyEarnings;
  } catch (err) {
    nextGenerationLog(`Earnings fetch error: ${err}`);
    return [];
  }
};

export const convertGraphQlToPostData = (
  dailyEarnings: DailyEarning[],
  post: PostSummary
): PostData[] => {
  return (dailyEarnings ?? []).map((day) => {
    let collectedAt = day.collectedAt;
    if (collectedAt === undefined) {
      collectedAt = day.periodEndedAt
        ? (day.periodEndedAt + day.periodStartedAt) / 2
        : day.periodStartedAt;
    }
    return {
      title: post.title,
      id: post.id,
      earnings: getNumber(day.amount) / 100,
      collectedAt,
    };
  });
};


