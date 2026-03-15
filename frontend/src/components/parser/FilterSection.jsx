/* eslint-disable react/prop-types */
import { memo, useCallback, useMemo, useState, useRef } from 'react';

// ── Categories Panel ──────────────────────────────────────────────────────────
const CategoriesPanel = memo(({ categories, sessionOverrides, upsertCategory, deleteCategory }) => {
  const [editingCategory, setEditingCategory] = useState(null);
  const [editKeywords, setEditKeywords] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatKeywords, setNewCatKeywords] = useState([]);
  const [newCatKw, setNewCatKw] = useState('');
  const [saving, setSaving] = useState(false);
  const newKwRef = useRef(null);

  const handleEditStart = useCallback((cat) => {
    setEditingCategory(cat);
    setEditKeywords([...(categories[cat] || [])]);
    setNewKeyword('');
  }, [categories]);

  const handleCancelEdit = useCallback(() => {
    setEditingCategory(null);
    setEditKeywords([]);
    setNewKeyword('');
  }, []);

  const handleAddKeyword = useCallback(() => {
    const kw = newKeyword.trim().toUpperCase();
    if (kw && !editKeywords.includes(kw)) {
      setEditKeywords(prev => [...prev, kw]);
    }
    setNewKeyword('');
  }, [newKeyword, editKeywords]);

  const handleSave = useCallback(async () => {
    if (!editingCategory) return;
    setSaving(true);
    try {
      await upsertCategory(editingCategory, editKeywords);
      setEditingCategory(null);
    } finally {
      setSaving(false);
    }
  }, [editingCategory, editKeywords, upsertCategory]);

  const handleRevert = useCallback(async (cat) => {
    if (!window.confirm(`Revert "${cat}" to global defaults?`)) return;
    await deleteCategory(cat);
  }, [deleteCategory]);

  const handleAddNewCategory = useCallback(async () => {
    const name = newCatName.trim().toUpperCase();
    if (!name || newCatKeywords.length === 0) return;
    setSaving(true);
    try {
      await upsertCategory(name, newCatKeywords);
      setAddingNew(false);
      setNewCatName('');
      setNewCatKeywords([]);
      setNewCatKw('');
    } finally {
      setSaving(false);
    }
  }, [newCatName, newCatKeywords, upsertCategory]);

  const sortedEntries = useMemo(() => {
    const overriddenFirst = Object.entries(categories || {}).sort(([a], [b]) => {
      const aOvr = a in (sessionOverrides || {});
      const bOvr = b in (sessionOverrides || {});
      if (aOvr && !bOvr) return -1;
      if (!aOvr && bOvr) return 1;
      return a.localeCompare(b);
    });
    return overriddenFirst;
  }, [categories, sessionOverrides]);

  return (
    <div className="categories-panel">
      <div className="categories-list">
        {sortedEntries.map(([cat, keywords]) => {
          const isOverridden = cat in (sessionOverrides || {});
          const isEditing = editingCategory === cat;

          return (
            <div key={cat} className={`category-row ${isOverridden ? 'overridden' : ''} ${isEditing ? 'editing' : ''}`}>
              <div className="category-row-header">
                <span className="category-name">{cat}</span>
                <div className="category-row-actions">
                  {isOverridden && (
                    <button
                      className="cat-revert-btn"
                      onClick={() => handleRevert(cat)}
                      title="Revert to global default"
                    >
                      ↩ Revert
                    </button>
                  )}
                  <button
                    className="cat-edit-btn"
                    onClick={() => isEditing ? handleCancelEdit() : handleEditStart(cat)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="category-edit-area">
                  <div className="keyword-chips-edit">
                    {editKeywords.map(kw => (
                      <span key={kw} className="keyword-chip editable">
                        {kw}
                        <button
                          className="kw-remove-btn"
                          onClick={() => setEditKeywords(prev => prev.filter(k => k !== kw))}
                        >×</button>
                      </span>
                    ))}
                  </div>
                  <div className="keyword-add-row">
                    <input
                      type="text"
                      className="kw-input"
                      value={newKeyword}
                      onChange={e => setNewKeyword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddKeyword()}
                      placeholder="Add keyword..."
                    />
                    <button className="kw-add-btn" onClick={handleAddKeyword}>+</button>
                  </div>
                  <button className="cat-save-btn" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              ) : (
                <div className="keyword-chips">
                  {keywords.slice(0, 7).map(kw => (
                    <span key={kw} className="keyword-chip">{kw}</span>
                  ))}
                  {keywords.length > 7 && (
                    <span className="keyword-more">+{keywords.length - 7}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add new category */}
      {addingNew ? (
        <div className="add-category-form">
          <input
            type="text"
            className="kw-input"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value.toUpperCase())}
            placeholder="Category name (e.g. HOBBIES)"
          />
          <div className="keyword-chips-edit">
            {newCatKeywords.map(kw => (
              <span key={kw} className="keyword-chip editable">
                {kw}
                <button
                  className="kw-remove-btn"
                  onClick={() => setNewCatKeywords(prev => prev.filter(k => k !== kw))}
                >×</button>
              </span>
            ))}
          </div>
          <div className="keyword-add-row">
            <input
              ref={newKwRef}
              type="text"
              className="kw-input"
              value={newCatKw}
              onChange={e => setNewCatKw(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const kw = newCatKw.trim().toUpperCase();
                  if (kw && !newCatKeywords.includes(kw)) setNewCatKeywords(prev => [...prev, kw]);
                  setNewCatKw('');
                }
              }}
              placeholder="Add keyword..."
            />
            <button className="kw-add-btn" onClick={() => {
              const kw = newCatKw.trim().toUpperCase();
              if (kw && !newCatKeywords.includes(kw)) setNewCatKeywords(prev => [...prev, kw]);
              setNewCatKw('');
              newKwRef.current?.focus();
            }}>+</button>
          </div>
          <div className="add-category-actions">
            <button className="cat-save-btn" onClick={handleAddNewCategory} disabled={saving || !newCatName.trim() || newCatKeywords.length === 0}>
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button className="cat-cancel-btn" onClick={() => { setAddingNew(false); setNewCatName(''); setNewCatKeywords([]); setNewCatKw(''); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button className="add-category-btn" onClick={() => setAddingNew(true)}>
          + Add Category
        </button>
      )}
    </div>
  );
});
CategoriesPanel.displayName = 'CategoriesPanel';

// ── Main FilterSection ────────────────────────────────────────────────────────
const FilterSection = memo(({
  bankName,
  bankNames,
  setBankName,
  selectedMonths,
  setSelectedMonths,
  availableMonths,
  sortedRecords,
  onClearData,
  loading,
  categories,
  sessionOverrides,
  upsertCategory,
  deleteCategory,
}) => {
  const [activePanel, setActivePanel] = useState('filters');

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

  const availableMonthValues = useMemo(
    () => new Set(availableMonths),
    [availableMonths]
  );

  const availableBanks = bankNames;

  const handleBankChange = useCallback((newBankName) => {
    setBankName(newBankName);
  }, [setBankName]);

  const toggleMonth = useCallback((month) => {
    const isCurrentlySelected = selectedMonths.includes(month);
    if (isCurrentlySelected) {
      setSelectedMonths(selectedMonths.filter(m => m !== month));
    } else {
      setSelectedMonths([...selectedMonths, month]);
    }
  }, [selectedMonths, setSelectedMonths]);

  const clearAllMonths = useCallback(() => {
    setSelectedMonths([]);
  }, [setSelectedMonths]);

  const selectAllAvailableMonths = useCallback(() => {
    setSelectedMonths([...availableMonthValues]);
  }, [setSelectedMonths, availableMonthValues]);

  const handleClearData = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all uploaded data? This action cannot be undone.')) {
      if (onClearData) {
        await onClearData();
      }
    }
  }, [onClearData]);

  const previewStats = useMemo(() => {
    if (!sortedRecords?.length) return { recordCount: 0, dateRange: 'No data' };
    const dates = sortedRecords.map(r => new Date(r.date)).sort((a, b) => a - b);
    const startDate = dates[0].toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const endDate = dates[dates.length - 1].toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return {
      recordCount: sortedRecords.length,
      dateRange: startDate === endDate ? startDate : `${startDate} - ${endDate}`
    };
  }, [sortedRecords]);

  const overrideCount = Object.keys(sessionOverrides || {}).length;

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
      {/* Internal tab strip */}
      <div className="filter-tab-strip">
        <button
          className={`filter-tab-btn ${activePanel === 'filters' ? 'active' : ''}`}
          onClick={() => setActivePanel('filters')}
          type="button"
        >
          Filters
        </button>
        <button
          className={`filter-tab-btn ${activePanel === 'categories' ? 'active' : ''}`}
          onClick={() => setActivePanel('categories')}
          type="button"
        >
          Categories
          {overrideCount > 0 && (
            <span className="filter-tab-badge">{overrideCount}</span>
          )}
        </button>
      </div>

      {/* Filters panel */}
      {activePanel === 'filters' && (
        <div className="filter-panel">
          <div className="filters-header">
            <h3>Data Filters</h3>
            <div className="filters-actions">
              <button
                className="filter-action-btn clear-data"
                onClick={handleClearData}
                title="Clear all uploaded data from backend"
                data-test-id="clear-data-button"
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
                disabled={selectedMonths.length === availableMonthValues.size || availableMonthValues.size === 0}
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
                data-test-id="bank-filter"
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
                   `${selectedMonths.length} of ${availableMonthValues.size} available`}
                </span>
              </div>
              <div className="months-grid" data-test-id="month-filter">
                {monthOptions.map(month => {
                  const isAvailable = availableMonthValues.has(month.value);
                  const isSelected = selectedMonths.includes(month.value);
                  return (
                    <button
                      key={month.value}
                      className={`month-chip ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}`}
                      onClick={() => isAvailable && toggleMonth(month.value)}
                      type="button"
                      disabled={!isAvailable}
                      title={!isAvailable ? 'No data for this month' : `Toggle ${month.label}`}
                      data-test-id={`month-${month.value}`}
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
      )}

      {/* Categories panel */}
      {activePanel === 'categories' && (
        <div className="filter-panel">
          <div className="filters-header">
            <h3>Category Keywords</h3>
            <span className="filter-hint" style={{ fontSize: '0.8rem', opacity: 0.7 }}>
              {overrideCount > 0 ? `${overrideCount} session override${overrideCount !== 1 ? 's' : ''}` : 'Using global defaults'}
            </span>
          </div>
          <CategoriesPanel
            categories={categories || {}}
            sessionOverrides={sessionOverrides || {}}
            upsertCategory={upsertCategory}
            deleteCategory={deleteCategory}
          />
        </div>
      )}
    </div>
  );
});

FilterSection.displayName = 'FilterSection';

export default FilterSection;
