import { useState, useEffect } from 'react';
import { MngsData, PostData } from '../types';
import {
  getPostsFromUser,
  getPostsFromPublication,
  getPostStats,
  getActivities,
  getEarningsOfPost,
  convertGraphQlToPostData,
  getCacheStats,
} from '../services/api';
import { nextGenerationLog } from '../utils/logger';
import { ONE_DAY_IN_MS } from '../utils/formatters';

export type LoadingPhase =
  | 'idle'
  | 'posts'
  | 'initial-stats'
  | 'activities'
  | 'earnings'
  | 'remaining-stats'
  | 'done';

interface UseStatsDataResult {
  mngsData: MngsData;
  loadingPhase: LoadingPhase;
}

const INITIAL_DAYS = 60;

const createTomorrow = (): Date => {
  const now = new Date();
  return new Date(
    new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    ).getTime() + ONE_DAY_IN_MS
  );
};

const PUBLICATION_REGEX = /https:\/\/medium\.com\/(.+)\/stats\/stories/;

export const useStatsData = (): UseStatsDataResult => {
  const [mngsData, setMngsData] = useState<MngsData>({
    postsData: [],
    postsSummary: [],
    user: null,
    publicationName: null,
  });
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>('idle');

  const loadData = async (): Promise<void> => {
    const tomorrow = createTomorrow();
    const initialLoadingDate = new Date(
      tomorrow.getTime() - INITIAL_DAYS * ONE_DAY_IN_MS
    ).getTime();

    try {
      setLoadingPhase('posts');
      nextGenerationLog('Started');

      let postsSummary;
      let user = null;
      let publicationName = null;

      const match = document.location.href.match(PUBLICATION_REGEX);
      if (match) {
        publicationName = match[1];
        nextGenerationLog(
          `Detected publication page: ${publicationName}`
        );
        postsSummary = await getPostsFromPublication(publicationName);
      } else {
        nextGenerationLog('Detected personal stats page');
        const result = await getPostsFromUser();
        postsSummary = result.posts;
        user = result.user;
      }

      setMngsData((prev) => ({
        ...prev,
        postsSummary,
        user,
        publicationName,
      }));

      nextGenerationLog(
        `Loading data of ${postsSummary.length} posts`
      );

      setLoadingPhase('initial-stats');
      const initialPostsData = await loadTimeseriesData(
        postsSummary[0],
        initialLoadingDate,
        tomorrow.getTime()
      );
      nextGenerationLog(
        `Initial stats: ${initialPostsData.length} data points`
      );

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...initialPostsData],
      }));

      setLoadingPhase('activities');
      const activities = await getActivities();

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...activities],
      }));

      setLoadingPhase('earnings');
      const earnings = await loadEarningsData(postsSummary);
      nextGenerationLog(
        `Earnings: ${earnings.length} data points`
      );

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...earnings],
      }));

      setLoadingPhase('remaining-stats');
      const oldestPublished = getOldestPublishDate(postsSummary);
      const remainingData = oldestPublished < initialLoadingDate
        ? await loadTimeseriesData(
            postsSummary[0],
            oldestPublished,
            initialLoadingDate - 1
          )
        : [];
      nextGenerationLog(
        `Historical stats: ${remainingData.length} data points`
      );

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...remainingData],
      }));

      const cacheStats = getCacheStats();
      nextGenerationLog(
        `Done. Cache hit: ${cacheStats.total > 0 ? ((100 * cacheStats.used) / cacheStats.total).toFixed(1) : 0}%`
      );
      setLoadingPhase('done');
    } catch (error) {
      console.error('Failed to load stats data:', error);
      setLoadingPhase('done');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return { mngsData, loadingPhase };
};

const getOldestPublishDate = (
  postsSummary: MngsData['postsSummary']
): number => {
  if (postsSummary.length === 0) return Date.now();
  return Math.min(
    ...postsSummary.map((p) => +p.firstPublishedAt - ONE_DAY_IN_MS)
  );
};

const loadTimeseriesData = async (
  firstPost: MngsData['postsSummary'][0] | undefined,
  begin: number,
  end: number
): Promise<PostData[]> => {
  if (!firstPost) return [];

  const MONTH_MS = 30 * ONE_DAY_IN_MS;
  const chunks: PostData[] = [];
  let chunkEnd = end;

  while (chunkEnd > begin) {
    const chunkStart = Math.max(begin, chunkEnd - MONTH_MS);
    const data = await getPostStats(firstPost, chunkStart, chunkEnd);
    chunks.push(...data);
    chunkEnd = chunkStart;
  }
  return chunks;
};

const loadEarningsData = async (
  postsSummary: MngsData['postsSummary']
): Promise<PostData[]> => {
  const results = await Promise.all(
    postsSummary.map(async (post) => {
      const dailyEarnings = await getEarningsOfPost(post);
      return convertGraphQlToPostData(dailyEarnings, post);
    })
  );
  nextGenerationLog('Earnings data aggregated');
  return results.flat();
};

