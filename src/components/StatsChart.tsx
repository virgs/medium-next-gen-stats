import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BubbleController,
  BarController,
  LineController,
  PieController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { PostData, PostSummary, StatsOptions } from '../types';
import { buildBarChartConfig } from '../charts/barChartConfig';
import { buildPieChartConfig } from '../charts/pieChartConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  BubbleController,
  BarController,
  LineController,
  PieController,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StatsChartProps {
  postsData: PostData[];
  postsSummary: PostSummary[];
  statsOptions: StatsOptions;
  onAnimationComplete?: () => void;
}

export const StatsChart: React.FC<StatsChartProps> = ({
  postsData,
  postsSummary,
  statsOptions,
  onAnimationComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const filteredPostsData = postsData.filter((post) => {
      const collectedAt = new Date(+post.collectedAt);
      return (
        collectedAt >= statsOptions.firstDayOfRange &&
        collectedAt < statsOptions.lastDayOfRange
      );
    });

    const filteredPostsSummary = postsSummary.filter((post) => {
      const date = new Date(+post.firstPublishedAt);
      return (
        date >= statsOptions.firstDayOfRange &&
        date < statsOptions.lastDayOfRange
      );
    });

    const config =
      statsOptions.chartType === 'pie'
        ? buildPieChartConfig(filteredPostsData, statsOptions)
        : buildBarChartConfig(
            filteredPostsData,
            filteredPostsSummary,
            statsOptions
          );

    if (config.options?.animation) {
      const originalOnComplete = (
        config.options.animation as { onComplete?: () => void }
      ).onComplete;
      (config.options.animation as { onComplete?: () => void }).onComplete =
        () => {
          originalOnComplete?.();
          onAnimationComplete?.();
        };
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      chartRef.current = new ChartJS(ctx, config);
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [postsData, postsSummary, statsOptions, onAnimationComplete]);

  return (
    <div className="mngs-stats-chart-wrapper">
      <canvas ref={canvasRef} />
    </div>
  );
};

