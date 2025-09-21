/* eslint-disable react/prop-types */
import { memo, useState, useEffect } from 'react';
import { AmountBar, AmountPie, RecordTable } from './ChartComponents';
import { CHART_DIMENSIONS } from '../../constants/parserConstants';

// Black spinner component for loading states
const BlackSpinner = memo(() => (
  <div className="black-spinner-container">
    <div className="black-spinner"></div>
  </div>
));
BlackSpinner.displayName = 'BlackSpinner';

// Memoized chart container that only re-renders when chart data changes
const ChartContainer = memo(({
  title,
  description,
  children,
  loading,
  height = CHART_DIMENSIONS.defaultHeight,
  className = ''
}) => (
  <div className={`breakdown-card ${className}`}>
    <div className="breakdown-card-header">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    <div className="breakdown-card-body" style={{ height: `${height}px` }}>
      {loading ? <BlackSpinner /> : children}
    </div>
  </div>
));
ChartContainer.displayName = 'ChartContainer';

// Weekly buckets chart with optimized caching
export const WeeklyBucketsChart = memo(({ lineData, loading }) => {
  const [chartLoading, setChartLoading] = useState(loading);

  useEffect(() => {
    if (!loading && lineData) {
      // Simulate chart processing time for smooth UX
      const timer = setTimeout(() => setChartLoading(false), 200);
      return () => clearTimeout(timer);
    } else {
      setChartLoading(loading);
    }
  }, [loading, lineData]);

  return (
    <ChartContainer
      title="Weekly Buckets"
      description="See which weeks you were good and which ones you were not so good"
      loading={chartLoading}
      height={CHART_DIMENSIONS.defaultHeight}
      className="weekly-buckets-container"
    >
      <AmountBar lineData={lineData} />
    </ChartContainer>
  );
});
WeeklyBucketsChart.displayName = 'WeeklyBucketsChart';

// Distribution chart with optimized caching
export const DistributionChart = memo(({ pieData, totalAmount, loading }) => {
  const [chartLoading, setChartLoading] = useState(loading);

  useEffect(() => {
    if (!loading && pieData && totalAmount) {
      const timer = setTimeout(() => setChartLoading(false), 300);
      return () => clearTimeout(timer);
    } else {
      setChartLoading(loading);
    }
  }, [loading, pieData, totalAmount]);

  return (
    <ChartContainer
      title="Distribution & Metrics"
      description="For those who like pie"
      loading={chartLoading}
      height={CHART_DIMENSIONS.defaultHeight}
      className="distribution-container"
    >
      <AmountPie pieData={pieData} />
    </ChartContainer>
  );
});
DistributionChart.displayName = 'DistributionChart';

// Records table with optimized caching
export const RecordsTable = memo(({ sortedRecords, requestSort, loading }) => {
  const [tableLoading, setTableLoading] = useState(loading);

  useEffect(() => {
    if (!loading && sortedRecords) {
      const timer = setTimeout(() => setTableLoading(false), 100);
      return () => clearTimeout(timer);
    } else {
      setTableLoading(loading);
    }
  }, [loading, sortedRecords]);

  return (
    <ChartContainer
      title="Parsed Records"
      description="Everyone likes a good scrollable sorting table"
      loading={tableLoading}
      height="auto"
      className="records-table-container"
    >
      <RecordTable sortedRecords={sortedRecords} requestSort={requestSort} />
    </ChartContainer>
  );
});
RecordsTable.displayName = 'RecordsTable';