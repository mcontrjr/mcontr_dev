/* eslint-disable react/prop-types, no-unused-vars */
import { useState, useCallback } from 'react';
import { API_URL } from '../../constants/parserConstants';
import { SupportedBanks } from './ParserComponents';

// Integrated PDFThumbnail component with upload status
const PDFThumbnail = ({ file, onRemove, onRetry, status = 'pending', className = '' }) => {
  const [fileName, setFileName] = useState(file?.name || '');

  if (!file) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'uploading':
        return { text: 'Uploading...', className: 'uploading' };
      case 'success':
        return { text: 'Uploaded', className: 'success' };
      case 'error':
        return { text: 'Failed', className: 'error' };
      default:
        return null; // No badge for pending/ready state
    }
  };

  const badge = getStatusBadge();

  return (
    <div className={`pdf-thumbnail ${className}`}>
      <div className="pdf-thumbnail-container">
        <div className="pdf-thumbnail-preview">
          <div className="pdf-icon">
            <span className="pdf-icon-text">PDF</span>
          </div>
          <div className="pdf-preview-text">
            <span>Preview</span>
            <span>Not Available</span>
          </div>
        </div>

        <div className="pdf-thumbnail-overlay">
          {status === 'error' && onRetry && (
            <button
              className="pdf-thumbnail-retry"
              onClick={onRetry}
              title="Retry upload"
            >
              ↻
            </button>
          )}
          <button
            className="pdf-thumbnail-remove"
            onClick={onRemove}
            title="Remove file"
          >
            ×
          </button>
        </div>

        {badge && (
          <div className={`upload-status-badge ${badge.className}`}>
            {status === 'uploading' && <div className="status-spinner"></div>}
            <span>{badge.text}</span>
          </div>
        )}
      </div>

      <div className="pdf-thumbnail-info">
        <span className="pdf-thumbnail-name" title={fileName}>
          {fileName.length > 20 ? `${fileName.substring(0, 17)}...` : fileName}
        </span>
        <span className="pdf-thumbnail-size">
          {formatFileSize(file.size)}
        </span>
      </div>
    </div>
  );
};

