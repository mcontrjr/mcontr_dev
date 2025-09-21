/* eslint-disable react/prop-types */
import { memo } from 'react';
import FilterSection from './FilterSection';
import { WeeklyBucketsChart, DistributionChart, RecordsTable } from './ChartContainers';

const OptimizedBreakdownSection = memo(({
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

  return (
    <div className="parser-data-section">
      {/* Separated Filter Section */}
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

      {/* Separator between filters and data */}
      <hr className="filters-and-data-separator" />

      {/* Data Display Section */}
      <section className="breakdown-section">
        <div className="breakdown-header">
          <h2>Statement Analysis</h2>
          <p>Your financial data visualization and analysis</p>
        </div>

        <div className="breakdown-content">
          <WeeklyBucketsChart 
            lineData={lineData} 
            loading={loadingStates?.charts || false}
          />
          
          <DistributionChart 
            pieData={pieData} 
            totalAmount={totalAmount} 
            loading={loadingStates?.charts || false}
          />
          
          <RecordsTable 
            sortedRecords={sortedRecords} 
            requestSort={requestSort} 
            loading={loadingStates?.records || false}
          />
        </div>
      </section>
    </div>
  );
});

OptimizedBreakdownSection.displayName = 'OptimizedBreakdownSection';

export default OptimizedBreakdownSection;