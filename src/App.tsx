import React, { useState, useCallback, useMemo } from 'react';
import { ChartType, RelevantDatumFn, StatsOptions, SummaryData, TotalsValues } from './types';
import { useStatsData } from './hooks/useStatsData';
import { SummaryTabs } from './components/SummaryTabs';
import { RangeNavbar } from './components/RangeNavbar';
import { TimeRangeNavbar } from './components/TimeRangeNavbar';
import { ChartPaginator } from './components/ChartPaginator';
import { TotalsTable } from './components/TotalsTable';
import { ActionIcons } from './components/ActionIcons';
import { StatsChart } from './components/StatsChart';
import { ranges, timeRanges } from './utils/ranges';
import {
  ONE_DAY_IN_MS,
  getNumber,
  getViewOfData,
  getReadsOfData,
  getClapsOfData,
  getUpvotesOfData,
  getFollowersOfData,
  getEarningsOfData,
  convertToCsv,
  downloadContent,
} from './utils/formatters';

import './css/mngs.scss';

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

const DATUM_MAP: Record<
  string,
  { fn: RelevantDatumFn; label: string }
> = {
  views: { fn: getViewOfData, label: 'views' },
  reads: { fn: getReadsOfData, label: 'reads' },
  claps: { fn: getClapsOfData, label: 'claps' },
  fans: { fn: getUpvotesOfData, label: 'fans' },
  followers: { fn: getFollowersOfData, label: 'followers' },
  earnings: { fn: getEarningsOfData, label: 'earnings' },
};