const UploadSection = ({ onUploadComplete, uploadMessage, setUploadMessage, sessionId }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileStatuses, setFileStatuses] = useState({});

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate PDF files
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length !== files.length) {
      setUploadMessage('Please select only PDF files.');
      return;
    }

    // Add files to uploaded files list
    setUploadedFiles(prev => {
      const newFiles = [...prev, ...pdfFiles];

      // Initialize file statuses for new files only
      const newStatuses = {};
      pdfFiles.forEach((file, index) => {
        const fileKey = `${file.name}-${prev.length + index}`;
        newStatuses[fileKey] = 'pending'; // Start with pending instead of ready
      });
      setFileStatuses(prevStatuses => ({ ...prevStatuses, ...newStatuses }));

      return newFiles;
    });

    // Start upload process
    await uploadFiles(pdfFiles);
  }, []);

  const uploadFiles = async (files) => {
    setUploading(true);
    setUploadProgress(0);
    setUploadMessage(`Uploading ${files.length} file(s)...`);

    let successCount = 0;
    let errorCount = 0;
    const totalFiles = files.length;

    // Set all files to uploading status first
    setUploadedFiles(currentFiles => {
      const uploadingStatuses = {};
      files.forEach((file, index) => {
        const fileKey = `${file.name}-${currentFiles.length - files.length + index}`;
        uploadingStatuses[fileKey] = 'uploading';
      });
      setFileStatuses(prev => ({ ...prev, ...uploadingStatuses }));
      return currentFiles;
    });

    // Upload each file individually
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileIndex = i;

      // Update progress message for current file
      setUploadMessage(`Uploading ${file.name} (${i + 1} of ${totalFiles})...`);

      try {
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('pdf_files', file);

        const response = await fetch(`${API_URL}/parse/`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const data = await response.json();
        successCount++;

        // Update individual file status to success
        setUploadedFiles(currentFiles => {
          const fileKey = `${file.name}-${currentFiles.length - files.length + fileIndex}`;
          setFileStatuses(prev => ({ ...prev, [fileKey]: 'success' }));
          return currentFiles;
        });

      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        errorCount++;

        // Update individual file status to error
        setUploadedFiles(currentFiles => {
          const fileKey = `${file.name}-${currentFiles.length - files.length + fileIndex}`;
          setFileStatuses(prev => ({ ...prev, [fileKey]: 'error' }));
          return currentFiles;
        });
      }

      // Update progress
      const progress = Math.round(((i + 1) / totalFiles) * 100);
      setUploadProgress(progress);
    }

    // Final status message
    if (successCount === totalFiles) {
      setUploadMessage(`Successfully uploaded all ${totalFiles} file(s)! Scroll down to view your data.`);
      // Notify parent component only if we have some successful uploads
      if (onUploadComplete) {
        onUploadComplete({});
      }
    } else if (successCount > 0) {
      setUploadMessage(`Uploaded ${successCount} of ${totalFiles} file(s). ${errorCount} file(s) failed.`);
      // Still notify parent component for partial success
      if (onUploadComplete) {
        onUploadComplete({});
      }
    } else {
      setUploadMessage(`Failed to upload any files. Please check your files and try again.`);
    }

    setUploading(false);
    setTimeout(() => setUploadProgress(0), 3000);
  };

  const removeFile = useCallback((indexToRemove) => {
    setUploadedFiles(prev => {
      const fileToRemove = prev[indexToRemove];
      const fileKey = `${fileToRemove.name}-${indexToRemove}`;

      // Clean up file status
      setFileStatuses(prevStatuses => {
        const newStatuses = { ...prevStatuses };
        delete newStatuses[fileKey];
        return newStatuses;
      });

      return prev.filter((_, index) => index !== indexToRemove);
    });
  }, []);

  const retryFile = useCallback(async (fileIndex) => {
    const file = uploadedFiles[fileIndex];
    if (!file) return;

    const fileKey = `${file.name}-${fileIndex}`;

    // Set file status to uploading
    setFileStatuses(prev => ({ ...prev, [fileKey]: 'uploading' }));
    setUploadMessage(`Retrying upload for ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      formData.append('pdf_files', file);

      const response = await fetch(`${API_URL}/parse/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Retry failed for ${file.name}`);
      }

      const data = await response.json();

      // Update file status to success
      setFileStatuses(prev => ({ ...prev, [fileKey]: 'success' }));
      setUploadMessage(`Successfully retried upload for ${file.name}!`);

      // Refresh data if this was a successful retry
      if (onUploadComplete) {
        onUploadComplete(data);
      }

    } catch (error) {
      console.error(`Error retrying ${file.name}:`, error);
      setFileStatuses(prev => ({ ...prev, [fileKey]: 'error' }));
      setUploadMessage(`Retry failed for ${file.name}. Please try again.`);
    }
  }, [uploadedFiles, onUploadComplete]);

  const handleDropZoneClick = () => {
    document.getElementById('fileInput').click();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const event = { target: { files } };
    handleFileSelect(event);
  };

  return (
    <section className="upload-section compact">
      <div className="upload-section-header compact">
        <h2>Upload Center</h2>
      </div>

      <div
        className={`upload-dropzone compact ${uploading ? 'uploading' : ''}`}
        onClick={handleDropZoneClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-test-id="upload-dropzone"
      >
        <input
          type="file"
          id="fileInput"
          multiple
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          disabled={uploading}
        />

        <div className="upload-dropzone-content">
          {uploading ? (
            <>
              <div className="upload-spinner"></div>
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <div className="upload-icon">[PDF]</div>
              <span>Drop files here or click to browse</span>
            </>
          )}
        </div>

        {uploading && uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="upload-progress-bar">
              <div
                className="upload-progress-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <span className="upload-progress-text">{uploadProgress}%</span>
          </div>
        )}
      </div>


      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-section compact">
          <div className="uploaded-files-header">
            <span className="files-count">{uploadedFiles.length} file(s) selected</span>
            <button
              className="clear-files-btn"
              onClick={() => {
                setUploadedFiles([]);
                setFileStatuses({});
              }}
              title="Clear all files"
            >
              Clear All
            </button>
          </div>
          <div className="uploaded-files-grid">
            {uploadedFiles.map((file, index) => {
              const fileKey = `${file.name}-${index}`;
              const status = fileStatuses[fileKey] || 'pending';

              return (
                <PDFThumbnail
                  key={fileKey}
                  file={file}
                  status={status}
                  onRemove={() => removeFile(index)}
                  onRetry={() => retryFile(index)}
                  className="uploaded-file-thumbnail"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Compact Supported Banks Section */}
      <div className="supported-banks-compact">
        <SupportedBanks />
      </div>
    </section>
  );
};

export default UploadSection;