import React from 'react';
import Nav from 'react-bootstrap/Nav';
import { ranges } from '../utils/ranges';

interface RangeNavbarProps {
  currentRangeIndex: number;
  onRangeChange: (index: number) => void;
}

export const RangeNavbar: React.FC<RangeNavbarProps> = ({
  currentRangeIndex,
  onRangeChange,
}) => {
  return (
    <Nav
      variant="pills"
      activeKey={currentRangeIndex.toString()}
      onSelect={(k) => k !== null && onRangeChange(Number(k))}
      className="mngs-range-navbar"
    >
      {ranges.map((range, index) => (
        <Nav.Item key={range.label}>
          <Nav.Link eventKey={index.toString()}>{range.label}</Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
};

