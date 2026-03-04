import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ActionIcons } from './ActionIcons';

describe('ActionIcons', () => {
  it('renders chart type icons', () => {
    render(
      <ActionIcons
        chartType="bar"
        downloadEnabled={true}
        label="views"
        onChartTypeChange={vi.fn()}
        onDownload={vi.fn()}
      />
    );
    const barIcon = document.querySelector('.mngs-chart-type-icon-active');
    expect(barIcon).toBeInTheDocument();
  });

  it('calls onChartTypeChange with pie when pie icon is clicked', () => {
    const onChartTypeChange = vi.fn();
    const { container } = render(
      <ActionIcons
        chartType="bar"
        downloadEnabled={true}
        label="views"
        onChartTypeChange={onChartTypeChange}
        onDownload={vi.fn()}
      />
    );
    const pieWrapper = container.querySelectorAll('.mngs-tooltip-wrapper');
    const pieIcon = pieWrapper[pieWrapper.length - 1];
    fireEvent.click(pieIcon);
    expect(onChartTypeChange).toHaveBeenCalledWith('pie');
  });

  it('calls onDownload when download icon is clicked and enabled', () => {
    const onDownload = vi.fn();
    const { container } = render(
      <ActionIcons
        chartType="bar"
        downloadEnabled={true}
        label="views"
        onChartTypeChange={vi.fn()}
        onDownload={onDownload}
      />
    );
    const wrappers = container.querySelectorAll('.mngs-tooltip-wrapper');
    fireEvent.click(wrappers[1]);
    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('hides download icon when not enabled', () => {
    const { container } = render(
      <ActionIcons
        chartType="bar"
        downloadEnabled={false}
        label="views"
        onChartTypeChange={vi.fn()}
        onDownload={vi.fn()}
      />
    );
    const wrappers = container.querySelectorAll('.mngs-tooltip-wrapper');
    const downloadWrapper = wrappers[1];
    expect(downloadWrapper).toHaveStyle({ visibility: 'hidden' });
  });

  it('renders donate link', () => {
    render(
      <ActionIcons
        chartType="bar"
        downloadEnabled={true}
        label="views"
        onChartTypeChange={vi.fn()}
        onDownload={vi.fn()}
      />
    );
    const donateLink = screen.getByRole('link');
    expect(donateLink).toHaveAttribute('href', expect.stringContaining('paypal.com'));
  });
});