export const App: React.FC = () => {
  const { mngsData, loadingPhase } = useStatsData();
  const tomorrow = useMemo(() => createTomorrow(), []);

  const [currentRangeIndex, setCurrentRangeIndex] = useState(0);
  const [currentTimeRangeIndex, setCurrentTimeRangeIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('views');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [currentMonthActive, setCurrentMonthActive] = useState(false);
  const [chartAnimationComplete, setChartAnimationComplete] = useState(false);

  const [firstDayOfRange, setFirstDayOfRange] = useState(
    () =>
      new Date(
        tomorrow.getTime() - timeRanges[0] * ONE_DAY_IN_MS
      )
  );
  const [lastDayOfRange, setLastDayOfRange] = useState(tomorrow);

  const selectedRange = ranges[currentRangeIndex];
  const datumConfig = DATUM_MAP[activeTab] ?? DATUM_MAP.views;

  const statsOptions: StatsOptions = useMemo(
    () => ({
      firstDayOfRange,
      lastDayOfRange,
      chartType,
      relevantDatum: datumConfig.fn,
      relevantDatumLabel: datumConfig.label,
      rangeMethod: selectedRange.rangeMethod,
      label: selectedRange.label,
      postsIdsToHighlight: [],
    }),
    [
      firstDayOfRange,
      lastDayOfRange,
      chartType,
      datumConfig,
      selectedRange,
    ]
  );

  const summary: SummaryData = useMemo(() => {
    const filtered = mngsData.postsData.filter((post) => {
      const collectedAt = new Date(+post.collectedAt);
      return collectedAt >= firstDayOfRange && collectedAt < lastDayOfRange;
    });
    return filtered.reduce(
      (acc, post) => ({
        views: acc.views + getNumber(post.views),
        reads: acc.reads + getNumber(post.reads),
        claps: acc.claps + getNumber(post.claps),
        upvotes: acc.upvotes + getNumber(post.upvotes),
        followers: acc.followers + getNumber(post.followers),
        earnings: acc.earnings + getNumber(post.earnings),
      }),
      { views: 0, reads: 0, claps: 0, upvotes: 0, followers: 0, earnings: 0 }
    );
  }, [mngsData.postsData, firstDayOfRange, lastDayOfRange]);

  const totals: TotalsValues = useMemo(() => {
    return mngsData.postsSummary.reduce(
      (acc, item) => ({
        totals: acc.totals + 1,
        views: acc.views + item.views,
        reads: acc.reads + item.reads,
        claps: acc.claps + item.claps,
        fans: acc.fans + item.upvotes,
      }),
      { totals: 0, views: 0, reads: 0, claps: 0, fans: 0 }
    );
  }, [mngsData.postsSummary]);

  const nextDisabled = useMemo(() => {
    return (
      new Date(lastDayOfRange.getTime() + ONE_DAY_IN_MS).getTime() >=
      tomorrow.getTime()
    );
  }, [lastDayOfRange, tomorrow]);

  const handleRangeChange = useCallback(
    (index: number): void => {
      if (!chartAnimationComplete) return;
      setCurrentRangeIndex(index);
      setChartAnimationComplete(false);
    },
    [chartAnimationComplete]
  );

  const handleTimeRangeChange = useCallback(
    (index: number): void => {
      if (!chartAnimationComplete) return;
      setCurrentTimeRangeIndex(index);
      setCurrentMonthActive(false);
      const days = timeRanges[index];
      setFirstDayOfRange(
        new Date(lastDayOfRange.getTime() - days * ONE_DAY_IN_MS)
      );
      setChartAnimationComplete(false);
    },
    [chartAnimationComplete, lastDayOfRange]
  );

  const handleCurrentMonthClick = useCallback((): void => {
    if (!chartAnimationComplete) return;
    setCurrentMonthActive(true);
    setLastDayOfRange(tomorrow);
    const firstDay = new Date(tomorrow);
    firstDay.setUTCDate(1);
    firstDay.setHours(0, 0, 0, 0);
    setFirstDayOfRange(firstDay);
    setCurrentTimeRangeIndex(0);
    setChartAnimationComplete(false);
  }, [chartAnimationComplete, tomorrow]);

  const handlePrev = useCallback((): void => {
    if (!chartAnimationComplete) return;
    const newLast = firstDayOfRange;
    const days = timeRanges[currentTimeRangeIndex];
    setLastDayOfRange(newLast);
    setFirstDayOfRange(
      new Date(newLast.getTime() - days * ONE_DAY_IN_MS)
    );
    setChartAnimationComplete(false);
  }, [chartAnimationComplete, firstDayOfRange, currentTimeRangeIndex]);

  const handleNext = useCallback((): void => {
    if (!chartAnimationComplete) return;
    const days = timeRanges[currentTimeRangeIndex];
    let newLast = new Date(
      lastDayOfRange.getTime() + days * ONE_DAY_IN_MS
    );
    if (
      new Date(newLast.getTime() + ONE_DAY_IN_MS).getTime() >= Date.now()
    ) {
      newLast = tomorrow;
    }
    setFirstDayOfRange(
      new Date(newLast.getTime() - days * ONE_DAY_IN_MS)
    );
    setLastDayOfRange(newLast);
    setChartAnimationComplete(false);
  }, [
    chartAnimationComplete,
    lastDayOfRange,
    currentTimeRangeIndex,
    tomorrow,
  ]);

  const handleDownload = useCallback((): void => {
    downloadContent(
      JSON.stringify(mngsData.postsData, null, 2),
      'mngs-posts-data.json'
    );
    downloadContent(
      JSON.stringify(mngsData.postsSummary, null, 2),
      'mngs-posts-summary.json'
    );
    downloadContent(
      convertToCsv(
        mngsData.postsData as unknown as Record<string, unknown>[]
      ),
      'mngs-posts-data.csv'
    );
    downloadContent(
      convertToCsv(
        mngsData.postsSummary as unknown as Record<string, unknown>[]
      ),
      'mngs-posts-summary.csv'
    );
  }, [mngsData]);

  const handleAnimationComplete = useCallback((): void => {
    setChartAnimationComplete(true);
  }, []);

  const isLoading = loadingPhase !== 'done';

  return (
    <div className="mngs-container">
      <h1 className="mngs-stats-page-title">
        Next Generation Stats
        <small className="mngs-stats-page-title-version">
          v{chrome.runtime.getManifest().version}
        </small>
      </h1>

      <TimeRangeNavbar
        currentTimeRangeIndex={currentTimeRangeIndex}
        currentMonthActive={currentMonthActive}
        onTimeRangeChange={handleTimeRangeChange}
        onCurrentMonthClick={handleCurrentMonthClick}
      />

      <SummaryTabs
        summary={summary}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <RangeNavbar
        currentRangeIndex={currentRangeIndex}
        onRangeChange={handleRangeChange}
      />

      <StatsChart
        postsData={mngsData.postsData}
        postsSummary={mngsData.postsSummary}
        statsOptions={statsOptions}
        onAnimationComplete={handleAnimationComplete}
      />

      <ActionIcons
        chartType={chartType}
        downloadEnabled={!isLoading}
        label={datumConfig.label}
        onChartTypeChange={setChartType}
        onDownload={handleDownload}
      />

      <ChartPaginator
        currentTimeRangeIndex={currentTimeRangeIndex}
        nextDisabled={nextDisabled}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      <TotalsTable values={totals} />
    </div>
  );
};

