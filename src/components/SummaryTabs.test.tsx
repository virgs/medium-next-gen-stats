import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SummaryTabs } from './SummaryTabs';
import { SummaryData } from '../types';

const mockSummary: SummaryData = {
  views: 1500,
  reads: 800,
  claps: 200,
  upvotes: 50,
  followers: 30,
  earnings: 12.5,
};

describe('SummaryTabs', () => {
  it('renders all tab labels', () => {
    render(
      <SummaryTabs summary={mockSummary} activeTab="views" onTabChange={vi.fn()} />
    );
    expect(screen.getByText('Views')).toBeInTheDocument();
    expect(screen.getByText('Reads')).toBeInTheDocument();
    expect(screen.getByText('Claps')).toBeInTheDocument();
    expect(screen.getByText('Fans')).toBeInTheDocument();
    expect(screen.getByText('Followers')).toBeInTheDocument();
    expect(screen.getByText('Earnings')).toBeInTheDocument();
  });

  it('displays formatted values', () => {
    render(
      <SummaryTabs summary={mockSummary} activeTab="views" onTabChange={vi.fn()} />
    );
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is clicked', () => {
    const onTabChange = vi.fn();
    render(
      <SummaryTabs summary={mockSummary} activeTab="views" onTabChange={onTabChange} />
    );
    fireEvent.click(screen.getByText('Reads'));
    expect(onTabChange).toHaveBeenCalledWith('reads');
  });
});

