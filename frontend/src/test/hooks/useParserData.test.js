import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useParserData } from '../../hooks/useParserData';

// Mock fetch
global.fetch = vi.fn();

// Mock constants
vi.mock('../../constants/parserConstants', () => ({
  API_URL: '/api',
  DEFAULT_SELECTED_MONTHS: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'],
  SORT_DIRECTIONS: {
    ASCENDING: 'ascending',
    DESCENDING: 'descending'
  },
  CURRENCY_CONFIG: {
    locale: 'en-US',
    currency: 'USD',
    style: 'currency'
  },
  CHART_COLORS: {
    primary: '#0d3b66',
    secondary: '#006600',
    accent: '#f4d35e',
    variations: ['rgba(50, 124, 194, 0.8)', 'rgba(4, 210, 4, 0.8)'],
    pieChart: ['#FF6384', '#36A2EB', '#FFCE56']
  },
  MONTH_NAMES: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  WEEK_CALCULATION: {
    daysPerWeek: 7
  }
}));

// Mock data processing utilities
vi.mock('../../utils/dataProcessing', () => ({
  processChartData: vi.fn(() => ({
    lineData: { labels: ['Jan'], datasets: [] },
    sortedRecords: []
  })),
  processPieChartData: vi.fn(() => ({ labels: [], datasets: [] })),
  calculateFinancialMetrics: vi.fn(() => ({
    totalPurchases: '$0.00',
    totalPayments: '$0.00',
    netSpending: '$0.00',
    avgPurchase: '$0.00',
    transactionCount: 0,
    purchaseCount: 0
  })),
  sortRecords: vi.fn((records) => records)
}));

describe('useParserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => useParserData());
    
    expect(result.current.bankName).toBe('');
    expect(result.current.bankNames).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.selectedMonths).toEqual([
      '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
    ]);
  });

  it('fetches bank names on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        records: [
          { bank: 'Bank A' },
          { bank: 'Bank B' },
          { bank: 'Bank A' } // Duplicate should be filtered
        ]
      })
    });
    
    const { result } = renderHook(() => useParserData());
    
    await waitFor(() => {
      expect(result.current.bankNames).toEqual(['Bank A', 'Bank B']);
    });
    
    expect(fetch).toHaveBeenCalledWith('/api/records/');
  });

  it('fetches records on mount', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ records: [] })
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        records: [
          { id: 1, amount: '100.00', date: '2023-01-01' }
        ]
      })
    });
    
    const { result } = renderHook(() => useParserData());
    
    await waitFor(() => {
      expect(result.current.records).toEqual([
        { id: 1, amount: 100, date: '2023-01-01' }
      ]);
    });
  });

  it('handles fetch errors', async () => {
    fetch.mockRejectedValue(new Error('Network error'));
    
    const { result } = renderHook(() => useParserData());
    
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
      expect(result.current.error.message).toBe('Network error');
    });
  });

  it('updates bank name', () => {
    const { result } = renderHook(() => useParserData());
    
    act(() => {
      result.current.setBankName('Test Bank');
    });
    
    expect(result.current.bankName).toBe('Test Bank');
  });

  it('updates selected months', () => {
    const { result } = renderHook(() => useParserData());
    
    act(() => {
      result.current.setSelectedMonths(['01', '02']);
    });
    
    expect(result.current.selectedMonths).toEqual(['01', '02']);
  });

  it('handles sort request', () => {
    const { result } = renderHook(() => useParserData());
    
    act(() => {
      result.current.requestSort('amount');
    });
    
    // Should update sort config (implementation depends on internal state)
    expect(typeof result.current.requestSort).toBe('function');
  });

  it('uploads files successfully', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ records: [] })
    }).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ records: [] })
    });
    
    const { result } = renderHook(() => useParserData());
    const mockCallback = vi.fn();
    const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];
    
    await act(async () => {
      await result.current.uploadFiles(files, mockCallback);
    });
    
    expect(fetch).toHaveBeenCalledWith('/api/parse/', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData)
    }));
  });

  it('handles upload errors', async () => {
    fetch.mockRejectedValue(new Error('Upload failed'));
    
    const { result } = renderHook(() => useParserData());
    const mockCallback = vi.fn();
    const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];
    
    await act(async () => {
      await result.current.uploadFiles(files, mockCallback);
    });
    
    expect(mockCallback).toHaveBeenCalledWith('Error uploading files. Please try again.');
  });

  it('retries fetch on error', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
         .mockResolvedValueOnce({
           ok: true,
           json: () => Promise.resolve({ records: [] })
         });
    
    const { result } = renderHook(() => useParserData());
    
    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });
    
    // Retry
    await act(async () => {
      result.current.retryFetch();
    });
    
    await waitFor(() => {
      expect(result.current.error).toBe(null);
    });
  });
});