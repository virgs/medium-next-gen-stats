import { ChartConfiguration } from 'chart.js';
import {
  AccumulatedData,
  PostData,
  PostSummary,
  RangeInterval,
  StatsOptions,
} from '../types';
import {
  getNumber,
  getShadeOfColor,
  HIGHLIGHT_COLOR,
  HIGHLIGHTED_ALPHA,
  NOT_HIGHLIGHTED_ALPHA,
  prettifyNumbersWithCommas,
  prettifyNumbersWithUnits,
} from '../utils/formatters';
import { getStringifiedDate } from '../utils/ranges';

const MAX_TOOLTIP_ITEMS = 10;

const getDataOfPostInRange = (
  range: RangeInterval[],
  data: PostData[],
  post: { id: string }
): AccumulatedData[] => {
  return data
    .filter((d) => d.id === post.id)
    .reduce(
      (acc, d) => {
        const index = range.findIndex((item) => {
          const collectedAt = new Date(+d.collectedAt);
          return item.begin <= collectedAt && collectedAt < item.end;
        });
        if (index >= 0) {
          acc[index].views += getNumber(d.views);
          acc[index].claps += getNumber(d.claps);
          acc[index].reads += getNumber(d.reads);
          acc[index].upvotes += getNumber(d.upvotes);
          acc[index].earnings += getNumber(d.earnings);
          acc[index].followers += getNumber(d.followers);
        }
        return acc;
      },
      range.map(
        (): AccumulatedData => ({
          views: 0,
          claps: 0,
          reads: 0,
          followers: 0,
          earnings: 0,
          upvotes: 0,
        })
      )
    );
};

const generateBarChartData = (
  range: RangeInterval[],
  postsData: PostData[],
  statsOptions: StatsOptions
) => {
  const alpha =
    statsOptions.postsIdsToHighlight.length > 0
      ? HIGHLIGHTED_ALPHA
      : NOT_HIGHLIGHTED_ALPHA;
  const grouped = postsData.reduce(
    (acc, info) => {
      if (!acc[info.id]) {
        acc[info.id] = {
          label: info.title ?? '',
          id: info.id,
          data: range.map(() => 0),
        };
      }
      return acc;
    },
    {} as Record<string, { label: string; id: string; data: number[] }>
  );

  return Object.values(grouped)
    .map((post, index, vec) => {
      const bg = getShadeOfColor(vec.length, index);
      const dataOfPost = getDataOfPostInRange(range, postsData, post);
      const data = dataOfPost.map((v) => statsOptions.relevantDatum(v as unknown as PostData));
      return {
        type: 'bar' as const,
        label: post.label,
        id: post.id,
        stack: 'unique',
        barPercentage: 0.95,
        categoryPercentage: 1,
        data,
        backgroundColor: `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${alpha})`,
      };
    })
    .filter((post) => post.data.reduce((a, c) => a + c, 0) > 0);
};

const generateLineChartData = (
  range: RangeInterval[],
  postsData: PostData[],
  statsOptions: StatsOptions
) => {
  const grouped = postsData.reduce(
    (acc, info) => {
      if (!acc[info.id] && statsOptions.postsIdsToHighlight.includes(info.id)) {
        acc[info.id] = {
          id: info.id,
          label: info.title ?? '',
          data: range.map(() => 0),
        };
      }
      return acc;
    },
    {} as Record<string, { id: string; label: string; data: number[] }>
  );

  return Object.values(grouped)
    .map((post, index, vec) => {
      const bg = getShadeOfColor(vec.length, index, HIGHLIGHT_COLOR);
      const color = `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.75)`;
      const dataOfPost = getDataOfPostInRange(range, postsData, post);
      const data = dataOfPost.map((v) => statsOptions.relevantDatum(v as unknown as PostData));
      return {
        type: 'line' as const,
        label: post.label,
        id: post.id,
        order: -2,
        spanGaps: false,
        pointRadius: 2,
        borderWidth: 4,
        fill: false,
        data,
        borderColor: color,
        pointBackgroundColor: color,
        pointBorderColor: color,
      };
    })
    .filter((post) => post.data.reduce((a, c) => a + c, 0) > 0);
};

const generateBubbleChartData = (
  range: RangeInterval[],
  postsSummary: PostSummary[]
) => {
  return postsSummary.reduce(
    (acc, summary) => {
      const indexOfDate = range.findIndex(
        (item) =>
          +summary.firstPublishedAt >= item.begin.getTime() &&
          +summary.firstPublishedAt < item.end.getTime()
      );
      if (indexOfDate === -1) return acc;

      const radius = Math.max(
        Math.min(1.3 * (summary.readingTime ?? 1), 12),
        3
      );
      const y = acc
        .map((ds) => ds.data[indexOfDate])
        .filter(Boolean)
        .reduce((a, bubble) => {
          if (bubble && typeof bubble === 'object' && 'r' in bubble) {
            return a + 5 + 2 * (bubble as { r: number }).r;
          }
          return a;
        }, 0);

      acc.push({
        label: 'Publication original date',
        data: range.map((_, i) =>
          i === indexOfDate ? { x: 0, y, r: radius } : undefined
        ),
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        type: 'bubble' as const,
        order: -1,
        borderWidth: 10,
      });
      return acc;
    },
    [] as Array<{
      label: string;
      data: (undefined | { x: number; y: number; r: number })[];
      backgroundColor: string;
      type: 'bubble';
      order: number;
      borderWidth: number;
    }>
  );
};

