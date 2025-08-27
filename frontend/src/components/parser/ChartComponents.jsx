/* eslint-disable react/prop-types */
import { memo, useMemo, useCallback, useState } from 'react';
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
  CHART_CONFIG
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
export const AmountPie = memo(({ pieData, totalAmount }) => {
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
export const RecordTable = memo(({ sortedRecords, requestSort }) => {
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const filteredRecords = useMemo(() =>
    filterRecordsBySearch(sortedRecords || [], searchText),
    [sortedRecords, searchText]
  );

  // Reset page when search changes
  const handleSearchChange = useCallback((e) => {
    setSearchText(e.target.value);
    setCurrentPage(1);
  }, []);

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
                  <span className="category-badge">
                    {record.category}
                  </span>
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