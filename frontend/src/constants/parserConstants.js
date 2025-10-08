export const API_URL = "/api";
export const PARSER_MOCK = import.meta.env.VITE_PARSER_MOCK === 'true';

export const CHART_COLORS = {
  primary: '#0d3b66',
  secondary: '#006600', 
  accent: '#f4d35e',
  variations: [
    'rgba(50, 124, 194, 0.8)',
    'rgba(4, 210, 4, 0.8)',
    'rgba(243, 210, 89, 0.8)',
    'rgba(87, 243, 241, 0.6)',
    'rgba(245, 234, 40, 0.6)',
    'rgba(191, 35, 4, 0.6)',
  ],
  pieChart: [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#FF5733', '#33FF57', '#3357FF',
    '#FF33A1', '#A133FF', '#33FFA1', '#A1FF33', '#FF3333',
    '#33FF33', '#3333FF', '#FF33FF', '#33FFFF', '#FFFF33'
  ]
};

export const CHART_DIMENSIONS = {
  defaultHeight: 500,
  mobileHeight: 350,
  tableMaxHeight: 600,
  chartAspectRatio: 0.8
};

export const MONTHS = [
  { value: '01', label: 'Jan' },
  { value: '02', label: 'Feb' },
  { value: '03', label: 'Mar' },
  { value: '04', label: 'Apr' },
  { value: '05', label: 'May' },
  { value: '06', label: 'Jun' },
  { value: '07', label: 'Jul' },
  { value: '08', label: 'Aug' },
  { value: '09', label: 'Sep' },
  { value: '10', label: 'Oct' },
  { value: '11', label: 'Nov' },
  { value: '12', label: 'Dec' }
];

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DEFAULT_SELECTED_MONTHS = [
  '01', '02', '03', '04', '05', '06', 
  '07', '08', '09', '10', '11', '12'
];

export const WEEK_CALCULATION = {
  daysPerWeek: 7
};

export const CHART_CONFIG = {
  barPercentage: 0.8,
  fontFamily: '"Roboto Mono", monospace',
  legendPosition: 'bottom',
  legendPadding: 20
};

export const CURRENCY_CONFIG = {
  locale: 'en-US',
  currency: 'USD',
  style: 'currency'
};

export const SORT_DIRECTIONS = {
  ASCENDING: 'ascending',
  DESCENDING: 'descending'
};

export const TAB_NAMES = {
  AMOUNT_OVER_TIME: 'amountOverTime',
  DISTRIBUTION: 'distribution',
  RECORDS: 'records',
  UPLOAD: 'upload',
  ANALYZE: 'analyze'
};

export const LOADING_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};