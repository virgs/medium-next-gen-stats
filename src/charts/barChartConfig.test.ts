import { describe, it, expect } from 'vitest';
import { buildBarChartConfig } from './barChartConfig';
import { PostData, PostSummary, StatsOptions } from '../types';
import { getViewOfData } from '../utils/formatters';
import { getRangeInDays } from '../utils/ranges';

describe('buildBarChartConfig', () => {
  const firstDay = new Date(Date.UTC(2024, 0, 1));
  const lastDay = new Date(Date.UTC(2024, 0, 4));

  const statsOptions: StatsOptions = {
    firstDayOfRange: firstDay,
    lastDayOfRange: lastDay,
    chartType: 'bar',
    relevantDatum: getViewOfData,
    relevantDatumLabel: 'views',
    rangeMethod: getRangeInDays,
    label: 'Daily',
    postsIdsToHighlight: [],
  };

  const postsData: PostData[] = [
    {
      id: 'post1',
      title: 'Test Post',
      views: 100,
      reads: 50,
      collectedAt: new Date(Date.UTC(2024, 0, 1, 12)).getTime(),
    },
    {
      id: 'post1',
      title: 'Test Post',
      views: 200,
      reads: 100,
      collectedAt: new Date(Date.UTC(2024, 0, 2, 12)).getTime(),
    },
  ];

  const postsSummary: PostSummary[] = [
    {
      id: 'post1',
      postId: 'post1',
      title: 'Test Post',
      views: 300,
      reads: 150,
      claps: 10,
      upvotes: 5,
      firstPublishedAt: new Date(Date.UTC(2024, 0, 1)).getTime(),
      readingTime: 5,
    },
  ];

  it('returns a bar chart configuration', () => {
    const config = buildBarChartConfig(postsData, postsSummary, statsOptions);
    expect(config.type).toBe('bar');
  });

  it('includes datasets', () => {
    const config = buildBarChartConfig(postsData, postsSummary, statsOptions);
    expect(config.data?.datasets).toBeDefined();
    expect(config.data!.datasets.length).toBeGreaterThan(0);
  });

  it('includes labels from range', () => {
    const config = buildBarChartConfig(postsData, postsSummary, statsOptions);
    expect(config.data?.labels).toBeDefined();
    expect(config.data!.labels!.length).toBe(3);
  });

  it('sets title text with date range', () => {
    const config = buildBarChartConfig(postsData, postsSummary, statsOptions);
    const title = (config.options?.plugins as { title?: { text?: string } })?.title?.text;
    expect(title).toContain('Daily');
    expect(title).toContain('views');
  });

  it('handles empty posts data', () => {
    const config = buildBarChartConfig([], [], statsOptions);
    expect(config.data?.datasets).toBeDefined();
  });
});

