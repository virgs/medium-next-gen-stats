import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RangeNavbar } from './RangeNavbar';

describe('RangeNavbar', () => {
  it('renders all range options', () => {
    render(
      <RangeNavbar currentRangeIndex={0} onRangeChange={vi.fn()} />
    );
    expect(screen.getByText('Daily')).toBeInTheDocument();
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('Monthly')).toBeInTheDocument();
  });

  it('calls onRangeChange when a range is clicked', () => {
    const onRangeChange = vi.fn();
    render(
      <RangeNavbar currentRangeIndex={0} onRangeChange={onRangeChange} />
    );
    fireEvent.click(screen.getByText('Weekly'));
    expect(onRangeChange).toHaveBeenCalledWith(1);
  });
});

