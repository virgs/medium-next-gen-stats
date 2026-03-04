import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ChartPaginator } from './ChartPaginator';

describe('ChartPaginator', () => {
  it('renders prev and next buttons with correct day labels', () => {
    render(
      <ChartPaginator
        currentTimeRangeIndex={0}
        nextDisabled={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText(/Prev 30 days/)).toBeInTheDocument();
    expect(screen.getByText(/Next 30 days/)).toBeInTheDocument();
  });

  it('uses correct days for different time range indices', () => {
    render(
      <ChartPaginator
        currentTimeRangeIndex={1}
        nextDisabled={false}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    );
    expect(screen.getByText(/Prev 90 days/)).toBeInTheDocument();
    expect(screen.getByText(/Next 90 days/)).toBeInTheDocument();
  });

  it('calls onPrev when prev button is clicked', () => {
    const onPrev = vi.fn();
    render(
      <ChartPaginator
        currentTimeRangeIndex={0}
        nextDisabled={false}
        onPrev={onPrev}
        onNext={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText(/Prev 30 days/));
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('calls onNext when next button is clicked', () => {
    const onNext = vi.fn();
    render(
      <ChartPaginator
        currentTimeRangeIndex={0}
        nextDisabled={false}
        onPrev={vi.fn()}
        onNext={onNext}
      />
    );
    fireEvent.click(screen.getByText(/Next 30 days/));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('disables next button when nextDisabled is true', () => {
    render(
      <ChartPaginator
        currentTimeRangeIndex={0}
        nextDisabled={true}
        onPrev={vi.fn()}
        onNext={vi.fn()}
      />
    );
    const nextButton = screen.getByText(/Next 30 days/).closest('button');
    expect(nextButton).toBeDisabled();
  });
});

