import { memo, useCallback, useState } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';

const FileUploadZone = memo(({ onSuccess, onError, sessionId, accept = '.pdf' }) => {
  const [dragActive, setDragActive] = useState(false);
  const { uploadFiles, uploadStatus, isUploading } = useFileUpload({
    onSuccess,
    onError,
    sessionId
  });

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  }, [uploadFiles]);

  const handleFileSelect = useCallback((e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadFiles(files);
    }
  }, [uploadFiles]);

  return (
    <div
      className={`file-upload-zone ${dragActive ? 'active' : ''} ${isUploading ? 'uploading' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        multiple
        className="file-input"
        id="file-upload"
      />
      <label htmlFor="file-upload" className="file-upload-label">
        <div className="upload-icon">📁</div>
        <div className="upload-text">
          <strong>Click to select files</strong> or drag and drop
        </div>
        <div className="upload-subtext">
          PDF files only, max 10MB each
        </div>
      </label>
      
      {Object.keys(uploadStatus).length > 0 && (
        <div className="upload-status">
          {Object.entries(uploadStatus).map(([filename, status]) => (
            <div key={filename} className={`upload-item ${status}`}>
              <span className="filename">{filename}</span>
              <span className="status">{status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

FileUploadZone.displayName = 'FileUploadZone';

export default FileUploadZone;