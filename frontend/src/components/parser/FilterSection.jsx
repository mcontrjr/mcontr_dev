/* eslint-disable react/prop-types */
import { memo, useCallback, useMemo, useEffect } from 'react';

const FilterSection = memo(({
  bankName,
  bankNames,
  setBankName,
  selectedMonths,
  setSelectedMonths,
  sortedRecords,
  allRecords,
  onClearData,
  loading
}) => {
  const monthOptions = useMemo(() => [
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
  ], []);

  // Smart filtering: determine which months have data
  const availableMonths = useMemo(() => {
    if (!allRecords?.length) return [];
    
    const recordMonths = new Set(
      allRecords
        .filter(record => !bankName || record.bank === bankName)
        .map(record => record.date.split('-')[1])
    );
    
    return monthOptions.filter(month => recordMonths.has(month.value));
  }, [allRecords, bankName, monthOptions]);

  const availableBanks = useMemo(() => {
    if (!sortedRecords?.length) return bankNames;
    
    const filteredRecords = selectedMonths.length > 0
      ? sortedRecords.filter(record => selectedMonths.includes(record.date.split('-')[1]))
      : sortedRecords;
    
    const recordBanks = new Set(filteredRecords.map(record => record.bank));
    return bankNames.filter(bank => recordBanks.has(bank));
  }, [sortedRecords, selectedMonths, bankNames]);

  // Initialize selected months to match available months when data loads
  useEffect(() => {
    if (availableMonths.length > 0 && selectedMonths.length === 0) {
      // Initialize with all available months when first loading data
      setSelectedMonths(availableMonths.map(m => m.value));
    }
  }, [availableMonths, selectedMonths, setSelectedMonths]);

  // Intelligent filter updates that maintain data visibility
  const handleBankChange = useCallback((newBankName) => {
    setBankName(newBankName);
    
    // When changing banks, reset to show all available months for that bank
    if (newBankName && allRecords?.length) {
      const bankRecords = allRecords.filter(record => record.bank === newBankName);
      const bankMonths = [...new Set(bankRecords.map(record => record.date.split('-')[1]))];
      
      if (bankMonths.length > 0) {
        setSelectedMonths(bankMonths);
      }
    } else if (!newBankName && availableMonths.length > 0) {
      // When selecting "All Banks", show all available months
      setSelectedMonths(availableMonths.map(m => m.value));
    }
  }, [setBankName, setSelectedMonths, allRecords, availableMonths]);

  const toggleMonth = useCallback((month) => {
    const isCurrentlySelected = selectedMonths.includes(month);
    
    if (isCurrentlySelected) {
      // Removing a month
      const newMonths = selectedMonths.filter(m => m !== month);
      setSelectedMonths(newMonths);
    } else {
      // Adding a month
      const newMonths = [...selectedMonths, month];
      setSelectedMonths(newMonths);
    }
  }, [selectedMonths, setSelectedMonths]);

  const clearAllMonths = useCallback(() => {
    // Clear all months - this will show all records (no month filter)
    setSelectedMonths([]);
  }, [setSelectedMonths]);

  const selectAllAvailableMonths = useCallback(() => {
    setSelectedMonths(availableMonths.map(m => m.value));
  }, [setSelectedMonths, availableMonths]);

  const handleClearData = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all uploaded data? This action cannot be undone.')) {
      if (onClearData) {
        await onClearData();
      }
    }
  }, [onClearData]);

  // Calculate filter preview stats
  const previewStats = useMemo(() => {
    if (!sortedRecords?.length) return { recordCount: 0, dateRange: 'No data' };
    
    let filteredRecords = sortedRecords;
    
    if (bankName) {
      filteredRecords = filteredRecords.filter(record => record.bank === bankName);
    }
    
    // Only apply month filter if months are selected
    // Empty selectedMonths means "show all records"
    if (selectedMonths.length > 0) {
      filteredRecords = filteredRecords.filter(record => 
        selectedMonths.includes(record.date.split('-')[1])
      );
    }
    
    if (filteredRecords.length === 0) {
      return { recordCount: 0, dateRange: 'No results' };
    }
    
    const dates = filteredRecords.map(r => new Date(r.date)).sort((a, b) => a - b);
    const startDate = dates[0].toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endDate = dates[dates.length - 1].toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    return {
      recordCount: filteredRecords.length,
      dateRange: startDate === endDate ? startDate : `${startDate} - ${endDate}`
    };
  }, [sortedRecords, bankName, selectedMonths]);

  if (loading) {
    return (
      <div className="breakdown-filters-container">
        <div className="breakdown-loading">
          <div className="breakdown-spinner-black"></div>
          <h3>Loading filters...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="breakdown-filters-container">
      <div className="filters-header">
        <h3>Data Filters</h3>
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
            title="Clear month filter to show all records"
          >
            Clear Months
          </button>
          <button
            className="filter-action-btn select"
            onClick={selectAllAvailableMonths}
            disabled={selectedMonths.length === availableMonths.length || availableMonths.length === 0}
            title="Select all months with data"
          >
            Select All Available
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
              {bankName || "All banks"} ({availableBanks.length} available)
            </span>
          </div>
          <select
            id="bank-select"
            value={bankName}
            onChange={(e) => handleBankChange(e.target.value)}
            className="enhanced-select"
          >
            <option value="">All Banks</option>
            {availableBanks.map(bank => (
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
              {selectedMonths.length === 0 ? "All records (no month filter)" :
               selectedMonths.length === availableMonths.length && availableMonths.length > 0 ? "All available months" :
               `${selectedMonths.length} of ${availableMonths.length} available`}
            </span>
          </div>
          <div className="months-grid">
            {monthOptions.map(month => {
              const isAvailable = availableMonths.some(am => am.value === month.value);
              const isSelected = selectedMonths.includes(month.value);
              
              return (
                <button
                  key={month.value}
                  className={`month-chip ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                  onClick={() => isAvailable && toggleMonth(month.value)}
                  type="button"
                  disabled={!isAvailable}
                  title={!isAvailable ? 'No data for this month' : `Toggle ${month.label}`}
                >
                  {month.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="filters-summary">
        <div className="summary-stats">
          <span className="stat-item">
            <span className="stat-label">Active Filter:</span>
            <span className="stat-value">{bankName || "All Banks"}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Period:</span>
            <span className="stat-value">{previewStats.dateRange}</span>
          </span>
          <span className="stat-item">
            <span className="stat-label">Records:</span>
            <span className={`stat-value ${previewStats.recordCount === 0 ? 'warning' : ''}`}>
              {previewStats.recordCount}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

export default FilterSection;