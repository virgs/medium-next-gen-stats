import { addToCache, loadCache } from './cache';
import { nextGenerationLog } from '../utils/logger';
import { GRAPHQL_ENDPOINT } from './graphqlQueries';

interface CacheCounter {
  total: number;
  used: number;
}

const cacheCounter: CacheCounter = { total: 0, used: 0 };

export const extractUsername = (): string => {
  nextGenerationLog('Extracting username from page state');
  try {
    const scripts = document.querySelectorAll('script');
    for (const s of scripts) {
      const text = s.textContent ?? '';
      if (text.includes('window.__PRELOADED_STATE__')) {
        const match = text.match(/"username"\s*:\s*"([^"]+)"/);
        if (match) {
          nextGenerationLog(
            `Username from __PRELOADED_STATE__: ${match[1]}`
          );
          return match[1];
        }
      }
    }
  } catch (e) {
    nextGenerationLog(`Error reading __PRELOADED_STATE__: ${e}`);
  }

  const profileLink = document.querySelector('a[href*="/@"]');
  if (profileLink) {
    const href = profileLink.getAttribute('href') ?? '';
    const match = href.match(/@([^/?]+)/);
    if (match) {
      nextGenerationLog(`Username from profile link: ${match[1]}`);
      return match[1];
    }
  }

  throw new Error('Could not determine Medium username from page');
};

export const graphqlFetch = async <T>(
  operationName: string,
  query: string,
  variables: Record<string, unknown>,
  cacheKey?: string
): Promise<T> => {
  ++cacheCounter.total;
  if (cacheKey) {
    const cached = await loadCache(cacheKey);
    if (cached) {
      ++cacheCounter.used;
      nextGenerationLog(`Cache hit: ${operationName} (${cacheKey})`);
      return cached as T;
    }
  }

  nextGenerationLog(`GraphQL request: ${operationName}`);
  const res = await fetch(GRAPHQL_ENDPOINT, {
    credentials: 'same-origin',
    method: 'POST',
    headers: {
      accept: '*/*',
      'content-type': 'application/json',
      'graphql-operation': operationName,
    },
    body: JSON.stringify([{ operationName, variables, query }]),
  });

  if (res.status !== 200) {
    nextGenerationLog(
      `GraphQL HTTP error: ${res.status} ${res.statusText}`
    );
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json();
  const data = Array.isArray(json) ? json[0].data : json.data;
  if (cacheKey) {
    await addToCache(cacheKey, data);
  }
  return data as T;
};

export const getCacheStats = (): CacheCounter => ({ ...cacheCounter });

