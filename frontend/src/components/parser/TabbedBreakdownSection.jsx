/* eslint-disable react/prop-types */
import { memo, useState, useCallback } from 'react';
import FilterSection from './FilterSection';
import { DistributionChart, RecordsTable } from './ChartContainers';
import TimeSeriesAccumulatedChart from './TimeSeriesAccumulatedChart';
import { CHART_DIMENSIONS } from '../../constants/parserConstants';
import record_icon from '../../assets/docs.svg';
import pie_icon from '../../assets/pie.svg';
import bar_icon from '../../assets/bar.svg';
import insight_icon from '../../assets/insight.svg';

// Tab configuration
const TABS = {
  INSIGHT: {
    id: 'insight',
    label: 'Insight',
    icon: insight_icon
  },
  TIME_SERIES: {
    id: 'timeseries',
    label: 'Time Series',
    icon: bar_icon
  },
  DISTRIBUTION: {
    id: 'distribution',
    label: 'Distribution',
    icon: pie_icon
  },
  RECORDS: {
    id: 'records',
    label: 'Records',
    icon: record_icon
  }
};

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
    <div className="breakdown-card-body" style={{ height: height === 'auto' ? 'auto' : `${height}px` }}>
      {loading ? <BlackSpinner /> : children}
    </div>
  </div>
));
ChartContainer.displayName = 'ChartContainer';

