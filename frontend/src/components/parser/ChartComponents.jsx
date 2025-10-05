/* eslint-disable react/prop-types */
import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { useThemeColors } from '../../hooks/useThemeColors';
import { processWeeklyData, filterRecordsBySearch } from '../../utils/dataProcessing';
import {
  CHART_COLORS,
  CHART_DIMENSIONS,
  CHART_CONFIG,
  API_URL
} from '../../constants/parserConstants';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Re-export AmountBar component with optimizations
export const AmountBar = memo(({ lineData }) => {
  const colors = useThemeColors();

  const weeklyData = useMemo(() => {
    if (!lineData?.labels?.length) return { labels: [], datasets: [] };

    const processed = processWeeklyData(lineData);
    return {
      ...processed,
      datasets: processed.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: index === 0 ? CHART_COLORS.accent : CHART_COLORS.secondary,
        barPercentage: CHART_CONFIG.barPercentage,
      }))
    };
  }, [lineData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: colors.border
        },
        ticks: {
          color: colors.secondary,
          font: {
            family: CHART_CONFIG.fontFamily
          }
        }
      },
      y: {
        grid: {
          color: colors.border
        },
        ticks: {
          color: colors.secondary,
          callback: (value) => `$${value.toLocaleString()}`,
          font: {
            family: CHART_CONFIG.fontFamily
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return `${context.dataset.label}: $${value.toLocaleString()}`;
          }
        },
        titleFont: {
          family: CHART_CONFIG.fontFamily
        },
        bodyFont: {
          family: CHART_CONFIG.fontFamily
        }
      },
      legend: {
        labels: {
          color: colors.primary,
          font: {
            family: CHART_CONFIG.fontFamily
          }
        }
      }
    }
  }), [colors]);

  return (
    <div className="chart-container">
      <Bar data={weeklyData} options={chartOptions} />
    </div>
  );
});

AmountBar.displayName = 'AmountBar';

// Re-export AmountPie component with optimizations
export const AmountPie = memo(({ pieData }) => {
  const colors = useThemeColors();

  const customPieData = useMemo(() => {
    if (!pieData?.datasets?.length) return { labels: [], datasets: [] };

    return {
      ...pieData,
      datasets: [{
        ...pieData.datasets[0],
        backgroundColor: [
          CHART_COLORS.primary,
          CHART_COLORS.secondary,
          CHART_COLORS.accent,
          ...CHART_COLORS.variations
        ]
      }]
    };
  }, [pieData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        titleFont: {
          family: CHART_CONFIG.fontFamily
        },
        bodyFont: {
          family: CHART_CONFIG.fontFamily
        },
        callbacks: {
          label: function(context) {
            const value = context.raw;
            return `${context.label}: $${value.toLocaleString()}`;
          }
        }
      },
      legend: {
        position: CHART_CONFIG.legendPosition,
        labels: {
          color: colors.primary,
          padding: CHART_CONFIG.legendPadding,
          font: {
            family: CHART_CONFIG.fontFamily
          }
        }
      }
    }
  }), [colors]);

  return (
    <div className="chart-container" style={{ height: `${CHART_DIMENSIONS.defaultHeight}px` }}>
      <Pie data={customPieData} options={chartOptions} />
    </div>
  );
});

AmountPie.displayName = 'AmountPie';

// Re-export RecordTable component with pagination

