import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL, SORT_DIRECTIONS } from '../constants/parserConstants';
import {
  processChartData,
  processPieChartData,
  calculateFinancialMetrics,
  sortRecords
} from '../utils/dataProcessing';

// Generate or retrieve session ID
const getSessionId = () => {
  let sessionId = localStorage.getItem('parser_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('parser_session_id', sessionId);
  }
  return sessionId;
};

export const useParserData = () => {
  const [sessionId, setSessionId] = useState(getSessionId());
  const [bankName, setBankName] = useState('');
  const [bankNames, setBankNames] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: SORT_DIRECTIONS.ASCENDING });

  // Granular loading states
  const [loadingStates, setLoadingStates] = useState({
    bankNames: false,
    records: false,
    charts: false,
    clearing: false
  });
  const [error, setError] = useState(null);

  // Cache for processed data to avoid recalculation
  const [dataCache, setDataCache] = useState({
    chartData: null,
    cacheKey: null
  });

  // Update sessionId helper
  const updateSessionId = useCallback((newSessionId) => {
    if (!newSessionId) return;
    setSessionId(newSessionId);
    localStorage.setItem('parser_session_id', newSessionId);
  }, []);

  // Update loading state helper
  const updateLoadingState = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const fetchBankNames = useCallback(async () => {
    try {
      updateLoadingState('bankNames', true);
      const response = await fetch(`${API_URL}/records/?session_id=${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch bank names');
      }

      const data = await response.json();
      const fetchedBankNames = [...new Set(data.records.map(record => record.bank))];
      setBankNames(fetchedBankNames);
    } catch (error) {
      console.error('Error fetching bank names:', error);
      setError(error);
    } finally {
      updateLoadingState('bankNames', false);
    }
  }, [sessionId, updateLoadingState]);

  const fetchRecords = useCallback(async () => {
    try {
      updateLoadingState('records', true);
      setError(null);

      const response = await fetch(`${API_URL}/records/?bank_name=${bankName}&session_id=${sessionId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }

      const data = await response.json();
      const fetchedRecords = data.records.map(record => ({
        ...record,
        amount: parseFloat(record.amount),
      }));

      setRecords(fetchedRecords);

      // Initialize selectedMonths with available months if not set yet
      if (selectedMonths.length === 0 && fetchedRecords.length > 0) {
        const availableMonths = [...new Set(fetchedRecords.map(record => record.date.split('-')[1]))];
        setSelectedMonths(availableMonths);
      }

      // Clear cache when records change
      setDataCache({ chartData: null, cacheKey: null });
    } catch (error) {
      console.error('Error fetching records:', error);
      setError(error);
    } finally {
      updateLoadingState('records', false);
    }
  }, [bankName, sessionId, selectedMonths, updateLoadingState]);

  const requestSort = useCallback((key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === SORT_DIRECTIONS.ASCENDING
        ? SORT_DIRECTIONS.DESCENDING
        : SORT_DIRECTIONS.ASCENDING
    }));
  }, []);

  const clearData = useCallback(async () => {
    try {
      updateLoadingState('clearing', true);
      setError(null);

      const formData = new FormData();
      formData.append('session_id', sessionId);

      const response = await fetch(`${API_URL}/clear/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to clear data');
      }

      // Reset all local state
      setRecords([]);
      setBankNames([]);
      setBankName('');
      setSelectedMonths([]);
      setSortConfig({ key: 'date', direction: SORT_DIRECTIONS.ASCENDING });
      setDataCache({ chartData: null, cacheKey: null });

      // Refresh bank names (should be empty now)
      await fetchBankNames();

      return true; // Success
    } catch (error) {
      console.error('Error clearing data:', error);
      setError(error);
      return false; // Failure
    } finally {
      updateLoadingState('clearing', false);
    }
  }, [fetchBankNames, sessionId, updateLoadingState]);

  useEffect(() => {
    fetchBankNames();
  }, [fetchBankNames]);

  useEffect(() => {
    fetchRecords();
  }, [bankName, sessionId]);

  // Optimized filtered records with caching
  const filteredRecords = useMemo(() => {
    // Always filter by selectedMonths if any are specified
    // If no months selected, show all records (this prevents lockout)
    if (selectedMonths.length === 0) return records;

    return records.filter(record =>
      selectedMonths.includes(record.date.split('-')[1])
    );
  }, [records, selectedMonths]);

  const sortedRecords = useMemo(() => {
    return sortRecords(filteredRecords, sortConfig);
  }, [filteredRecords, sortConfig]);

  // Optimized chart data with caching
  const chartData = useMemo(() => {
    if (filteredRecords.length === 0) {
      return { lineData: {}, pieData: {}, totalAmount: {} };
    }

    // Generate cache key based on relevant data
    const cacheKey = JSON.stringify({
      recordsLength: filteredRecords.length,
      recordsChecksum: filteredRecords.reduce((sum, r) => sum + r.amount, 0),
      selectedMonths: selectedMonths.sort(),
      bankName
    });

    // Return cached data if available and valid
    if (dataCache.cacheKey === cacheKey && dataCache.chartData) {
      return dataCache.chartData;
    }

    // Process new chart data
    updateLoadingState('charts', true);

    // Use setTimeout to allow UI to update with loading state
    setTimeout(() => {
      try {
        const { lineData, sortedRecords: processedRecords } = processChartData(filteredRecords, selectedMonths);
        const pieData = processPieChartData(processedRecords);
        const totalAmount = calculateFinancialMetrics(processedRecords);

        const newChartData = { lineData, pieData, totalAmount };

        // Cache the result
        setDataCache({
          chartData: newChartData,
          cacheKey
        });

        updateLoadingState('charts', false);
      } catch (error) {
        console.error('Error processing chart data:', error);
        updateLoadingState('charts', false);
      }
    }, 0);

    // Return loading state data while processing
    return dataCache.chartData || { lineData: {}, pieData: {}, totalAmount: {} };
  }, [filteredRecords, selectedMonths, bankName, dataCache, updateLoadingState]);

  // Aggregate loading state
  const isLoading = useMemo(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  return {
    // State
    bankName,
    bankNames,
    records: filteredRecords,
    sortedRecords,
    allRecords: records, // Expose unfiltered records for filter section logic
    selectedMonths,
    sortConfig,
    loading: loadingStates.records, // Main loading state for backwards compatibility
    loadingStates, // Granular loading states
    isLoading, // Combined loading state
    error,
    ...chartData,

    // Actions
    setBankName,
    setSelectedMonths,
    requestSort,
    fetchRecords,
    fetchBankNames,
    clearData,

    // Utilities
    retryFetch: () => {
      setError(null);
      fetchRecords();
    },

    // Session management
    sessionId,
    updateSessionId,
  };
};