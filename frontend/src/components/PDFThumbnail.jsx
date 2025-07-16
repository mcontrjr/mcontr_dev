import { useState } from 'react';

const PDFThumbnail = ({ file, onRemove, className = '' }) => {
  const [fileName, setFileName] = useState(file?.name || '');

  if (!file) return null;

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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
          <button 
            className="pdf-thumbnail-remove"
            onClick={onRemove}
            title="Remove file"
          >
            ×
          </button>
        </div>
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

export default PDFThumbnail;