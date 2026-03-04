import { Color, PostData } from '../types';

export const ONE_DAY_IN_MS = 24 * 3600 * 1000;

export const ORIGINAL_COLOR: Color = { r: 82, g: 186, b: 151 };
export const HIGHLIGHT_COLOR: Color = { r: 173, g: 49, b: 104 };

export const HIGHLIGHTED_ALPHA = 0.35;
export const NOT_HIGHLIGHTED_ALPHA = 0.75;

export const getNumber = (value: unknown): number => {
  if (
    value === undefined ||
    value === null ||
    typeof value !== 'number' ||
    isNaN(value)
  ) {
    return 0;
  }
  return value;
};

export const getShadeOfColor = (
  max: number,
  index: number,
  color: Color = ORIGINAL_COLOR
): Color => ({
  r: (color.r / max) * (index + 1),
  g: (color.g / max) * (index + 1),
  b: (color.b / max) * (index + 1),
});

export const prettifyNumbersWithUnits = (number: number): string => {
  const units = ['', 'K', 'M', 'G', 'T', 'P', 'E'];
  const tier = (Math.log10(number) / 3) | 0;
  if (tier === 0) {
    return number.toString();
  }
  const suffix = units[tier];
  const scale = Math.pow(10, tier * 3);
  const scaled = number / scale;
  return scaled.toFixed(1) + suffix;
};

export const prettifyNumbersWithCommas = (number: number): string => {
  return number
    .toString()
    .split('')
    .reverse()
    .reduce((acc: string[], letter, index, vec) => {
      acc.push(
        (index % 3 === 2 && index !== vec.length - 1 ? ',' : '') + letter
      );
      return acc;
    }, [])
    .reverse()
    .join('');
};

export const convertToCsv = (items: Record<string, unknown>[]): string => {
  const replacer = (_key: string, value: unknown): unknown =>
    value === null ? '' : value;
  const header = Object.keys(
    items.reduce((acc, item) => ({ ...acc, ...item }), {})
  );
  const csv = items.map((row) =>
    header
      .map((fieldName) => JSON.stringify(row[fieldName], replacer))
      .join(',')
  );
  csv.unshift(header.join(','));
  return csv.join('\r\n');
};

export const getViewOfData = (data: PostData): number => getNumber(data.views);
export const getReadsOfData = (data: PostData): number =>
  getNumber(data.reads);
export const getClapsOfData = (data: PostData): number =>
  getNumber(data.claps);
export const getFollowersOfData = (data: PostData): number =>
  getNumber(data.followers);
export const getUpvotesOfData = (data: PostData): number =>
  getNumber(data.upvotes);
export const getEarningsOfData = (data: PostData): number =>
  getNumber(data.earnings);

export const getRatio = (
  denominator: number,
  numerator: number
): string => {
  if (!denominator) {
    return '0';
  }
  return ((100 * numerator) / denominator).toFixed(1);
};

export const downloadContent = (
  stringifiedContent: string,
  filename: string
): void => {
  const element = document.createElement('a');
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(stringifiedContent)
  );
  element.setAttribute('download', filename);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

