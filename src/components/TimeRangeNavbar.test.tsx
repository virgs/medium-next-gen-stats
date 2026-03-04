import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TimeRangeNavbar } from './TimeRangeNavbar';

describe('TimeRangeNavbar', () => {
  it('renders all time range options', () => {
    render(
      <TimeRangeNavbar
        currentTimeRangeIndex={0}
        currentMonthActive={false}
        onTimeRangeChange={vi.fn()}
        onCurrentMonthClick={vi.fn()}
      />
    );
    expect(screen.getByText('30 days')).toBeInTheDocument();
    expect(screen.getByText('90 days')).toBeInTheDocument();
    expect(screen.getByText('180 days')).toBeInTheDocument();
    expect(screen.getByText('360 days')).toBeInTheDocument();
    expect(screen.getByText('1800 days')).toBeInTheDocument();
  });

  it('renders current month button', () => {
    render(
      <TimeRangeNavbar
        currentTimeRangeIndex={0}
        currentMonthActive={false}
        onTimeRangeChange={vi.fn()}
        onCurrentMonthClick={vi.fn()}
      />
    );
    expect(screen.getByText('Current month')).toBeInTheDocument();
  });

  it('calls onCurrentMonthClick when current month button is clicked', () => {
    const onCurrentMonthClick = vi.fn();
    render(
      <TimeRangeNavbar
        currentTimeRangeIndex={0}
        currentMonthActive={false}
        onTimeRangeChange={vi.fn()}
        onCurrentMonthClick={onCurrentMonthClick}
      />
    );
    fireEvent.click(screen.getByText('Current month'));
    expect(onCurrentMonthClick).toHaveBeenCalledTimes(1);
  });

  it('calls onTimeRangeChange when a time range is clicked', () => {
    const onTimeRangeChange = vi.fn();
    render(
      <TimeRangeNavbar
        currentTimeRangeIndex={0}
        currentMonthActive={false}
        onTimeRangeChange={onTimeRangeChange}
        onCurrentMonthClick={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('90 days'));
    expect(onTimeRangeChange).toHaveBeenCalledWith(1);
  });
});

