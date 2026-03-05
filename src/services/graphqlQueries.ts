export const GRAPHQL_ENDPOINT = 'https://medium.com/_/graphql';

export interface GraphQlPostNode {
  id: string;
  firstPublishedAt: number;
  title: string;
  readingTime: number;
  isLocked: boolean;
  totalStats: {
    views: number;
    reads: number;
    presentations: number | null;
  };
  earnings: {
    total: { units: number; nanos: number };
  };
  creator: {
    id: string;
    username: string;
    name: string;
  };
}

export interface PostsConnectionPage {
  edges: { node: GraphQlPostNode }[];
  pageInfo: { endCursor: string; hasNextPage: boolean };
}

export interface TimeseriesPoint {
  timestamp: number;
  stats: { total: { viewers: number; readers: number } };
}

export const LIFETIME_QUERY = `query UserLifetimeStoryStatsPostsQuery(
  $username: ID!, $first: Int!, $after: String!,
  $orderBy: UserPostsOrderBy, $filter: UserPostsFilter
) {
  user(username: $username) {
    id
    postsConnection(first: $first, after: $after, orderBy: $orderBy, filter: $filter) {
      __typename
      edges {
        node {
          id
          firstPublishedAt
          title
          readingTime
          isLocked
          totalStats { presentations views reads __typename }
          earnings { total { currencyCode nanos units __typename } __typename }
          creator { id username name __typename }
          __typename
        }
        __typename
      }
      pageInfo { endCursor hasNextPage __typename }
    }
    __typename
  }
}`;

export const TIMESERIES_QUERY = `query UserMonthlyStoryStatsTimeseriesQuery(
  $username: ID!, $input: UserPostsAggregateStatsInput!
) {
  user(username: $username) {
    id
    postsAggregateTimeseriesStats(input: $input) {
      __typename
      ... on AggregatePostTimeseriesStats {
        totalStats { presentations viewers readers netFollowersGained netSubscribersGained __typename }
        points { timestamp stats { total { viewers readers __typename } __typename } __typename }
        __typename
      }
    }
    __typename
  }
}`;

export const EARNINGS_QUERY = `query StatsPostChart($postId: ID!, $startAt: Long!, $endAt: Long!) {
  post(id: $postId) {
    id
    ...StatsPostChart_dailyStats
    ...StatsPostChart_dailyEarnings
    __typename
  }
}
fragment StatsPostChart_dailyStats on Post {
  dailyStats(startAt: $startAt, endAt: $endAt) {
    periodStartedAt
    views
    internalReferrerViews
    memberTtr
    __typename
  }
  __typename
}
fragment StatsPostChart_dailyEarnings on Post {
  earnings {
    dailyEarnings(startAt: $startAt, endAt: $endAt) {
      periodEndedAt
      periodStartedAt
      amount
      __typename
    }
    lastCommittedPeriodStartedAt
    __typename
  }
  __typename
}`;

