import { useState, useCallback } from 'react';
import { API_URL } from '../constants/parserConstants';

export const useFileUpload = ({ onSuccess, onError, sessionId }) => {
  const [uploadStatus, setUploadStatus] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = useCallback((file) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['application/pdf'];
    
    if (!file) {
      throw new Error('No file provided');
    }
    
    if (file.size > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Only PDF files are allowed');
    }
    
    return true;
  }, []);

  const uploadFile = useCallback(async (file) => {
    try {
      validateFile(file);
      
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('session_id', sessionId);
      
      const response = await fetch(`${API_URL}/parse/`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
      onSuccess?.(result);
      
      return result;
    } catch (error) {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
      onError?.(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [validateFile, sessionId, onSuccess, onError]);

  const uploadFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return;
    
    const fileArray = Array.from(files);
    const uploadPromises = fileArray.map(file => uploadFile(file));
    
    try {
      const results = await Promise.allSettled(uploadPromises);
      return results;
    } catch (error) {
      console.error('Batch upload error:', error);
      throw error;
    }
  }, [uploadFile]);

  const retryUpload = useCallback(async (file) => {
    setUploadStatus(prev => ({ ...prev, [file.name]: 'pending' }));
    return uploadFile(file);
  }, [uploadFile]);

  const clearUploadStatus = useCallback(() => {
    setUploadStatus({});
  }, []);

  return {
    uploadStatus,
    isUploading,
    uploadFile,
    uploadFiles,
    retryUpload,
    clearUploadStatus,
    validateFile
  };
};