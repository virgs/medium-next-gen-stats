import React from 'react';
import Button from 'react-bootstrap/Button';
import { timeRanges } from '../utils/ranges';

interface ChartPaginatorProps {
  currentTimeRangeIndex: number;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const ChartPaginator: React.FC<ChartPaginatorProps> = ({
  currentTimeRangeIndex,
  nextDisabled,
  onPrev,
  onNext,
}) => {
  const days = timeRanges[currentTimeRangeIndex];

  return (
    <div className="mngs-chart-paginator d-flex align-items-center justify-content-center gap-2 my-2">
      <Button variant="outline-secondary" size="sm" onClick={onPrev}>
        ◀ Prev {days} days
      </Button>
      <span className="mngs-paginator-divider">|</span>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={onNext}
        disabled={nextDisabled}
      >
        Next {days} days ▶
      </Button>
    </div>
  );
};

