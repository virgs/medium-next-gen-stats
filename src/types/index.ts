export interface PostSummary {
  id: string;
  postId: string;
  title: string;
  views: number;
  reads: number;
  claps: number;
  upvotes: number;
  firstPublishedAt: number;
  readingTime: number;
  previewImage?: {
    id: string;
  };
}

export interface PostData {
  id: string;
  title?: string;
  views?: number;
  reads?: number;
  claps?: number;
  upvotes?: number;
  followers?: number;
  earnings?: number;
  collectedAt: number;
  readingTime?: number;
  activityType?: string;
}

export interface RangeInterval {
  begin: Date;
  end: Date;
  label: string;
}

export type RangeMethod = (beginDate: Date, endDate: Date) => RangeInterval[];

export interface RangeOption {
  rangeMethod: RangeMethod;
  label: string;
}

export type RelevantDatumFn = (data: PostData) => number;

export interface StatsOptions {
  firstDayOfRange: Date;
  lastDayOfRange: Date;
  chartType: ChartType;
  relevantDatum: RelevantDatumFn;
  relevantDatumLabel: string;
  rangeMethod: RangeMethod;
  label: string;
  postsIdsToHighlight: string[];
}

export interface MngsData {
  postsData: PostData[];
  postsSummary: PostSummary[];
  user: Record<string, unknown> | null;
  publicationName: string | null;
}

export interface Color {
  r: number;
  g: number;
  b: number;
}

export interface TotalsValues {
  totals: number;
  views: number;
  reads: number;
  claps: number;
  fans: number;
}

export interface SummaryData {
  views: number;
  reads: number;
  claps: number;
  upvotes: number;
  followers: number;
  earnings: number;
}

export type ChartType = 'bar' | 'pie';

export interface DailyEarning {
  periodEndedAt?: number;
  periodStartedAt: number;
  amount: number;
  collectedAt?: number;
}

export interface AccumulatedData {
  views: number;
  claps: number;
  reads: number;
  upvotes: number;
  earnings: number;
  followers: number;
}

