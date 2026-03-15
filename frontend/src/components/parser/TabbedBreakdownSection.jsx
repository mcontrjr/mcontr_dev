/* eslint-disable react/prop-types */
import { memo, useState, useCallback, useMemo } from 'react';
import FilterSection from './FilterSection';
import { DistributionChart, RecordsTable, WeeklyBucketsChart } from './ChartContainers';
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
          data-test-id={`tab-${tab.id}`}
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
const OverviewTab = memo(({ metrics, sortedRecords, monthlyIncome }) => {
  // Get top 5 largest purchases from filtered records
  const largestPurchases = sortedRecords?.filter(record => record.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5) || [];

  const totalPurchasesNum = parseFloat(metrics?.totalPurchases?.replace(/[$,]/g, '') || 0);
  const incomeRemainder = monthlyIncome != null ? monthlyIncome - totalPurchasesNum : null;
  const incomePercent = monthlyIncome != null && monthlyIncome > 0
    ? ((totalPurchasesNum / monthlyIncome) * 100).toFixed(1)
    : null;

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
            {metrics && (
              <>
                <div className="metric-item large">
                  <span className="metric-label">Total Purchases</span>
                  <span className="metric-value primary">{metrics.totalPurchases || '$0.00'}</span>
                </div>
                <div className="metric-item large">
                  <span className="metric-label">Monthly Income</span>
                  <span className="metric-value positive">
                    {monthlyIncome != null
                      ? monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                      : '—'}
                  </span>
                </div>
                <div className="metric-item large">
                  <span className="metric-label">
                    {incomeRemainder != null ? 'Income Remaining' : 'Net Spending'}
                  </span>
                  <span className={`metric-value ${(incomeRemainder ?? (metrics.netSpending?.includes('-') ? 1 : -1)) >= 0 ? 'positive' : 'negative'}`}>
                    {incomeRemainder != null
                      ? incomeRemainder.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                      : (metrics.netSpending || '$0.00')}
                    {incomePercent != null && (
                      <span style={{ fontSize: '0.75em', marginLeft: '0.4em', opacity: 0.7 }}>
                        ({incomePercent}%)
                      </span>
                    )}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Avg Purchase</span>
                  <span className="metric-value">{metrics.avgPurchase || '$0.00'}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Purchase Count</span>
                  <span className="metric-value">{metrics.purchaseCount || 0}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Total Transactions</span>
                  <span className="metric-value">{metrics.transactionCount || 0}</span>
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
const TimeSeriesTab = memo(({ lineData, weeklyData, loadingStates }) => (
  <div className="tab-content timeseries-tab" data-test-id="chart-timeseries">
    <ChartContainer
      title="Purchase Timeline"
      description="Chronological view of purchases with accumulated totals - dates with more activity stand out visually"
      loading={loadingStates?.charts || false}
      height={CHART_DIMENSIONS.defaultHeight}
      className="timeseries-container"
    >
      <TimeSeriesAccumulatedChart lineData={lineData} />
    </ChartContainer>
    <WeeklyBucketsChart weeklyData={weeklyData} loading={loadingStates?.charts || false} />
  </div>
));
TimeSeriesTab.displayName = 'TimeSeriesTab';

// Distribution tab content
const DistributionTab = memo(({ pieData, metrics, loadingStates }) => (
  <div className="tab-content distribution-tab" data-test-id="chart-distribution">
    <DistributionChart
      pieData={pieData}
      totalAmount={metrics}
      loading={loadingStates?.charts || false}
    />
  </div>
));
DistributionTab.displayName = 'DistributionTab';

// Category filter bar — local to the Records tab only
const CategoryFilterBar = memo(({ records, selected, onToggle, onReset }) => {
  const categories = useMemo(() =>
    [...new Set(records?.map(r => r.category) || [])].sort(),
    [records]
  );

  if (categories.length === 0) return null;

  const allSelected = selected === null;

  return (
    <div className="records-category-filter" role="group" aria-label="Filter by category">
      <button
        className={`cat-filter-chip all-chip ${allSelected ? 'active' : ''}`}
        onClick={onReset}
        type="button"
      >
        All
      </button>
      {categories.map(cat => {
        const isActive = allSelected || selected?.has(cat);
        return (
          <button
            key={cat}
            className={`cat-filter-chip ${isActive ? 'active' : ''}`}
            onClick={() => onToggle(cat)}
            type="button"
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
});
CategoryFilterBar.displayName = 'CategoryFilterBar';

// Records tab content — with local category filter
const RecordsTab = memo(({ sortedRecords, requestSort, loadingStates, sessionId, onRecordUpdate }) => {
  // null = no filter (show all); Set = specific categories to show
  const [selectedCategories, setSelectedCategories] = useState(null);

  const toggleCategory = useCallback((cat) => {
    setSelectedCategories(prev => {
      if (prev === null) {
        // All shown → isolate to this one category
        return new Set([cat]);
      }
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
        // If nothing left, reset to all
        return next.size === 0 ? null : next;
      }
      next.add(cat);
      return next;
    });
  }, []);

  const resetFilter = useCallback(() => setSelectedCategories(null), []);

  const filteredRecords = useMemo(() => {
    if (selectedCategories === null) return sortedRecords;
    return (sortedRecords || []).filter(r => selectedCategories.has(r.category));
  }, [sortedRecords, selectedCategories]);

  return (
    <div className="tab-content records-tab">
      <CategoryFilterBar
        records={sortedRecords}
        selected={selectedCategories}
        onToggle={toggleCategory}
        onReset={resetFilter}
      />
      <RecordsTable
        sessionId={sessionId}
        onRecordUpdate={onRecordUpdate}
        sortedRecords={filteredRecords}
        requestSort={requestSort}
        loading={loadingStates?.records || false}
      />
    </div>
  );
});
RecordsTab.displayName = 'RecordsTab';

const TabbedBreakdownSection = memo(({ sessionId, updateRecord,
  bankName,
  bankNames,
  setBankName,
  selectedMonths,
  setSelectedMonths,
  availableMonths,
  sortedRecords,
  allRecords,
  lineData,
  pieData,
  totalAmount,
  weeklyData,
  requestSort,
  loading,
  loadingStates,
  onClearData,
  monthlyIncome,
  categories,
  sessionOverrides,
  upsertCategory,
  deleteCategory,
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
            metrics={totalAmount}
            sortedRecords={sortedRecords}
            monthlyIncome={monthlyIncome}
          />
        );
      case TABS.TIME_SERIES.id:
        return (
          <TimeSeriesTab
            lineData={lineData}
            weeklyData={weeklyData}
            loadingStates={loadingStates}
          />
        );
      case TABS.DISTRIBUTION.id:
        return (
          <DistributionTab
            pieData={pieData}
            metrics={totalAmount}
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
    <div className="parser-data-section" data-test-id="breakdown-section">
      {/* Filter Section */}
      <FilterSection
        bankName={bankName}
        bankNames={bankNames}
        setBankName={setBankName}
        selectedMonths={selectedMonths}
        setSelectedMonths={setSelectedMonths}
        availableMonths={availableMonths}
        sortedRecords={sortedRecords}
        onClearData={onClearData}
        loading={loadingStates?.bankNames || false}
        categories={categories}
        sessionOverrides={sessionOverrides}
        upsertCategory={upsertCategory}
        deleteCategory={deleteCategory}
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
