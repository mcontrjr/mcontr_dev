/* eslint-disable react/prop-types */
import { memo, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useThemeColors } from '../../hooks/useThemeColors';
import { CHART_COLORS, CHART_CONFIG } from '../../constants/parserConstants';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Process data for time series accumulated chart
const processTimeSeriesData = (lineData) => {
  if (!lineData?.labels?.length) return { labels: [], datasets: [] };

  // Get only purchase data (filter out payments)
  const purchaseData = lineData.datasets?.find(dataset =>
    dataset.label === 'Purchases' || dataset.purchases
  )?.data || [];

  // Create date-amount pairs and sort chronologically
  const dateAmountPairs = lineData.labels.map((date, index) => ({
    date,
    amount: purchaseData[index] || 0
  })).filter(pair => pair.amount > 0) // Only include purchase days
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Calculate accumulated amounts
  let accumulated = 0;
  const processedData = dateAmountPairs.map(pair => {
    accumulated += pair.amount;
    return {
      ...pair,
      accumulated
    };
  });

  return {
    labels: processedData.map(item => item.date),
    datasets: [
      {
        label: 'Daily Purchases',
        data: processedData.map(item => item.amount),
        backgroundColor: '#22c55e', // Green for daily purchases
        borderColor: '#22c55e',
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Accumulated Total',
        data: processedData.map(item => item.accumulated),
        backgroundColor: CHART_COLORS.accent, // Yellow for accumulated
        borderColor: CHART_COLORS.accent,
        borderWidth: 2,
        yAxisID: 'y1',
      }
    ],
    rawData: processedData
  };
};

const TimeSeriesAccumulatedChart = memo(({ lineData }) => {
  const colors = useThemeColors();

  const chartData = useMemo(() => {
    return processTimeSeriesData(lineData);
  }, [lineData]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        grid: {
          color: colors.border
        },
        ticks: {
          color: colors.secondary,
          font: {
            family: CHART_CONFIG.fontFamily
          },
          maxRotation: 45,
          callback: function(value, index) {
            // Show every nth label to avoid crowding
            const label = this.getLabelForValue(value);
            if (chartData.labels.length > 20) {
              return index % Math.ceil(chartData.labels.length / 10) === 0 ? label : '';
            }
            return label;
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
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
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
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
          title: function(context) {
            return `Date: ${context[0].label}`;
          },
          label: function(context) {
            const value = context.raw;

            if (context.datasetIndex === 0) {
              // Daily purchases (first dataset now)
              return `Daily Purchase: $${value.toLocaleString()}`;
            } else {
              // Accumulated total (second dataset now)
              return `Accumulated Total: $${value.toLocaleString()}`;
            }
          },
          afterLabel: function(context) {
            const rawDataPoint = chartData.rawData?.[context.dataIndex];
            if (context.datasetIndex === 0 && rawDataPoint) {
              // For daily purchases, show the running total
              return `Running Total: $${rawDataPoint.accumulated.toLocaleString()}`;
            }
            return '';
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
  }), [colors, chartData]);

  if (!chartData.labels.length) {
    return (
      <div className="chart-no-data">
        <p>No purchase data available for time series view</p>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <Bar data={chartData} options={chartOptions} />
    </div>
  );
});

TimeSeriesAccumulatedChart.displayName = 'TimeSeriesAccumulatedChart';

export default TimeSeriesAccumulatedChart;