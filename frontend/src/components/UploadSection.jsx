import { useState, useCallback } from 'react';
import PDFThumbnail from './PDFThumbnail';
import { API_URL } from '../constants/parserConstants';

const UploadSection = ({ onUploadComplete, uploadMessage, setUploadMessage }) => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Validate PDF files
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    if (pdfFiles.length !== files.length) {
      setUploadMessage('Please select only PDF files.');
      return;
    }

    // Add files to uploaded files list for thumbnail display
    setUploadedFiles(prev => [...prev, ...pdfFiles]);
    
    // Start upload process
    await uploadFiles(pdfFiles);
  }, []);

  const uploadFiles = async (files) => {
    try {
      setUploading(true);
      setUploadProgress(0);
      setUploadMessage(`Uploading ${files.length} file(s)...`);
      
      const formData = new FormData();
      files.forEach(file => {
        formData.append('pdf_files', file);
      });

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${API_URL}/parse/`, {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      setUploadMessage(`Successfully uploaded ${files.length} file(s)! Scroll down to view your data.`);
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete(data);
      }
      
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadMessage('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 2000);
    }
  };

  const removeFile = useCallback((indexToRemove) => {
    setUploadedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  }, []);

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
        <h2>Upload Statements</h2>
      </div>

      <div 
        className={`upload-dropzone compact ${uploading ? 'uploading' : ''}`}
        onClick={handleDropZoneClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
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

      {uploadMessage && (
        <div className={`upload-message compact ${uploadMessage.includes('Error') ? 'error' : 'success'}`}>
          {uploadMessage}
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div className="uploaded-files-section compact">
          <div className="uploaded-files-header">
            <span className="files-count">{uploadedFiles.length} file(s) uploaded</span>
            <button 
              className="clear-files-btn"
              onClick={() => setUploadedFiles([])}
              title="Clear all files"
            >
              Clear
            </button>
          </div>
          <div className="uploaded-files-list">
            {uploadedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="file-item">
                <div className="file-info">
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
                <button 
                  className="remove-file-btn"
                  onClick={() => removeFile(index)}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default UploadSection;