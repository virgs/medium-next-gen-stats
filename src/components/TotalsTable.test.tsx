import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { TotalsTable } from './TotalsTable';
import { TotalsValues } from '../types';

describe('TotalsTable', () => {
  const values: TotalsValues = {
    totals: 10,
    views: 5000,
    reads: 2500,
    claps: 300,
    fans: 100,
  };

  it('renders all column headers', () => {
    render(<TotalsTable values={values} />);
    expect(screen.getByText('Totals')).toBeInTheDocument();
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Reads')).toBeInTheDocument();
    expect(screen.getByText('Read ratio')).toBeInTheDocument();
    expect(screen.getByText('Claps')).toBeInTheDocument();
    expect(screen.getByText('Fans')).toBeInTheDocument();
  });

  it('displays formatted totals count', () => {
    render(<TotalsTable values={values} />);
    expect(screen.getByText('10 articles')).toBeInTheDocument();
  });

  it('displays formatted values with commas', () => {
    render(<TotalsTable values={values} />);
    expect(screen.getByText('5,000')).toBeInTheDocument();
    expect(screen.getByText('2,500')).toBeInTheDocument();
    expect(screen.getByText('300')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
  });

  it('displays read ratio percentage', () => {
    render(<TotalsTable values={values} />);
    expect(screen.getByText('50.0%')).toBeInTheDocument();
  });

  it('handles zero values', () => {
    const zeroValues: TotalsValues = {
      totals: 0,
      views: 0,
      reads: 0,
      claps: 0,
      fans: 0,
    };
    render(<TotalsTable values={zeroValues} />);
    expect(screen.getByText('0 articles')).toBeInTheDocument();
  });
});

