/* eslint-disable react/prop-types, no-unused-vars */
import { AmountBar, AmountPie, RecordTable } from './ChartComponents';
import { CHART_DIMENSIONS } from '../../constants/parserConstants';

const FilterRow = ({ bankName, bankNames, setBankName, selectedMonths, setSelectedMonths, onClearData }) => {
  const monthOptions = [
    { value: "01", label: "Jan" },
    { value: "02", label: "Feb" },
    { value: "03", label: "Mar" },
    { value: "04", label: "Apr" },
    { value: "05", label: "May" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Jul" },
    { value: "08", label: "Aug" },
    { value: "09", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" }
  ];

  const toggleMonth = (month) => {
    setSelectedMonths(prev =>
      prev.includes(month)
        ? prev.filter(m => m !== month)
        : [...prev, month]
    );
  };

  const clearAllMonths = () => setSelectedMonths([]);
  const selectAllMonths = () => setSelectedMonths(monthOptions.map(m => m.value));

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to clear all uploaded data? This action cannot be undone.')) {
      if (onClearData) {
        await onClearData();
      }
    }
  };

  return (
    <div className="breakdown-filters-container">
      <div className="filters-header">
        <h3>Filters</h3>
        <div className="filters-actions">
          <button
            className="filter-action-btn clear-data"
            onClick={handleClearData}
            title="Clear all uploaded data from backend"
          >
            Clear Data
          </button>
          <button
            className="filter-action-btn clear"
            onClick={clearAllMonths}
            disabled={selectedMonths.length === 0}
          >
            Clear Filters
          </button>
          <button
            className="filter-action-btn select"
            onClick={selectAllMonths}
            disabled={selectedMonths.length === 12}
          >
            Select All
          </button>
        </div>
      </div>

      <div className="filters-row">
        <div className="filter-section bank-filter">
          <div className="filter-header">
            <label htmlFor="bank-select" className="filter-label">
              <span className="filter-icon">[Bank]</span>
              Bank Selector
            </label>
            <span className="filter-hint">
              {bankName || "All banks"}
            </span>
          </div>
          <select
            id="bank-select"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="enhanced-select"
          >
            <option value="">All Banks</option>
            {bankNames.map(bank => (
              <option key={bank} value={bank}>{bank}</option>
            ))}
          </select>
        </div>

        <div className="filter-section months-filter">
          <div className="filter-header">
            <label className="filter-label">
              <span className="filter-icon">[Time]</span>
              Month Selector
            </label>
            <span className="filter-hint">
              {selectedMonths.length === 0 ? "No months selected" :
               selectedMonths.length === 12 ? "All months" :
               `${selectedMonths.length} month${selectedMonths.length > 1 ? 's' : ''} selected`}
            </span>
          </div>
          <div className="months-grid">
            {monthOptions.map(month => (
              <button
                key={month.value}
                className={`month-chip ${selectedMonths.includes(month.value) ? 'selected' : ''}`}
                onClick={() => toggleMonth(month.value)}
                type="button"
              >
                {month.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="filters-summary">
        <div className="summary-stats">
          <span className="stat-item">
            <span className="stat-label">Bank:</span>
            <span className="stat-value">{bankName || "All"}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Period:</span>
            <span className="stat-value">
              {selectedMonths.length === 0 ? "No filter" :
               selectedMonths.length === 12 ? "Full year" :
               `${selectedMonths.length} months`}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

const BreakdownSection = ({
  bankName,
  bankNames,
  setBankName,
  selectedMonths,
  setSelectedMonths,
  sortedRecords,
  lineData,
  pieData,
  totalAmount,
  requestSort,
  loading,
  onClearData
}) => {

  if (loading) {
    return (
      <section className="breakdown-section">
        <div className="breakdown-loading">
          <div className="breakdown-spinner"></div>
          <h3>Processing your data...</h3>
          <p>Analyzing transactions and generating insights</p>
        </div>
      </section>
    );
  }

  if (sortedRecords.length === 0) {
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
    <section className="breakdown-section">
      <div className="breakdown-header">
        <h2>Statement Analysis</h2>
      </div>

      <FilterRow
        bankName={bankName}
        bankNames={bankNames}
        setBankName={setBankName}
        selectedMonths={selectedMonths}
        setSelectedMonths={setSelectedMonths}
        onClearData={onClearData}
      />

      <div className="breakdown-content">
        <div className="breakdown-card">
          <div className="breakdown-card-header">
            <h3>Weekly Buckets</h3>
            <p>See which weeks you were good and which ones you were not so good</p>
          </div>
          <div className="breakdown-card-body" style={{ height: `${CHART_DIMENSIONS.defaultHeight}px` }}>
            <AmountBar lineData={lineData} />
          </div>
        </div>

        <div className="breakdown-card">
          <div className="breakdown-card-header">
            <h3>Distribution & Metrics</h3>
            <p>For those who like pie and metrics</p>
          </div>
          <div className="breakdown-card-body">
            <AmountPie pieData={pieData} totalAmount={totalAmount} />
          </div>
        </div>

        <div className="breakdown-card">
          <div className="breakdown-card-header">
            <h3>Parsed Records</h3>
            <p>Everyone likes a good scrollable sorting table</p>
          </div>
          <div className="breakdown-card-body">
            <RecordTable
              sortedRecords={sortedRecords}
              requestSort={requestSort}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default BreakdownSection;