import { describe, it, expect } from 'vitest';
import {
  isEarningsFeatureEnabled,
  isHighlightPostFeatureEnabled,
} from './featureFlags';

describe('featureFlags', () => {
  it('isEarningsFeatureEnabled returns true', () => {
    expect(isEarningsFeatureEnabled()).toBe(true);
  });

  it('isHighlightPostFeatureEnabled returns true', () => {
    expect(isHighlightPostFeatureEnabled()).toBe(true);
  });
});

