import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useParserData } from '../../hooks/useParserData';
import {
  processChartData,
  processPieChartData,
  calculateFinancialMetrics,
  sortRecords,
  filterRecordsBySearch
} from '../../utils/dataProcessing';

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

describe('Data Flow Integration Tests', () => {
  const mockRecordsData = {
    records: [
      {
        id: 1,
        date: '2023-01-15',
        description: 'Coffee Shop',
        amount: '12.99',
        category: 'Food',
        bank: 'Test Bank'
      },
      {
        id: 2,
        date: '2023-01-20',
        description: 'Grocery Store',
        amount: '67.45',
        category: 'Food',
        bank: 'Test Bank'
      },
      {
        id: 3,
        date: '2023-02-01',
        description: 'Gas Station',
        amount: '45.00',
        category: 'Transportation',
        bank: 'Test Bank'
      },
      {
        id: 4,
        date: '2023-01-25',
        description: 'Salary Payment',
        amount: '-2500.00',
        category: 'Payment',
        bank: 'Test Bank'
      },
      {
        id: 5,
        date: '2023-02-10',
        description: 'Online Purchase',
        amount: '89.99',
        category: 'Shopping',
        bank: 'Another Bank'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  it('processes complete data flow from API to charts', async () => {
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      });

    const { result } = renderHook(() => useParserData());

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.records.length).toBe(5);
    });

    // Verify data transformation
    expect(result.current.records[0].amount).toBe(12.99); // String converted to number
    expect(result.current.records[3].amount).toBe(-2500); // Negative payment

    // Test month filtering
    act(() => {
      result.current.setSelectedMonths(['01']); // Only January
    });

    await waitFor(() => {
      expect(result.current.sortedRecords.length).toBe(3); // Only January records
    });

    // Test bank filtering
    act(() => {
      result.current.setBankName('Test Bank');
    });

    await waitFor(() => {
      expect(result.current.sortedRecords.length).toBe(3); // January records from Test Bank
    });

    // Verify chart data generation
    expect(result.current.lineData.labels).toBeDefined();
    expect(result.current.lineData.datasets).toBeDefined();
    expect(result.current.pieData.labels).toBeDefined();
    expect(result.current.pieData.datasets).toBeDefined();

    // Verify financial metrics
    expect(result.current.totalAmount.totalPurchases).toBeDefined();
    expect(result.current.totalAmount.totalPayments).toBeDefined();
    expect(result.current.totalAmount.netSpending).toBeDefined();
  });

  it('handles sorting integration with data processing', async () => {
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      });

    const { result } = renderHook(() => useParserData());

    // Wait for initial data load
    await waitFor(() => {
      expect(result.current.records.length).toBe(5);
    });

    // Test sorting by amount
    act(() => {
      result.current.requestSort('amount');
    });

    await waitFor(() => {
      const amounts = result.current.sortedRecords.map(r => r.amount);
      expect(amounts[0]).toBeLessThan(amounts[amounts.length - 1]); // Ascending order
    });

    // Test sorting by date
    act(() => {
      result.current.requestSort('date');
    });

    await waitFor(() => {
      const dates = result.current.sortedRecords.map(r => r.date);
      expect(new Date(dates[0])).toBeLessThan(new Date(dates[dates.length - 1])); // Ascending order
    });
  });

  it('integrates upload flow with data processing', async () => {
    // Mock API responses for upload then data fetch
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      });

    const { result } = renderHook(() => useParserData());
    const mockCallback = vi.fn();

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.records.length).toBe(5);
    });

    // Simulate file upload
    const files = [new File(['test'], 'test.pdf', { type: 'application/pdf' })];
    
    await act(async () => {
      await result.current.uploadFiles(files, mockCallback);
    });

    // Verify upload callback was called
    expect(mockCallback).toHaveBeenCalledWith('Files uploaded successfully!');

    // Verify data was refetched after upload
    await waitFor(() => {
      expect(result.current.records.length).toBe(5);
    });

    // Verify all processing still works after upload
    expect(result.current.lineData.labels).toBeDefined();
    expect(result.current.pieData.labels).toBeDefined();
    expect(result.current.totalAmount.totalPurchases).toBeDefined();
  });

  it('handles error recovery in data processing flow', async () => {
    // Mock API failure then success
    fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsData)
      });

    const { result } = renderHook(() => useParserData());

    // Wait for error state
    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error);
    });

    // Verify error state doesn't break processing
    expect(result.current.records).toEqual([]);
    expect(result.current.sortedRecords).toEqual([]);

    // Retry and verify recovery
    await act(async () => {
      result.current.retryFetch();
    });

    await waitFor(() => {
      expect(result.current.error).toBe(null);
      expect(result.current.records.length).toBe(5);
    });

    // Verify processing works after recovery
    expect(result.current.lineData.labels).toBeDefined();
    expect(result.current.pieData.labels).toBeDefined();
  });

  it('validates data processing utility functions integration', () => {
    const records = [
      { id: 1, date: '2023-01-15', amount: 12.99, category: 'Food' },
      { id: 2, date: '2023-01-20', amount: 67.45, category: 'Food' },
      { id: 3, date: '2023-02-01', amount: 45.00, category: 'Transportation' },
      { id: 4, date: '2023-01-25', amount: -2500.00, category: 'Payment' }
    ];

    // Test chart data processing
    const chartResult = processChartData(records, ['01', '02']);
    expect(chartResult.lineData.labels).toHaveLength(4);
    expect(chartResult.sortedRecords).toHaveLength(4);

    // Test pie chart processing
    const pieResult = processPieChartData(records);
    expect(pieResult.labels).toEqual(['Food', 'Transportation']); // Payments excluded
    expect(pieResult.datasets[0].data).toEqual([80.44, 45.00]); // Summed amounts

    // Test financial metrics
    const metrics = calculateFinancialMetrics(records);
    expect(metrics.totalPurchases).toBe('$125.44');
    expect(metrics.totalPayments).toBe('$2,500.00');
    expect(metrics.netSpending).toBe('$2,374.56');
    expect(metrics.transactionCount).toBe(4);
    expect(metrics.purchaseCount).toBe(3);

    // Test sorting
    const sortedAsc = sortRecords(records, { key: 'amount', direction: 'ascending' });
    expect(sortedAsc[0].amount).toBe(-2500);
    expect(sortedAsc[sortedAsc.length - 1].amount).toBe(67.45);

    const sortedDesc = sortRecords(records, { key: 'amount', direction: 'descending' });
    expect(sortedDesc[0].amount).toBe(67.45);
    expect(sortedDesc[sortedDesc.length - 1].amount).toBe(-2500);

    // Test filtering
    const filtered = filterRecordsBySearch(records, 'food');
    expect(filtered).toHaveLength(2);
    expect(filtered.every(r => r.category === 'Food')).toBe(true);
  });

  it('handles bank name extraction and filtering', async () => {
    const bankData = {
      records: [
        { bank: 'Chase Bank' },
        { bank: 'Wells Fargo' },
        { bank: 'Chase Bank' }, // Duplicate
        { bank: 'Bank of America' },
        { bank: 'Wells Fargo' } // Duplicate
      ]
    };

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(bankData)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(bankData)
      });

    const { result } = renderHook(() => useParserData());

    // Wait for bank names to be extracted
    await waitFor(() => {
      expect(result.current.bankNames).toEqual(['Chase Bank', 'Wells Fargo', 'Bank of America']);
    });

    // Verify duplicates are removed and banks are sorted
    expect(result.current.bankNames).toHaveLength(3);
    expect(result.current.bankNames).toEqual(expect.arrayContaining(['Chase Bank', 'Wells Fargo', 'Bank of America']));
  });
});