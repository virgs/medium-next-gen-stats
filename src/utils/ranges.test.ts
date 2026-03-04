import { describe, it, expect } from 'vitest';
import {
  getRangeInDays,
  getRangeInWeeks,
  getRangeInMonths,
  getStringifiedDate,
  getStringifiedMonth,
  getStringifiedWeekDifference,
  ranges,
  timeRanges,
} from './ranges';

describe('getStringifiedDate', () => {
  it('formats a date as DD/Mon/YYYY', () => {
    const date = new Date(Date.UTC(2024, 0, 15));
    const result = getStringifiedDate(date);
    expect(result).toMatch(/\d{2}\/\w{3}\/\d{4}/);
  });
});

describe('getStringifiedMonth', () => {
  it('formats a date as MonthName/Year', () => {
    const date = new Date(2024, 5, 1);
    const result = getStringifiedMonth(date);
    expect(result).toContain('2024');
  });
});

describe('getStringifiedWeekDifference', () => {
  it('formats same-month week range', () => {
    const start = new Date(Date.UTC(2024, 0, 1));
    const end = new Date(Date.UTC(2024, 0, 7));
    const result = getStringifiedWeekDifference(start, end);
    expect(result).toContain(' to ');
  });

  it('formats cross-month week range', () => {
    const start = new Date(Date.UTC(2024, 0, 28));
    const end = new Date(Date.UTC(2024, 1, 3));
    const result = getStringifiedWeekDifference(start, end);
    expect(result).toContain(' to ');
  });

  it('formats cross-year week range', () => {
    const start = new Date(Date.UTC(2023, 11, 28));
    const end = new Date(Date.UTC(2024, 0, 3));
    const result = getStringifiedWeekDifference(start, end);
    expect(result).toContain(' to ');
  });
});

describe('getRangeInDays', () => {
  it('returns correct number of day intervals', () => {
    const begin = new Date(Date.UTC(2024, 0, 1));
    const end = new Date(Date.UTC(2024, 0, 4));
    const result = getRangeInDays(begin, end);
    expect(result).toHaveLength(3);
  });

  it('each interval has begin, end, and label', () => {
    const begin = new Date(Date.UTC(2024, 0, 1));
    const end = new Date(Date.UTC(2024, 0, 2));
    const result = getRangeInDays(begin, end);
    expect(result[0]).toHaveProperty('begin');
    expect(result[0]).toHaveProperty('end');
    expect(result[0]).toHaveProperty('label');
  });

  it('intervals are consecutive', () => {
    const begin = new Date(Date.UTC(2024, 0, 1));
    const end = new Date(Date.UTC(2024, 0, 5));
    const result = getRangeInDays(begin, end);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].begin.getTime()).toBe(result[i - 1].end.getTime());
    }
  });
});

describe('getRangeInWeeks', () => {
  it('returns weekly intervals', () => {
    const begin = new Date(Date.UTC(2024, 0, 1));
    const end = new Date(Date.UTC(2024, 0, 22));
    const result = getRangeInWeeks(begin, end);
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('each interval spans 7 days', () => {
    const begin = new Date(Date.UTC(2024, 0, 1));
    const end = new Date(Date.UTC(2024, 0, 15));
    const result = getRangeInWeeks(begin, end);
    const oneWeek = 7 * 24 * 3600 * 1000;
    result.forEach((interval) => {
      expect(interval.end.getTime() - interval.begin.getTime()).toBe(oneWeek);
    });
  });
});

describe('getRangeInMonths', () => {
  it('returns monthly intervals', () => {
    const begin = new Date(Date.UTC(2024, 0, 1));
    const end = new Date(Date.UTC(2024, 3, 1));
    const result = getRangeInMonths(begin, end);
    expect(result).toHaveLength(4);
  });

  it('handles cross-year ranges', () => {
    const begin = new Date(Date.UTC(2023, 10, 1));
    const end = new Date(Date.UTC(2024, 1, 1));
    const result = getRangeInMonths(begin, end);
    expect(result).toHaveLength(4);
  });
});

describe('ranges constant', () => {
  it('has 3 range options (Daily, Weekly, Monthly)', () => {
    expect(ranges).toHaveLength(3);
    expect(ranges[0].label).toBe('Daily');
    expect(ranges[1].label).toBe('Weekly');
    expect(ranges[2].label).toBe('Monthly');
  });

  it('each range has rangeMethod and label', () => {
    ranges.forEach((range) => {
      expect(range).toHaveProperty('rangeMethod');
      expect(range).toHaveProperty('label');
      expect(typeof range.rangeMethod).toBe('function');
    });
  });
});

describe('timeRanges constant', () => {
  it('has expected time range values', () => {
    expect(timeRanges).toEqual([30, 90, 180, 360, 1800]);
  });
});

