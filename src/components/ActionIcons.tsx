import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFileDownload,
  faDonate,
} from '@fortawesome/free-solid-svg-icons';
import {
  faChartBar,
} from '@fortawesome/free-regular-svg-icons';
import { faChartPie } from '@fortawesome/free-solid-svg-icons';
import { ChartType } from '../types';

interface ActionIconsProps {
  chartType: ChartType;
  downloadEnabled: boolean;
  label: string;
  onChartTypeChange: (type: ChartType) => void;
  onDownload: () => void;
}

export const ActionIcons: React.FC<ActionIconsProps> = ({
  chartType,
  downloadEnabled,
  label,
  onChartTypeChange,
  onDownload,
}) => {
  return (
    <div className="mngs-action-icons d-flex align-items-center position-relative">
      <span className="mngs-tooltip-wrapper" title="Donate to help it keep running and improving">
        <a
          href="https://www.paypal.com/donate/?hosted_button_id=9C66XCH4VAX6U"
          target="_blank"
          rel="noopener noreferrer"
        >
          <FontAwesomeIcon icon={faDonate} className="mngs-donate-icon" />
        </a>
      </span>
      <span
        className="mngs-tooltip-wrapper"
        title="Export data"
        onClick={downloadEnabled ? onDownload : undefined}
        style={{
          pointerEvents: downloadEnabled ? 'auto' : 'none',
          visibility: downloadEnabled ? 'visible' : 'hidden',
        }}
      >
        <FontAwesomeIcon icon={faFileDownload} className="mngs-action-icon" />
      </span>
      <div className="ms-auto d-flex">
        <span
          className="mngs-tooltip-wrapper"
          title={`Compare aggregated articles ${label.toLowerCase()} by time`}
          onClick={() => onChartTypeChange('bar')}
        >
          <FontAwesomeIcon
            icon={faChartBar}
            className={`mngs-chart-type-icon ${chartType === 'bar' ? 'mngs-chart-type-icon-active' : ''}`}
          />
        </span>
        <span
          className="mngs-tooltip-wrapper"
          title={`Compare articles ${label.toLowerCase()} with each other`}
          onClick={() => onChartTypeChange('pie')}
        >
          <FontAwesomeIcon
            icon={faChartPie}
            className={`mngs-chart-type-icon ${chartType === 'pie' ? 'mngs-chart-type-icon-active' : ''}`}
          />
        </span>
      </div>
    </div>
  );
};

