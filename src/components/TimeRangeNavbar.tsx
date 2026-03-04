import React from 'react';
import Nav from 'react-bootstrap/Nav';
import Button from 'react-bootstrap/Button';
import { timeRanges } from '../utils/ranges';

interface TimeRangeNavbarProps {
  currentTimeRangeIndex: number;
  currentMonthActive: boolean;
  onTimeRangeChange: (index: number) => void;
  onCurrentMonthClick: () => void;
}

export const TimeRangeNavbar: React.FC<TimeRangeNavbarProps> = ({
  currentTimeRangeIndex,
  currentMonthActive,
  onTimeRangeChange,
  onCurrentMonthClick,
}) => {
  return (
    <div className="mngs-time-range-navbar d-flex align-items-center">
      <Nav
        variant="pills"
        activeKey={
          currentMonthActive ? 'current-month' : currentTimeRangeIndex.toString()
        }
        className="flex-grow-1"
      >
        {timeRanges.map((range, index) => (
          <Nav.Item key={range}>
            <Nav.Link
              eventKey={index.toString()}
              onClick={() => onTimeRangeChange(index)}
            >
              {range} days
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <Button
        variant="link"
        className={`mngs-current-month-btn ${currentMonthActive ? 'active' : ''}`}
        onClick={onCurrentMonthClick}
      >
        Current month
      </Button>
    </div>
  );
};