export const buildBarChartConfig = (
  postsData: PostData[],
  postsSummary: PostSummary[],
  statsOptions: StatsOptions
): ChartConfiguration => {
  const range = statsOptions.rangeMethod(
    statsOptions.firstDayOfRange,
    statsOptions.lastDayOfRange
  );
  const labels = range.map((interval) => interval.label);

  const barData = generateBarChartData(range, postsData, statsOptions);
  const bubbleData = generateBubbleChartData(range, postsSummary);
  const lineData = generateLineChartData(range, postsData, statsOptions);

  let topPostsOfTooltip: number[] | undefined;
  let currentExcludedItems: number[] = [];

  return {
    type: 'bar',
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      datasets: [...barData, ...bubbleData, ...lineData] as any[],
      labels,
    },
    options: {
      animation: { duration: 750 },
      responsive: true,
      plugins: {
        title: {
          color: '#000',
          display: true,
          font: { size: 24 },
          padding: 12,
          text: `${statsOptions.label} ${statsOptions.relevantDatumLabel} from '${getStringifiedDate(statsOptions.firstDayOfRange)}' to '${getStringifiedDate(statsOptions.lastDayOfRange)}'`,
        },
        legend: {
          position: 'bottom',
          align: 'start',
          labels: {
            boxWidth: 25,
            padding: 30,
            filter: (item) => {
              // Only show line type datasets in legend
              const ds = lineData.find((_, i) => i + barData.length + bubbleData.length === item.datasetIndex);
              return !!ds;
            },
          },
        },
        tooltip: {
          position: 'nearest',
          mode: 'index',
          titleAlign: 'center',
          titleFont: { size: 15 },
          titleMarginBottom: 10,
          bodySpacing: 8,
          bodyFont: { size: 12 },
          bodyAlign: 'left',
          footerAlign: 'center',
          footerFont: { size: 14, style: 'bold' },
          footerMarginTop: 10,
          padding: { y: 10, x: 20 },
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          displayColors: false,
          itemSort: (first, second) =>
            (second.parsed?.y ?? 0) - (first.parsed?.y ?? 0),
          filter: (item) => {
            const parsedValue = item.parsed?.y ?? 0;
            if (parsedValue <= 0) return false;
            if (!topPostsOfTooltip) {
              const allValues = [...barData, ...lineData]
                .map((ds) => ds.data[item.dataIndex] ?? 0)
                .filter((v) => typeof v === 'number' && v > 0)
                .sort((a, b) => (a as number) - (b as number))
                .reverse() as number[];
              topPostsOfTooltip = allValues.slice(0, MAX_TOOLTIP_ITEMS);
              currentExcludedItems = allValues.slice(MAX_TOOLTIP_ITEMS);
            }
            const foundIdx = topPostsOfTooltip.findIndex(
              (v) => v === parsedValue
            );
            if (foundIdx !== -1) {
              topPostsOfTooltip = topPostsOfTooltip.filter(
                (_, i) => i !== foundIdx
              );
              return true;
            }
            return false;
          },
          callbacks: {
            label: (ctx) => {
              const dsLabel = ctx.dataset.label;
              if (!dsLabel) return '';
              const val = ctx.parsed?.y ?? 0;
              const total = (ctx.chart.data.datasets ?? []).reduce(
                (acc, ds) => {
                  const v = ds.data[ctx.dataIndex];
                  return typeof v === 'number' ? acc + v : acc;
                },
                0
              );
              return ` "${dsLabel}":    ${prettifyNumbersWithCommas(val)}   (${((100 * val) / total).toFixed(1)}%)`;
            },
            afterBody: () => {
              if (currentExcludedItems.length === 1)
                return '   and another one...';
              if (currentExcludedItems.length > 1)
                return `   and ${currentExcludedItems.length} others...`;
              return '';
            },
            footer: (tooltipItems) => {
              const value =
                tooltipItems.reduce(
                  (acc, ti) => (ti.parsed?.y ?? 0) + acc,
                  0
                ) + currentExcludedItems.reduce((a, v) => a + v, 0);
              const total =
                tooltipItems.length + currentExcludedItems.length;
              currentExcludedItems = [];
              topPostsOfTooltip = undefined;

              let label = statsOptions.relevantDatumLabel;
              if (value <= 1)
                label = label.substring(0, label.length - 1);
              let footer = `Total: ${prettifyNumbersWithCommas(value)} ${label}`;
              const highlighted = statsOptions.postsIdsToHighlight.length;
              if (!label.startsWith('follower')) {
                footer += highlighted > 0
                  ? ` of ${highlighted} highlighted article${highlighted > 1 ? 's' : ''}`
                  : ` of ${total} article${total > 1 ? 's' : ''}`;
              }
              return footer;
            },
          },
          intersect: true,
        },
      },
      hover: { mode: 'index', intersect: true },
      scales: {
        y: {
          type: 'linear',
          grid: { drawBorder: false },
          ticks: {
            callback: (value) => prettifyNumbersWithUnits(value as number),
          },
          beginAtZero: true,
        },
        x: {
          stacked: true,
          ticks: {
            padding: 10,
            autoSkipPadding: 50,
            autoSkip: true,
            maxRotation: 0,
            minRotation: 0,
          },
          grid: { display: false },
        },
      },
    },
  } as ChartConfiguration;
};

