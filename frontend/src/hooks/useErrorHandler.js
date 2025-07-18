import { useState, useCallback } from 'react';

export const useErrorHandler = () => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = useCallback((error) => {
    console.error('Error caught:', error);
    setError(error);
    setIsLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const withErrorHandling = useCallback((asyncFunction) => {
    return async (...args) => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await asyncFunction(...args);
        setIsLoading(false);
        return result;
      } catch (error) {
        handleError(error);
        throw error;
      }
    };
  }, [handleError]);

  const retry = useCallback((retryFunction) => {
    clearError();
    return retryFunction();
  }, [clearError]);

  return {
    error,
    isLoading,
    handleError,
    clearError,
    withErrorHandling,
    retry
  };
};