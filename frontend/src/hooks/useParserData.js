import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { API_URL, SORT_DIRECTIONS, PARSER_MOCK } from '../constants/parserConstants';
import { sortRecords } from '../utils/dataProcessing';
import mockData from '../../mock/mock_parser.json';

const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

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

  // Backend-computed data
  const [lineData, setLineData] = useState({});
  const [pieData, setPieData] = useState({});
  const [weeklyData, setWeeklyData] = useState({});
  const [metrics, setMetrics] = useState({});
  const [availableMonths, setAvailableMonths] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Category management
  const [categories, setCategories] = useState({});
  const [sessionOverrides, setSessionOverrides] = useState({});

  // Granular loading states
  const [loadingStates, setLoadingStates] = useState({
    bankNames: false,
    records: false,
    charts: false,
    clearing: false
  });
  const [error, setError] = useState(null);

  // Refs for managing fetch lifecycle
  const monthDebounceRef = useRef(null);
  const hasInitializedMonths = useRef(false);
  const cacheRef = useRef({});

  const getCacheKey = useCallback((bank, months) =>
    `${sessionId}:${bank}:${[...months].sort().join(',')}`,
  [sessionId]);

  const isCacheValid = useCallback((key) => {
    const cached = cacheRef.current[key];
    return cached && (Date.now() - cached.timestamp) < CACHE_TTL;
  }, []);

  // Update sessionId helper
  const updateSessionId = useCallback((newSessionId) => {
    if (!newSessionId) return;
    setSessionId(newSessionId);
    localStorage.setItem('parser_session_id', newSessionId);
    hasInitializedMonths.current = false;
    cacheRef.current = {};
  }, []);

  // Update loading state helper
  const updateLoadingState = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyData = useCallback((data) => {
    const fetchedRecords = data.records.map(record => ({
      ...record,
      amount: parseFloat(record.amount),
    }));
    setRecords(fetchedRecords);
    setLineData(data.charts.lineData);
    setPieData(data.charts.pieData);
    setWeeklyData(data.charts.weeklyData);
    setMetrics(data.metrics);
    setBankNames(data.availableBanks);
    setAvailableMonths(data.availableMonths);
    if (data.monthly_income != null) {
      setMonthlyIncome(data.monthly_income);
    }
    setLastUpdated(Date.now());
  }, []);

  const fetchRecords = useCallback(async (monthsOverride, forceRefresh = false) => {
    try {
      updateLoadingState('records', true);
      updateLoadingState('charts', true);
      setError(null);

      const monthsToSend = monthsOverride !== undefined ? monthsOverride : selectedMonths;

      if (PARSER_MOCK) {
        const filteredMockRecords = bankName
          ? mockData.records.filter(record => record.bank === bankName)
          : mockData.records;

        const fetchedRecords = filteredMockRecords.map(record => ({
          ...record,
          amount: parseFloat(record.amount),
        }));

        setRecords(fetchedRecords);

        if (!hasInitializedMonths.current && fetchedRecords.length > 0) {
          const avail = [...new Set(fetchedRecords.map(record => record.date.split('-')[1]))];
          setSelectedMonths(avail);
          setAvailableMonths(avail);
          hasInitializedMonths.current = true;
        }
        return;
      }

      const cacheKey = getCacheKey(bankName, monthsToSend);
      if (!forceRefresh && isCacheValid(cacheKey)) {
        applyData(cacheRef.current[cacheKey].data);
        return;
      }

      const body = { session_id: sessionId };
      if (bankName) body.bank_name = bankName;
      if (monthsToSend.length > 0) body.months = monthsToSend;

      const response = await fetch(`${API_URL}/records/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }

      const data = await response.json();

      cacheRef.current[cacheKey] = { data, timestamp: Date.now() };
      applyData(data);

      // Initialize selectedMonths on first load only
      if (!hasInitializedMonths.current && monthsToSend.length === 0 && data.availableMonths.length > 0) {
        setSelectedMonths(data.availableMonths);
        hasInitializedMonths.current = true;
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      setError(error);
    } finally {
      updateLoadingState('records', false);
      updateLoadingState('charts', false);
    }
  }, [bankName, sessionId, selectedMonths, updateLoadingState, getCacheKey, isCacheValid, applyData]);

  const hardReload = useCallback(() => {
    cacheRef.current = {};
    fetchRecords(selectedMonths, true);
  }, [fetchRecords, selectedMonths]);

  const requestSort = useCallback((key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === SORT_DIRECTIONS.ASCENDING
        ? SORT_DIRECTIONS.DESCENDING
        : SORT_DIRECTIONS.ASCENDING
    }));
  }, []);

  // Update record — re-fetch from backend to get updated charts/metrics
  const updateRecord = useCallback(() => {
    fetchRecords(selectedMonths, true);
  }, [fetchRecords, selectedMonths]);

  const saveMonthlyIncome = useCallback(async (income) => {
    try {
      const response = await fetch(`${API_URL}/session/income/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, monthly_income: income }),
      });
      if (!response.ok) throw new Error('Failed to save income');
      setMonthlyIncome(income);
      // Invalidate cache so next fetch includes income
      cacheRef.current = {};
    } catch (error) {
      console.error('Error saving income:', error);
    }
  }, [sessionId]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/categories/?session_id=${encodeURIComponent(sessionId)}`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();
      setCategories(data.categories);
      setSessionOverrides(data.session_overrides);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, [sessionId]);

  const upsertCategory = useCallback(async (categoryName, keywords) => {
    try {
      const response = await fetch(`${API_URL}/categories/${encodeURIComponent(categoryName)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, keywords }),
      });
      if (!response.ok) throw new Error('Failed to update category');
      await fetchCategories();
      cacheRef.current = {};
      await fetchRecords(selectedMonths, true);
    } catch (err) {
      console.error('Error upserting category:', err);
    }
  }, [sessionId, fetchCategories, fetchRecords, selectedMonths]);

  const deleteCategory = useCallback(async (categoryName) => {
    try {
      const response = await fetch(`${API_URL}/categories/${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      if (!response.ok) throw new Error('Failed to delete category');
      await fetchCategories();
      cacheRef.current = {};
      await fetchRecords(selectedMonths, true);
    } catch (err) {
      console.error('Error deleting category:', err);
    }
  }, [sessionId, fetchCategories, fetchRecords, selectedMonths]);

  const clearData = useCallback(async () => {
    try {
      updateLoadingState('clearing', true);
      setError(null);

      const response = await fetch(`${API_URL}/clear/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to clear data');
      }

      // Reset all local state
      setRecords([]);
      setBankNames([]);
      setBankName('');
      setSelectedMonths([]);
      setAvailableMonths([]);
      setSortConfig({ key: 'date', direction: SORT_DIRECTIONS.ASCENDING });
      setLineData({});
      setPieData({});
      setWeeklyData({});
      setMetrics({});
      setMonthlyIncome(null);
      setLastUpdated(null);
      hasInitializedMonths.current = false;
      cacheRef.current = {};

      return true; // Success
    } catch (error) {
      console.error('Error clearing data:', error);
      setError(error);
      return false; // Failure
    } finally {
      updateLoadingState('clearing', false);
    }
  }, [sessionId, updateLoadingState]);

  useEffect(() => {
    hasInitializedMonths.current = false;
    fetchRecords();
    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankName, sessionId]);

  // Debounced re-fetch when selectedMonths changes — skip during initial month population
  useEffect(() => {
    if (availableMonths.length === 0) return;
    // Skip if this change was the initialization itself
    if (!hasInitializedMonths.current) return;

    if (monthDebounceRef.current) {
      clearTimeout(monthDebounceRef.current);
    }
    monthDebounceRef.current = setTimeout(() => {
      fetchRecords(selectedMonths);
    }, 300);

    return () => {
      if (monthDebounceRef.current) {
        clearTimeout(monthDebounceRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonths]);

  const sortedRecords = useMemo(() => {
    return sortRecords(records, sortConfig);
  }, [records, sortConfig]);

  // Aggregate loading state
  const isLoading = useMemo(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  return {
    // State
    bankName,
    bankNames,
    records,
    sortedRecords,
    allRecords: records,
    selectedMonths,
    sortConfig,
    loading: loadingStates.records,
    loadingStates,
    isLoading,
    error,
    lineData,
    pieData,
    weeklyData,
    metrics,
    availableMonths,
    totalAmount: metrics, // backwards compat alias
    monthlyIncome,
    lastUpdated,

    // Category management
    categories,
    sessionOverrides,
    fetchCategories,
    upsertCategory,
    deleteCategory,

    // Actions
    setBankName,
    setSelectedMonths,
    requestSort,
    fetchRecords,
    clearData,
    updateRecord,
    hardReload,
    saveMonthlyIncome,

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
