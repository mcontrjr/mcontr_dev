import { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL, DEFAULT_SELECTED_MONTHS, SORT_DIRECTIONS } from '../constants/parserConstants';
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
  const [sessionId] = useState(getSessionId());
  const [bankName, setBankName] = useState('');
  const [bankNames, setBankNames] = useState([]);
  const [records, setRecords] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState(DEFAULT_SELECTED_MONTHS);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: SORT_DIRECTIONS.ASCENDING });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBankNames = useCallback(async () => {
    try {
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
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/records/?bank_name=${bankName}&session_id=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch records');
      }
      
      const data = await response.json();
      let fetchedRecords = data.records.map(record => ({
        ...record,
        amount: parseFloat(record.amount),
      }));

      if (selectedMonths.length > 0) {
        fetchedRecords = fetchedRecords.filter(record => 
          selectedMonths.includes(record.date.split('-')[1])
        );
      }

      setRecords(fetchedRecords);
    } catch (error) {
      console.error('Error fetching records:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  }, [bankName, selectedMonths, sessionId]);

  const uploadFiles = useCallback(async (files, onUploadMessage) => {
    if (files.length === 0) return;
    
    onUploadMessage(`Uploading ${files.length} file(s)...`);
    const formData = new FormData();
    
    // Add session_id first
    formData.append('session_id', sessionId);
    
    // Then add files
    for (let i = 0; i < files.length; i++) {
      formData.append('pdf_files', files[i]);
    }

    try {
      const response = await fetch(`${API_URL}/parse/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      await response.json();
      onUploadMessage(`Successfully uploaded ${files.length} file(s)! Switch to Analyze tab to view your data.`);
      
      await Promise.all([fetchRecords(), fetchBankNames()]);
    } catch (error) {
      console.error('Error uploading files:', error);
      onUploadMessage('Error uploading files. Please try again.');
    }
  }, [fetchRecords, fetchBankNames, sessionId]);

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
      setLoading(true);
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
      setSelectedMonths(DEFAULT_SELECTED_MONTHS);
      setSortConfig({ key: 'date', direction: SORT_DIRECTIONS.ASCENDING });
      
      // Refresh bank names (should be empty now)
      await fetchBankNames();
      
      return true; // Success
    } catch (error) {
      console.error('Error clearing data:', error);
      setError(error);
      return false; // Failure
    } finally {
      setLoading(false);
    }
  }, [fetchBankNames, sessionId]);

  useEffect(() => {
    fetchBankNames();
  }, [fetchBankNames]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords, sessionId]);

  const sortedRecords = useMemo(() => {
    return sortRecords(records, sortConfig);
  }, [records, sortConfig]);

  const chartData = useMemo(() => {
    if (records.length === 0) return { lineData: {}, pieData: {}, totalAmount: {} };

    const { lineData, sortedRecords: processedRecords } = processChartData(records, selectedMonths);
    const pieData = processPieChartData(processedRecords);
    const totalAmount = calculateFinancialMetrics(processedRecords);

    return { lineData, pieData, totalAmount };
  }, [records, selectedMonths]);

  return {
    // State
    bankName,
    bankNames,
    records,
    sortedRecords,
    selectedMonths,
    sortConfig,
    loading,
    error,
    ...chartData,
    
    // Actions
    setBankName,
    setSelectedMonths,
    requestSort,
    fetchRecords,
    fetchBankNames,
    uploadFiles,
    clearData,
    
    // Utilities
    retryFetch: () => {
      setError(null);
      fetchRecords();
    },
    
    // Session management
    sessionId
  };
};