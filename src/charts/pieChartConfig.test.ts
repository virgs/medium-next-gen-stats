import { describe, it, expect } from 'vitest';
import { buildPieChartConfig } from './pieChartConfig';
import { PostData, StatsOptions } from '../types';
import { getViewOfData } from '../utils/formatters';
import { getRangeInDays } from '../utils/ranges';

describe('buildPieChartConfig', () => {
  const firstDay = new Date(Date.UTC(2024, 0, 1));
  const lastDay = new Date(Date.UTC(2024, 0, 4));

  const statsOptions: StatsOptions = {
    firstDayOfRange: firstDay,
    lastDayOfRange: lastDay,
    chartType: 'pie',
    relevantDatum: getViewOfData,
    relevantDatumLabel: 'views',
    rangeMethod: getRangeInDays,
    label: 'Daily',
    postsIdsToHighlight: [],
  };

  const postsData: PostData[] = [
    {
      id: 'post1',
      title: 'Post 1',
      views: 100,
      collectedAt: Date.now(),
    },
    {
      id: 'post2',
      title: 'Post 2',
      views: 200,
      collectedAt: Date.now(),
    },
  ];

  it('returns a pie chart configuration', () => {
    const config = buildPieChartConfig(postsData, statsOptions);
    expect(config.type).toBe('pie');
  });

  it('includes data with labels and datasets', () => {
    const config = buildPieChartConfig(postsData, statsOptions);
    expect(config.data?.labels).toBeDefined();
    expect(config.data?.datasets).toBeDefined();
    expect(config.data!.datasets).toHaveLength(1);
  });

  it('sorts data by value descending', () => {
    const config = buildPieChartConfig(postsData, statsOptions);
    const labels = config.data?.labels as string[];
    expect(labels[0]).toBe('Post 2');
    expect(labels[1]).toBe('Post 1');
  });

  it('sets title text with date range', () => {
    const config = buildPieChartConfig(postsData, statsOptions);
    const title = (config.options?.plugins as { title?: { text?: string } })?.title?.text;
    expect(title).toContain('Views');
  });

  it('handles empty posts data', () => {
    const config = buildPieChartConfig([], statsOptions);
    expect(config.data?.datasets[0].data).toHaveLength(0);
  });
});