// Category Dropdown Component - Enhanced Mobile-First Experience
const CategoryDropdown = memo(({ record, availableCategories, sessionId, onCategoryUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [ripples, setRipples] = useState([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const optionsRef = useRef([]);

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return availableCategories;
    const query = searchQuery.toLowerCase();
    return availableCategories.filter(cat =>
      cat.toLowerCase().includes(query)
    );
  }, [availableCategories, searchQuery]);

  // Show search only if there are many categories
  const showSearch = availableCategories.length > 8;

  const handleCategoryChange = useCallback(async (newCategory) => {
    if (newCategory === record.category) {
      setIsOpen(false);
      setSearchQuery('');
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch(`${API_URL}/edit_record/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record_id: record.id,
          category: newCategory,
          session_id: sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      const result = await response.json();

      if (result.success && result.updated_record) {
        onCategoryUpdate(result.updated_record);
        setIsOpen(false);
        setSearchQuery('');
      } else {
        throw new Error(result.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating category:', error);
    } finally {
      setIsUpdating(false);
    }
  }, [record, sessionId, onCategoryUpdate]);

  // Ripple effect on touch/click
  const createRipple = useCallback((event, element) => {
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = { x, y, size, id: Date.now() };
    setRipples(prev => [...prev, ripple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
  }, []);

  const toggleDropdown = useCallback((event) => {
    if (event.currentTarget) {
      createRipple(event, event.currentTarget);
    }
    setIsOpen(prev => !prev);
    setFocusedIndex(-1);
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, createRipple]);

  const handleClickOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  }, []);

  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
      setSearchQuery('');
      setFocusedIndex(-1);
      dropdownRef.current?.querySelector('.category-badge')?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev =>
          prev < filteredCategories.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredCategories[focusedIndex]) {
          handleCategoryChange(filteredCategories[focusedIndex]);
        }
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(filteredCategories.length - 1);
        break;
    }
  }, [isOpen, focusedIndex, filteredCategories, handleCategoryChange]);

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && optionsRef.current[focusedIndex]) {
      optionsRef.current[focusedIndex].scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [focusedIndex]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleKeyDown);

      // Auto-focus search input if available
      if (showSearch && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscape);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleClickOutside, handleEscape, handleKeyDown, showSearch]);

  const handleOptionClick = useCallback((category, event) => {
    if (event.currentTarget) {
      createRipple(event, event.currentTarget);
    }
    setTimeout(() => handleCategoryChange(category), 150);
  }, [handleCategoryChange, createRipple]);

  return (
    <div
      className="category-dropdown-container"
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <button
        className={`category-badge ${isUpdating ? 'updating' : ''} ${isOpen ? 'active' : ''}`}
        onClick={toggleDropdown}
        disabled={isUpdating}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Change category from ${record.category}`}
      >
        {isUpdating ? (
          <span className="category-spinner" aria-label="Updating">⟳</span>
        ) : (
          record.category
        )}
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`} aria-hidden="true">▼</span>

        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="ripple"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size
            }}
          />
        ))}
      </button>

      {isOpen && (
        <div
          className="category-dropdown-menu"
          ref={menuRef}
          role="listbox"
          aria-label="Category options"
        >
          {showSearch && (
            <div className="category-search">
              <input
                ref={searchInputRef}
                type="text"
                className="category-search-input"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search categories"
              />
            </div>
          )}

          <div className="category-options">
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => (
                <button
                  key={category}
                  ref={el => optionsRef.current[index] = el}
                  className={`category-option ${category === record.category ? 'current' : ''} ${focusedIndex === index ? 'focused' : ''}`}
                  onClick={(e) => handleOptionClick(category, e)}
                  type="button"
                  role="option"
                  aria-selected={category === record.category}
                  tabIndex={focusedIndex === index ? 0 : -1}
                >
                  <span className="category-option-text">{category}</span>
                  {category === record.category && (
                    <span className="category-check" aria-hidden="true">✓</span>
                  )}
                  {ripples.map(ripple => (
                    <span
                      key={ripple.id}
                      className="ripple"
                      style={{
                        left: ripple.x,
                        top: ripple.y,
                        width: ripple.size,
                        height: ripple.size
                      }}
                    />
                  ))}
                </button>
              ))
            ) : (
              <div className="category-no-results">No categories found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
CategoryDropdown.displayName = 'CategoryDropdown';


// Enhanced Record Table with Category Editing
export const RecordTable = memo(({ sortedRecords, requestSort, sessionId, onRecordUpdate }) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  // Get available categories from the sorted records
  const availableCategories = useMemo(() => {
    const categories = [...new Set(sortedRecords?.map(record => record.category) || [])];
    return categories.sort();
  }, [sortedRecords]);

  const filteredRecords = useMemo(() =>
    filterRecordsBySearch(sortedRecords || [], searchText),
    [sortedRecords, searchText]
  );

  // Reset page when search changes
  const handleSearchChange = useCallback((e) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  }, []);

  // Handle category update from dropdown
  const handleCategoryUpdate = useCallback((updatedRecord) => {
    // Notify parent component to update the record in the main data
    if (onRecordUpdate) {
      onRecordUpdate(updatedRecord);
    }
  }, [onRecordUpdate]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, endIndex);

  // Pagination controls
  const goToPage = useCallback((page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const goToPrevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const goToNextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const handleRecordsPerPageChange = useCallback((e) => {
    setRecordsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const formatCurrency = useCallback((amount) => {
    return amount?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00';
  }, []);

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="records-table-container">
      <div className="records-table-header compact">
        <div className="table-title-section">
          <h4>Transactions</h4>
          <span className="records-count">
            {filteredRecords.length} total • Page {currentPage} of {totalPages}
          </span>
        </div>
        <div className="table-controls">
          <select
            value={recordsPerPage}
            onChange={handleRecordsPerPageChange}
            className="records-per-page-select"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={handleSearchChange}
            className="records-search-input compact"
          />
        </div>
      </div>

      <div className="records-table-wrapper">
        <table className="records-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('date')} className="sortable">
                Date ↕
              </th>
              <th onClick={() => requestSort('description')} className="sortable">
                Description ↕
              </th>
              <th onClick={() => requestSort('amount')} className="sortable">
                Amount ↕
              </th>
              <th onClick={() => requestSort('category')} className="sortable">
                Category ↕
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRecords.map((record) => (
              <tr key={record.id}>
                <td className="date-cell">{record.date}</td>
                <td className="description-cell" title={record.description}>
                  {record.description}
                </td>
                <td className={`amount-cell ${record.amount >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(record.amount)}
                </td>
                <td className="category-cell">
                  <CategoryDropdown
                    record={record}
                    availableCategories={availableCategories}
                    sessionId={sessionId}
                    onCategoryUpdate={handleCategoryUpdate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecords.length === 0 && (
          <div className="no-records">
            <p>No transactions found.</p>
            {searchText && (
              <p>Try adjusting your search criteria.</p>
            )}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredRecords.length)} of {filteredRecords.length}
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={goToPrevPage}
              disabled={currentPage === 1}
            >
              ← Prev
            </button>

            {getPageNumbers().map((page, index) => (
              <span key={index}>
                {page === '...' ? (
                  <span className="pagination-ellipsis">...</span>
                ) : (
                  <button
                    className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                )}
              </span>
            ))}

            <button
              className="pagination-btn"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

RecordTable.displayName = 'RecordTable';
