import { describe, it, expect } from 'vitest';
import {
  getNumber,
  getShadeOfColor,
  prettifyNumbersWithUnits,
  prettifyNumbersWithCommas,
  convertToCsv,
  getRatio,
  getViewOfData,
  getReadsOfData,
  getClapsOfData,
  getFollowersOfData,
  getUpvotesOfData,
  getEarningsOfData,
  ONE_DAY_IN_MS,
  ORIGINAL_COLOR,
  HIGHLIGHT_COLOR,
} from './formatters';
import { PostData } from '../types';

describe('getNumber', () => {
  it('returns 0 for undefined', () => {
    expect(getNumber(undefined)).toBe(0);
  });

  it('returns 0 for null', () => {
    expect(getNumber(null)).toBe(0);
  });

  it('returns 0 for NaN', () => {
    expect(getNumber(NaN)).toBe(0);
  });

  it('returns 0 for non-number types', () => {
    expect(getNumber('hello')).toBe(0);
  });

  it('returns the number itself for valid numbers', () => {
    expect(getNumber(42)).toBe(42);
  });

  it('returns 0 for zero', () => {
    expect(getNumber(0)).toBe(0);
  });

  it('returns negative numbers', () => {
    expect(getNumber(-5)).toBe(-5);
  });
});

describe('getShadeOfColor', () => {
  it('returns the full color when index is max - 1', () => {
    const result = getShadeOfColor(3, 2);
    expect(result.r).toBeCloseTo(ORIGINAL_COLOR.r);
    expect(result.g).toBeCloseTo(ORIGINAL_COLOR.g);
    expect(result.b).toBeCloseTo(ORIGINAL_COLOR.b);
  });

  it('returns a lighter shade for smaller index', () => {
    const result = getShadeOfColor(3, 0);
    expect(result.r).toBeLessThan(ORIGINAL_COLOR.r);
    expect(result.g).toBeLessThan(ORIGINAL_COLOR.g);
    expect(result.b).toBeLessThan(ORIGINAL_COLOR.b);
  });

  it('uses custom color when provided', () => {
    const result = getShadeOfColor(1, 0, HIGHLIGHT_COLOR);
    expect(result.r).toBeCloseTo(HIGHLIGHT_COLOR.r);
    expect(result.g).toBeCloseTo(HIGHLIGHT_COLOR.g);
    expect(result.b).toBeCloseTo(HIGHLIGHT_COLOR.b);
  });
});

describe('prettifyNumbersWithUnits', () => {
  it('returns the number as string for values < 1000', () => {
    expect(prettifyNumbersWithUnits(500)).toBe('500');
  });

  it('formats thousands with K suffix', () => {
    expect(prettifyNumbersWithUnits(1500)).toBe('1.5K');
  });

  it('formats millions with M suffix', () => {
    expect(prettifyNumbersWithUnits(2500000)).toBe('2.5M');
  });

  it('handles exact tier boundaries', () => {
    expect(prettifyNumbersWithUnits(1000)).toBe('1.0K');
  });
});

describe('prettifyNumbersWithCommas', () => {
  it('returns small numbers unchanged', () => {
    expect(prettifyNumbersWithCommas(42)).toBe('42');
  });

  it('adds commas for thousands', () => {
    expect(prettifyNumbersWithCommas(1234)).toBe('1,234');
  });

  it('adds commas for millions', () => {
    expect(prettifyNumbersWithCommas(1234567)).toBe('1,234,567');
  });

  it('handles zero', () => {
    expect(prettifyNumbersWithCommas(0)).toBe('0');
  });
});

describe('convertToCsv', () => {
  it('converts an array of objects to CSV format', () => {
    const items = [
      { name: 'Alice', age: 30 },
      { name: 'Bob', age: 25 },
    ];
    const csv = convertToCsv(items);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('name,age');
    expect(lines[1]).toBe('"Alice",30');
    expect(lines[2]).toBe('"Bob",25');
  });

  it('handles null values as empty strings', () => {
    const items = [{ name: null, age: 30 }];
    const csv = convertToCsv(items as unknown as Record<string, unknown>[]);
    const lines = csv.split('\r\n');
    expect(lines[1]).toBe('"",30');
  });

  it('handles items with different keys', () => {
    const items = [
      { a: 1 },
      { b: 2 },
    ];
    const csv = convertToCsv(items);
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe('a,b');
  });
});

describe('getRatio', () => {
  it('returns 0 when denominator is 0', () => {
    expect(getRatio(0, 100)).toBe('0');
  });

  it('calculates ratio correctly', () => {
    expect(getRatio(200, 100)).toBe('50.0');
  });

  it('returns 100.0 for equal values', () => {
    expect(getRatio(100, 100)).toBe('100.0');
  });
});

describe('datum extractors', () => {
  const mockPost: PostData = {
    id: '1',
    collectedAt: Date.now(),
    views: 100,
    reads: 50,
    claps: 25,
    upvotes: 10,
    followers: 5,
    earnings: 2.5,
  };

  it('getViewOfData extracts views', () => {
    expect(getViewOfData(mockPost)).toBe(100);
  });

  it('getReadsOfData extracts reads', () => {
    expect(getReadsOfData(mockPost)).toBe(50);
  });

  it('getClapsOfData extracts claps', () => {
    expect(getClapsOfData(mockPost)).toBe(25);
  });

  it('getUpvotesOfData extracts upvotes', () => {
    expect(getUpvotesOfData(mockPost)).toBe(10);
  });

  it('getFollowersOfData extracts followers', () => {
    expect(getFollowersOfData(mockPost)).toBe(5);
  });

  it('getEarningsOfData extracts earnings', () => {
    expect(getEarningsOfData(mockPost)).toBe(2.5);
  });

  it('returns 0 for missing fields', () => {
    const partial: PostData = { id: '2', collectedAt: Date.now() };
    expect(getViewOfData(partial)).toBe(0);
    expect(getReadsOfData(partial)).toBe(0);
    expect(getClapsOfData(partial)).toBe(0);
  });
});

describe('constants', () => {
  it('ONE_DAY_IN_MS equals 86400000', () => {
    expect(ONE_DAY_IN_MS).toBe(86400000);
  });
});