// Tab navigation component
const TabNavigation = memo(({ activeTab, onTabChange, tabs }) => (
  <div className="tab-navigation">
    <div className="tab-list">
      {Object.values(tabs).map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          <img src={tab.icon} alt={`${tab.label} icon`} className="tab-icon" />
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  </div>
));
TabNavigation.displayName = 'TabNavigation';

// Overview tab content
const OverviewTab = memo(({ totalAmount, sortedRecords }) => {
  // Get top 5 largest purchases from filtered records (negative amounts are purchases)
  const largestPurchases = sortedRecords?.filter(record => record.amount > 0)
    .sort((a, b) => b.amount - a.amount) // Sort by amount descending (largest first)
    .slice(0, 5) || [];

  return (
    <div className="tab-content overview-tab">
      <div className="overview-grid">
        {/* Quick metrics card with financial summary */}
        <div className="overview-metrics-card">
          <div className="breakdown-card-header">
            <h3>Financial Summary</h3>
            <p>Complete financial overview and key metrics</p>
          </div>
          <div className="metrics-grid">
            {totalAmount && (
              <>
                <div className="metric-item large">
                  <span className="metric-label">Total Purchases</span>
                  <span className="metric-value primary">{totalAmount.totalPurchases || '$0.00'}</span>
                </div>
                <div className="metric-item large">
                  <span className="metric-label">Total Payments</span>
                  <span className="metric-value positive">{totalAmount.totalPayments || '$0.00'}</span>
                </div>
                <div className="metric-item large">
                  <span className="metric-label">Net Spending</span>
                  <span className={`metric-value ${totalAmount.netSpending?.includes('-') ? 'positive' : 'negative'}`}>
                    {totalAmount.netSpending || '$0.00'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Purchase</span>
                  <span className="metric-value">{totalAmount.avgPurchase || '$0.00'}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Purchase Count</span>
                  <span className="metric-value">{totalAmount.purchaseCount || 0}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Total Transactions</span>
                  <span className="metric-value">{totalAmount.transactionCount || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top 5 largest purchases */}
        <div className="overview-recent-card">
          <div className="breakdown-card-header">
            <h3>Largest Purchases</h3>
            <p>Top 5 largest purchases from current filtered data</p>
          </div>
          <div className="recent-transactions">
            {largestPurchases.map((record) => (
              <div key={record.id} className="recent-transaction-item">
                <div className="transaction-info">
                  <span className="transaction-date">{record.date}</span>
                  <span className="transaction-desc" title={record.description}>
                    {record.description.length > 30
                      ? `${record.description.substring(0, 30)}...`
                      : record.description
                    }
                  </span>
                </div>
                <span className="transaction-amount negative">
                  {record.amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00'}
                </span>
              </div>
            ))}
            {largestPurchases.length === 0 && (
              <div className="no-transactions">
                <p>No purchases to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
OverviewTab.displayName = 'OverviewTab';

// Time Series tab content
const TimeSeriesTab = memo(({ lineData, loadingStates }) => (
  <div className="tab-content timeseries-tab">
    <ChartContainer
      title="Purchase Timeline"
      description="Chronological view of purchases with accumulated totals - dates with more activity stand out visually"
      loading={loadingStates?.charts || false}
      height={CHART_DIMENSIONS.defaultHeight}
      className="timeseries-container"
    >
      <TimeSeriesAccumulatedChart lineData={lineData} />
    </ChartContainer>
  </div>
));
TimeSeriesTab.displayName = 'TimeSeriesTab';

// Distribution tab content
const DistributionTab = memo(({ pieData, totalAmount, loadingStates }) => (
  <div className="tab-content distribution-tab">
    <DistributionChart
      pieData={pieData}
      totalAmount={totalAmount}
      loading={loadingStates?.charts || false}
    />
  </div>
));
DistributionTab.displayName = 'DistributionTab';

// Records tab content
const RecordsTab = memo(({ sortedRecords, requestSort, loadingStates, sessionId, onRecordUpdate }) => (
  <div className="tab-content records-tab">
    <RecordsTable
      sessionId={sessionId}
      onRecordUpdate={onRecordUpdate}
      sortedRecords={sortedRecords}
      requestSort={requestSort}
      loading={loadingStates?.records || false}
    />
  </div>
));
RecordsTab.displayName = 'RecordsTab';

const TabbedBreakdownSection = memo(({ sessionId, updateRecord,
  bankName,
  bankNames,
  setBankName,
  selectedMonths,
  setSelectedMonths,
  sortedRecords,
  allRecords,
  lineData,
  pieData,
  totalAmount,
  requestSort,
  loading,
  loadingStates,
  onClearData
}) => {
  const [activeTab, setActiveTab] = useState(TABS.INSIGHT.id);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  if (loading && allRecords.length === 0) {
    return (
      <section className="breakdown-section">
        <div className="breakdown-loading">
          <div className="breakdown-spinner-black"></div>
          <h3>Processing your data...</h3>
          <p>Analyzing transactions and generating insights</p>
        </div>
      </section>
    );
  }

  if (allRecords.length === 0) {
    return (
      <section className="breakdown-section">
        <div className="breakdown-empty">
          <div className="empty-icon">[Chart]</div>
          <h3>No Data Available</h3>
          <p>Upload PDF statements above to see your financial breakdown</p>
        </div>
      </section>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.INSIGHT.id:
        return (
          <OverviewTab
            totalAmount={totalAmount}
            sortedRecords={sortedRecords}
          />
        );
      case TABS.TIME_SERIES.id:
        return (
          <TimeSeriesTab
            lineData={lineData}
            loadingStates={loadingStates}
          />
        );
      case TABS.DISTRIBUTION.id:
        return (
          <DistributionTab
            pieData={pieData}
            totalAmount={totalAmount}
            loadingStates={loadingStates}
          />
        );
      case TABS.RECORDS.id:
        return (
          <RecordsTab sessionId={sessionId} onRecordUpdate={updateRecord}
            sortedRecords={sortedRecords}
            requestSort={requestSort}
            loadingStates={loadingStates}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="parser-data-section">
      {/* Filter Section */}
      <FilterSection
        bankName={bankName}
        bankNames={bankNames}
        setBankName={setBankName}
        selectedMonths={selectedMonths}
        setSelectedMonths={setSelectedMonths}
        sortedRecords={sortedRecords}
        allRecords={allRecords}
        onClearData={onClearData}
        loading={loadingStates?.bankNames || false}
      />

      {/* Tabbed Data Display Section */}
      <section className="breakdown-section tabbed">
        <div className="breakdown-header">
          <h2>Parser Analysis</h2>
        </div>

        <TabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
          tabs={TABS}
        />

        <div className="tab-content-container">
          {renderTabContent()}
        </div>
      </section>
    </div>
  );
});

TabbedBreakdownSection.displayName = 'TabbedBreakdownSection';

export default TabbedBreakdownSection;