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
      nextGenerationLog(
        `Phase: initial-stats (last ${INITIAL_DAYS} days)`
      );
      const initialPostsData = await loadPostsData(
        postsSummary,
        initialLoadingDate,
        tomorrow.getTime(),
        true
      );
      nextGenerationLog(
        `Initial stats loaded: ${initialPostsData.length} data points`
      );

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...initialPostsData],
      }));

      setLoadingPhase('activities');
      nextGenerationLog('Phase: activities');
      const activities = await getActivities();
      nextGenerationLog(
        `Activities loaded: ${activities.length} follower events`
      );

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...activities],
      }));

      setLoadingPhase('earnings');
      nextGenerationLog('Phase: earnings');
      const earnings = await loadEarningsData(postsSummary);
      nextGenerationLog(
        `Earnings loaded: ${earnings.length} data points`
      );

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...earnings],
      }));

      setLoadingPhase('remaining-stats');
      nextGenerationLog('Phase: remaining-stats (historical data)');
      const remainingData = await loadPostsData(
        postsSummary,
        initialLoadingDate,
        tomorrow.getTime(),
        false
      );
      nextGenerationLog(
        `Remaining stats loaded: ${remainingData.length} data points`
      );

      setMngsData((prev) => ({
        ...prev,
        postsData: [...prev.postsData, ...remainingData],
      }));

      const cacheStats = getCacheStats();
      nextGenerationLog(
        `Done. Cache hit: ${((100 * cacheStats.used) / cacheStats.total).toFixed(1)}%`
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

const loadPostsData = async (
  postsSummary: MngsData['postsSummary'],
  initialLoadingDate: number,
  tomorrowTime: number,
  isInitialLoading: boolean
): Promise<PostData[]> => {
  const results = await Promise.all(
    postsSummary.map(async (post) => {
      const publishedAt =
        +post.firstPublishedAt - ONE_DAY_IN_MS;
      if (isInitialLoading) {
        return getPostStats(post, initialLoadingDate, tomorrowTime);
      } else if (publishedAt < initialLoadingDate) {
        return getPostStats(
          post,
          publishedAt,
          new Date(initialLoadingDate - 1).getTime()
        );
      }
      return [];
    })
  );
  return results.flat();
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

