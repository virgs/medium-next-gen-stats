import React from 'react';
import Nav from 'react-bootstrap/Nav';
import { SummaryData } from '../types';
import { prettifyNumbersWithCommas } from '../utils/formatters';
import { isEarningsFeatureEnabled } from '../services/featureFlags';

interface SummaryTabsProps {
  summary: SummaryData;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const formatEarnings = (earnings: number): string => {
  const safe = isNaN(earnings) ? 0 : earnings;
  const intPart = Math.trunc(safe);
  const fractionPart = (safe - intPart).toFixed(2).substring(1);
  return `${prettifyNumbersWithCommas(intPart)}${fractionPart} $`;
};

const tabs = [
  { key: 'views', label: 'Views', getter: (s: SummaryData) => prettifyNumbersWithCommas(s.views) },
  { key: 'reads', label: 'Reads', getter: (s: SummaryData) => prettifyNumbersWithCommas(s.reads) },
  { key: 'claps', label: 'Claps', getter: (s: SummaryData) => prettifyNumbersWithCommas(s.claps) },
  { key: 'fans', label: 'Fans', getter: (s: SummaryData) => prettifyNumbersWithCommas(s.upvotes) },
  { key: 'followers', label: 'Followers', getter: (s: SummaryData) => prettifyNumbersWithCommas(s.followers) },
  { key: 'earnings', label: 'Earnings', getter: (s: SummaryData) => formatEarnings(s.earnings) },
];

export const SummaryTabs: React.FC<SummaryTabsProps> = ({
  summary,
  activeTab,
  onTabChange,
}) => {
  const earningsEnabled = isEarningsFeatureEnabled();

  return (
    <Nav variant="tabs" activeKey={activeTab} onSelect={(k) => k && onTabChange(k)} className="mngs-summary-tabs">
      {tabs.map((tab) => {
        const disabled = tab.key === 'earnings' && !earningsEnabled;
        return (
          <Nav.Item key={tab.key} className="mngs-summary-tab-item">
            <Nav.Link
              eventKey={tab.key}
              disabled={disabled}
              className={disabled ? 'mngs-disabled-tab' : ''}
            >
              <div className="mngs-tab-value">{tab.getter(summary)}</div>
              <div className="mngs-tab-label">{tab.label}</div>
            </Nav.Link>
          </Nav.Item>
        );
      })}
    </Nav>
  );
};

