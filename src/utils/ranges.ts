import { RangeInterval, RangeOption } from '../types';
import { ONE_DAY_IN_MS } from './formatters';

const getTimezoneOffsetMs = (): number =>
  new Date().getTimezoneOffset() * 60 * 1000;

export const getStringifiedDate = (value: Date): string => {
  const date = new Date(value.getTime() + getTimezoneOffsetMs());
  const day = (date.getUTCDate() + '').padStart(2, '0');
  const monthShort = date
    .toLocaleString('default', { month: 'long' })
    .substring(0, 3);
  const month =
    monthShort.substring(0, 1).toUpperCase() + monthShort.substring(1);
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
};

export const getStringifiedMonth = (monthIterator: Date): string => {
  const monthName = monthIterator.toLocaleString('default', { month: 'long' });
  return (
    monthName.substring(0, 1).toUpperCase() +
    monthName.substring(1) +
    '/' +
    monthIterator.getFullYear()
  );
};

export const getStringifiedWeekDifference = (
  initial: Date,
  end: Date
): string => {
  const differentYears = initial.getFullYear() !== end.getFullYear();
  const differentMonth = initial.getUTCMonth() !== end.getUTCMonth();

  let initialString = (initial.getUTCDate() + '').padStart(2, '0');
  const initialMonth = initial
    .toLocaleString('default', { month: 'long' })
    .substring(0, 3);

  if (differentYears) {
    initialString = getStringifiedDate(initial);
  } else if (differentMonth) {
    initialString = `${initialString}/${initialMonth}`;
  }
  return `${initialString} to ${getStringifiedDate(end)}`;
};

export const getRangeInDays = (
  beginDate: Date,
  endDate: Date
): RangeInterval[] => {
  const differenceInDays = Math.ceil(
    (endDate.getTime() - beginDate.getTime()) / ONE_DAY_IN_MS
  );
  let dayIterator = beginDate;
  return Array.from(Array(differenceInDays)).reduce(
    (acc: RangeInterval[]) => {
      const nextInterval = new Date(dayIterator.getTime() + ONE_DAY_IN_MS);
      const interval: RangeInterval = {
        begin: dayIterator,
        end: nextInterval,
        label: getStringifiedDate(dayIterator),
      };
      dayIterator = nextInterval;
      return [...acc, interval];
    },
    []
  );
};

export const getRangeInWeeks = (
  beginDate: Date,
  endDate: Date
): RangeInterval[] => {
  const oneWeekInMs = ONE_DAY_IN_MS * 7;
  const differenceInWeeks =
    Math.abs(
      Math.round((endDate.getTime() - beginDate.getTime()) / oneWeekInMs)
    ) + 1;
  let weekIterator = beginDate;
  return Array.from(Array(differenceInWeeks)).reduce(
    (acc: RangeInterval[]) => {
      const nextWeek = new Date(weekIterator.getTime() + oneWeekInMs);
      const interval: RangeInterval = {
        begin: weekIterator,
        end: nextWeek,
        label: getStringifiedWeekDifference(
          weekIterator,
          new Date(nextWeek.getTime() - ONE_DAY_IN_MS)
        ),
      };
      weekIterator = nextWeek;
      return [...acc, interval];
    },
    []
  );
};

export const getRangeInMonths = (
  beginDate: Date,
  endDate: Date
): RangeInterval[] => {
  const differenceInMonths =
    endDate.getUTCMonth() -
    beginDate.getUTCMonth() +
    12 * (endDate.getUTCFullYear() - beginDate.getUTCFullYear()) +
    1;
  let monthIterator = beginDate;
  return Array.from(Array(differenceInMonths)).reduce(
    (acc: RangeInterval[]) => {
      const nextInterval = new Date(
        monthIterator.getUTCFullYear(),
        monthIterator.getUTCMonth() + 1
      );
      const interval: RangeInterval = {
        begin: monthIterator,
        end: nextInterval,
        label: getStringifiedMonth(monthIterator),
      };
      monthIterator = nextInterval;
      return [...acc, interval];
    },
    []
  );
};

export const ranges: RangeOption[] = [
  { rangeMethod: getRangeInDays, label: 'Daily' },
  { rangeMethod: getRangeInWeeks, label: 'Weekly' },
  { rangeMethod: getRangeInMonths, label: 'Monthly' },
];

export const timeRanges: number[] = [30, 90, 180, 360, 1800];

