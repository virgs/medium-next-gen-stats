import { DailyEarning, PostData, PostSummary } from '../types';
import { addToCache, loadCache } from './cache';
import { nextGenerationLog } from '../utils/logger';
import { ONE_DAY_IN_MS, getNumber } from '../utils/formatters';

interface CacheCounter {
  total: number;
  used: number;
}

const cacheCounter: CacheCounter = { total: 0, used: 0 };

interface RequestOptions {
  cache?: boolean;
}

interface MediumPayload {
  value?: PostSummary[];
  paging?: {
    next?: { to?: string };
  };
  references?: {
    User: Record<string, unknown>;
  };
}

export const request = async (
  url: string,
  options?: RequestOptions
): Promise<MediumPayload> => {
  ++cacheCounter.total;
  if (options?.cache) {
    const cache = await loadCache(url);
    if (cache) {
      ++cacheCounter.used;
      return cache as MediumPayload;
    }
  }

  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { accept: 'application/json' },
  });

  if (response.status === 200) {
    const text = await response.text();
    const payload = JSON.parse(text.split('</x>')[1]).payload;
    if (options?.cache) {
      await addToCache(url, payload);
    }
    return payload;
  }

  console.error(
    `Fail to fetch data: (${response.status}) - ${response.statusText}`
  );
  return {};
};

export const getPosts = async (url: string): Promise<PostSummary[]> => {
  const posts = await request(url);
  return (posts.value ?? []).map((post) => ({
    ...post,
    id: post.postId,
  }));
};

export const getPostsFromUser = async (): Promise<{
  posts: PostSummary[];
  user: Record<string, unknown> | null;
}> => {
  const message = await getTotals('me/stats');
  const user = message.references?.User ?? null;
  const posts = (message.value ?? []).map((item) => ({
    ...item,
    id: item.postId,
  }));
  return { posts, user };
};

export const getPostsFromPublication = async (
  publication: string
): Promise<PostSummary[]> => {
  return getPosts(
    `https://medium.com/${publication}/stats?format=json&limit=1000000`
  );
};

export const getTotals = async (
  url: string,
  payload?: MediumPayload
): Promise<MediumPayload> => {
  const finalUrl = `https://medium.com/${url}?limit=500`;
  if (!payload) {
    const response = await request(finalUrl);
    return getTotals(url, response);
  }

  const { value, paging } = payload;
  if (paging?.next?.to && value?.length) {
    const paginatedUrl = `${finalUrl}&to=${paging.next.to}`;
    try {
      const response = await request(paginatedUrl);
      payload.value = [...(payload.value ?? []), ...(response.value ?? [])];
      payload.paging = response.paging;
      return getTotals(url, payload);
    } catch (err) {
      console.error(err);
      return payload;
    }
  }
  return payload;
};

export const getPostStats = async (
  post: PostSummary,
  begin: number,
  end: number
): Promise<PostData[]> => {
  const beginningOfTheMonth = new Date();
  beginningOfTheMonth.setUTCDate(0);
  beginningOfTheMonth.setUTCHours(0, 0, 0, 0);

  const promises = [
    request(
      `https://medium.com/stats/${post.id}/${beginningOfTheMonth.getTime()}/${end + 1}?format=json`,
      { cache: true }
    ),
  ];

  let iterator = beginningOfTheMonth.getTime() - 1;
  while (iterator > begin) {
    const fetchBegin = new Date(iterator);
    fetchBegin.setUTCMonth(fetchBegin.getUTCMonth() - 1);
    const fetchStart =
      fetchBegin.getTime() < begin ? begin : fetchBegin.getTime();
    promises.push(
      request(
        `https://medium.com/stats/${post.id}/${fetchStart}/${iterator - 1}?format=json`,
        { cache: true }
      )
    );
    iterator = fetchStart;
  }

  const data = await Promise.all(promises);
  return data
    .reduce((acc: PostData[], item) => {
      const stats = (item.value as unknown as PostData[]) ?? [];
      return acc.concat(stats);
    }, [])
    .map((item) => ({ ...item, id: post.id, title: post.title }));
};

export const getActivities = async (): Promise<PostData[]> => {
  const response = await request(
    'https://medium.com/_/api/activity?limit=1000000'
  );
  const data = (response?.value as unknown as PostData[]) ?? [];
  const rollUp = data
    .filter(
      (item) => item.activityType === 'users_following_you_rollup'
    )
    .flatMap(
      (item) => (item as unknown as { rollupItems: PostData[] }).rollupItems
    );
  const activities = [...data, ...rollUp]
    .filter((item) => item.activityType === 'users_following_you')
    .map((item) => ({
      ...item,
      followers: 1,
      collectedAt: (item as unknown as { occurredAt: number }).occurredAt,
    }));
  nextGenerationLog('Activities data aggregated');
  return activities;
};

export const getEarningsOfPost = async (
  post: PostSummary
): Promise<DailyEarning[]> => {
  try {
    const res = await fetch('https://medium.com/_/graphql', {
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
        query: `query StatsPostChart($postId: ID!, $startAt: Long!, $endAt: Long!) {
  post(id: $postId) {
    id
    ...StatsPostChart_dailyStats
    ...StatsPostChart_dailyEarnings
    __typename
  }
}
fragment StatsPostChart_dailyStats on Post {
  dailyStats(startAt: $startAt, endAt: $endAt) {
    periodStartedAt
    views
    internalReferrerViews
    memberTtr
    __typename
  }
  __typename
}
fragment StatsPostChart_dailyEarnings on Post {
  earnings {
    dailyEarnings(startAt: $startAt, endAt: $endAt) {
      periodEndedAt
      periodStartedAt
      amount
      __typename
    }
    lastCommittedPeriodStartedAt
    __typename
  }
  __typename
}`,
      }),
    });
    if (res.status !== 200) {
      console.error(
        `Fail to fetch data: (${res.status}) - ${res.statusText}`
      );
      return [];
    }
    const text = await res.text();
    const payload = JSON.parse(text);
    return payload.data.post.earnings.dailyEarnings;
  } catch {
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

export const getCacheStats = (): CacheCounter => ({ ...cacheCounter });

