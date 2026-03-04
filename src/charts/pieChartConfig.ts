import { ChartConfiguration } from 'chart.js';
import { PostData, StatsOptions } from '../types';
import {
  getShadeOfColor,
  HIGHLIGHT_COLOR,
  HIGHLIGHTED_ALPHA,
  NOT_HIGHLIGHTED_ALPHA,
  prettifyNumbersWithCommas,
} from '../utils/formatters';
import { getStringifiedDate } from '../utils/ranges';
import { ONE_DAY_IN_MS } from '../utils/formatters';

const MAX_LEGEND_ITEMS = 10;

const ordinalNumber = (value: number): string => {
  if (value === 1) return '1st';
  if (value === 2) return '2nd';
  if (value === 3) return '3rd';
  return `${value}th`;
};

interface PieChartDatum {
  id: string;
  title?: string;
  value: number;
  backgroundColor?: string;
}

const getPieChartData = (
  postsData: PostData[],
  statsOptions: StatsOptions
): PieChartDatum[] => {
  return Object.values(
    postsData.reduce(
      (acc, data) => {
        const id = data.id;
        if (!acc[id]) {
          acc[id] = {
            id,
            title: data.title,
            value: statsOptions.relevantDatum(data),
          };
        } else {
          acc[id].value += statsOptions.relevantDatum(data);
        }
        return acc;
      },
      {} as Record<string, PieChartDatum>
    )
  )
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
};

const setBackgroundColor = (
  pieChartData: PieChartDatum[],
  statsOptions: StatsOptions
): void => {
  const alpha =
    statsOptions.postsIdsToHighlight.length > 0
      ? HIGHLIGHTED_ALPHA
      : NOT_HIGHLIGHTED_ALPHA;

  pieChartData.forEach((item, index, vec) => {
    const findIndex = statsOptions.postsIdsToHighlight.findIndex(
      (highlightedId) => highlightedId === item.id
    );
    if (findIndex !== -1) {
      const bg = getShadeOfColor(
        statsOptions.postsIdsToHighlight.length,
        findIndex,
        HIGHLIGHT_COLOR
      );
      item.backgroundColor = `rgba(${bg.r}, ${bg.g}, ${bg.b}, 0.95)`;
    } else {
      const bg = getShadeOfColor(vec.length, index);
      item.backgroundColor = `rgba(${bg.r}, ${bg.g}, ${bg.b}, ${alpha})`;
    }
  });
};

export const buildPieChartConfig = (
  postsData: PostData[],
  statsOptions: StatsOptions
): ChartConfiguration => {
  const pieChartData = getPieChartData(postsData, statsOptions);
  setBackgroundColor(pieChartData, statsOptions);

  const labels = pieChartData.map((item) => item.title ?? '');
  const chartData = pieChartData.map((item) => item.value);
  const colors = pieChartData.map((item) => item.backgroundColor ?? '');

  const capitalizedLabel =
    statsOptions.relevantDatumLabel.substring(0, 1).toUpperCase() +
    statsOptions.relevantDatumLabel.substring(1);

  return {
    type: 'pie',
    data: {
      labels,
      datasets: [{ backgroundColor: colors, data: chartData }],
    },
    options: {
      cutout: '40%',
      rotation: 180,
      animation: { duration: 750 },
      responsive: true,
      plugins: {
        title: {
          color: '#000',
          display: true,
          font: { size: 24 },
          padding: 12,
          text: `${capitalizedLabel} from '${getStringifiedDate(statsOptions.firstDayOfRange)}' to '${getStringifiedDate(new Date(statsOptions.lastDayOfRange.getTime() - ONE_DAY_IN_MS))}'`,
        },
        legend: {
          position: 'right',
          align: 'start',
          labels: {
            boxWidth: 25,
            padding: 30,
            filter: (legendItem) => (legendItem.index ?? 0) < MAX_LEGEND_ITEMS,
            generateLabels: (chart) => {
              const data = chart.data;
              if (data.labels?.length && data.datasets?.length) {
                return (data.labels as string[]).map((label, index) => {
                  const value = (data.datasets[0].data[index] as number) ?? 0;
                  let text = `${ordinalNumber(index + 1).padStart(4, ' ')} (${value.toFixed(2)})`;
                  if (label) text += ` - "${label}"`;
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(index) as {
                    backgroundColor: string;
                    borderColor: string;
                    borderWidth: number;
                  };
                  return {
                    text,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    hidden:
                      isNaN(data.datasets[0].data[index] as number) ||
                      !meta.data[index]?.active,
                    index,
                  };
                });
              }
              return [];
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
          callbacks: {
            label: (ctx) => {
              const ds = ctx.chart.data.datasets[0].data as number[];
              const total = ds.reduce((a, v) => a + v, 0);
              const value = ds[ctx.dataIndex];
              const title = (ctx.chart.data.labels as string[])?.[
                ctx.dataIndex
              ];
              return `${title ? `"${title}":   ` : ''} ${prettifyNumbersWithCommas(value)}   (${((100 * value) / total).toFixed(1)}%)`;
            },
          },
          intersect: true,
        },
      },
      hover: { mode: 'index', intersect: true },
    },
  } as ChartConfiguration;
};

