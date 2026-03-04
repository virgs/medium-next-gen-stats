import React from 'react';
import Table from 'react-bootstrap/Table';
import { TotalsValues } from '../types';
import { prettifyNumbersWithCommas, getRatio } from '../utils/formatters';

interface TotalsTableProps {
  values: TotalsValues;
}

export const TotalsTable: React.FC<TotalsTableProps> = ({ values }) => {
  return (
    <div className="mngs-totals-table-wrapper my-3">
      <Table bordered hover size="sm" className="mngs-totals-table">
        <thead>
          <tr>
            <th>Totals</th>
            <th>Views</th>
            <th>Reads</th>
            <th>Read ratio</th>
            <th>Claps</th>
            <th>Fans</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{prettifyNumbersWithCommas(values.totals)} articles</td>
            <td>{prettifyNumbersWithCommas(values.views)}</td>
            <td>{prettifyNumbersWithCommas(values.reads)}</td>
            <td>{getRatio(values.views, values.reads)}%</td>
            <td>{prettifyNumbersWithCommas(values.claps)}</td>
            <td>{prettifyNumbersWithCommas(values.fans)}</td>
          </tr>
        </tbody>
      </Table>
    </div>
  );
};

