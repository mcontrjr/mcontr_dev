import React, { useState, useRef, useEffect } from 'react';
import { getFormattedCSS } from '../../utils/cssParser';

/**
 * Terminal-style CSS editor inspired by MUI API documentation
 * Features live editing, syntax highlighting, and instant preview
 */
export const TerminalEditor = ({ className, initialCSS, onCSSChange, onClose }) => {
  const [css, setCSS] = useState(initialCSS || '');
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const textAreaRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (className && !initialCSS) {
      const parsedCSS = getFormattedCSS(className);
      if (parsedCSS) {
        // Clean up CSS when loading
        const cleanCSS = parsedCSS
          .replace(/\\n/g, '\n')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        setCSS(cleanCSS);
      }
    } else if (initialCSS) {
      // Clean up initial CSS
      const cleanCSS = initialCSS
        .replace(/\\n/g, '\n')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      setCSS(cleanCSS);
    }
  }, [className, initialCSS]);

  // Auto-resize textarea and real-time preview update
  useEffect(() => {
    if (textAreaRef.current && isEditing) {
      const textarea = textAreaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(200, textarea.scrollHeight) + 'px';
    }
    // Real-time preview update
    if (isEditing) {
      updatePreview();
    }
  }, [css, isEditing]);

  // Enhanced preview update function
  const updatePreview = () => {
    if (previewRef.current && css) {
      try {
        // Clean up excessive \n characters and format CSS
        const cleanCSS = css
          .replace(/\\n/g, '\n') // Replace \\n with actual newlines
          .replace(/\n\s*\n/g, '\n') // Remove extra blank lines
          .trim();
        
        // Create a style element for the preview
        const existingStyle = document.getElementById('terminal-preview-style');
        if (existingStyle) {
          existingStyle.remove();
        }

        const styleElement = document.createElement('style');
        styleElement.id = 'terminal-preview-style';
        styleElement.textContent = cleanCSS;
        document.head.appendChild(styleElement);
        
        setError('');
        if (onCSSChange) {
          onCSSChange(cleanCSS);
        }
      } catch (err) {
        setError('Invalid CSS syntax');
      }
    }
  };

  // Apply CSS to preview element with cleanup
  useEffect(() => {
    updatePreview();
    
    return () => {
      // Cleanup
      const existingStyle = document.getElementById('terminal-preview-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [css, onCSSChange]);

  const handleCSSChange = (e) => {
    const newCSS = e.target.value;
    // Clean up excessive \n characters in real-time
    const cleanedCSS = newCSS.replace(/\\n/g, '\n');
    setCSS(cleanedCSS);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(css);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const resetCSS = () => {
    if (className) {
      const originalCSS = getFormattedCSS(className);
      if (originalCSS) {
        // Clean up the original CSS
        const cleanCSS = originalCSS
          .replace(/\\n/g, '\n')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        setCSS(cleanCSS);
      }
    }
    setError('');
  };

  const applyCSS = () => {
    setIsEditing(false);
    if (onCSSChange) {
      onCSSChange(css);
    }
  };

  const toggleEdit = () => {
    if (isEditing) {
      // When exiting edit mode, apply and clean CSS
      const cleanCSS = css
        .replace(/\\n/g, '\n')
        .replace(/\n\s*\n/g, '\n')
        .trim();
      setCSS(cleanCSS);
      applyCSS();
    }
    setIsEditing(!isEditing);
  };

  return (
    <div className="terminal-editor">
      {/* Terminal Header */}
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="terminal-title">
            {className ? `.${className}` : 'CSS Editor'}
          </div>
        </div>
        <div className="terminal-actions">
          <button 
            className={`terminal-btn ${isEditing ? 'active' : ''}`}
            onClick={toggleEdit}
            title={isEditing ? 'Apply Changes' : 'Edit CSS'}
          >
            {isEditing ? '[ save ]' : '[ edit ]'}
          </button>
          <button 
            className="terminal-btn"
            onClick={copyToClipboard}
            title="Copy to Clipboard"
          >
            {copied ? '[ ✓ ]' : '[ copy ]'}
          </button>
          <button 
            className="terminal-btn"
            onClick={resetCSS}
            title="Reset to Original"
          >
            [ reset ]
          </button>
          {onClose && (
            <button 
              className="terminal-btn terminal-close"
              onClick={onClose}
              title="Close"
            >
              [ × ]
            </button>
          )}
        </div>
      </div>

      {/* Terminal Content */}
      <div className="terminal-content">
        {error && (
          <div className="terminal-error">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}

        {/* CSS Editor */}
        <div className="terminal-editor-section">
          {isEditing ? (
            <textarea
              ref={textAreaRef}
              value={css}
              onChange={handleCSSChange}
              className="terminal-textarea"
              spellCheck={false}
              autoFocus
              placeholder="Enter your CSS here..."
            />
          ) : (
            <pre className="terminal-code">
              <code>{css || '/* No CSS available */'}</code>
            </pre>
          )}
        </div>

        {/* Live Preview */}
        {className && (
          <div className="terminal-preview-section">
            <div className="terminal-preview-header">
              <span className="preview-label">[ live preview ]</span>
            </div>
            <div className="terminal-preview-content">
              <div 
                ref={previewRef}
                className={`terminal-preview-element ${className}`}
              >
                {className.includes('button') && 'Live Preview Button'}
                {className.includes('card') && (
                  <div>
                    <h4>Interactive Card</h4>
                    <p>Live preview showing your CSS modifications in real-time</p>
                    <div style={{marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: 'var(--accent)', borderRadius: '4px', fontSize: '0.8rem'}}>
                      Action
                    </div>
                  </div>
                )}
                {className.includes('grid') && (
                  <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(60px, 1fr))', gap: '0.5rem', width: '100%', maxWidth: '200px'}}>
                    <div className="preview-grid-item">A</div>
                    <div className="preview-grid-item">B</div>
                    <div className="preview-grid-item">C</div>
                    <div className="preview-grid-item">D</div>
                  </div>
                )}
                {className.includes('header') && (
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', width: '100%', maxWidth: '250px'}}>
                    <span style={{fontWeight: '600'}}>Logo</span>
                    <nav style={{display: 'flex', gap: '1rem', fontSize: '0.9rem'}}>
                      <span>Home</span>
                      <span>About</span>
                    </nav>
                  </div>
                )}
                {className.includes('hero') && (
                  <div style={{textAlign: 'center', padding: '1rem'}}>
                    <h3 style={{margin: '0 0 0.5rem 0'}}>Hero Section</h3>
                    <p style={{margin: 0, opacity: 0.8}}>Compelling content here</p>
                  </div>
                )}
                {(!className.includes('button') && !className.includes('card') && !className.includes('grid') && !className.includes('header') && !className.includes('hero')) && (
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
                    <code style={{background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.5rem', borderRadius: '3px'}}>
                      .{className}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Terminal Footer with CSS Info */}
      {className && (
        <div className="terminal-footer">
          <div className="css-info">
            <span className="info-label">Class:</span>
            <span className="info-value">.{className}</span>
            <span className="info-separator">|</span>
            <span className="info-label">Lines:</span>
            <span className="info-value">{css.split('\n').length}</span>
            <span className="info-separator">|</span>
            <span className="info-label">Status:</span>
            <span className={`info-value ${error ? 'error' : 'success'}`}>
              {error ? 'Error' : 'Valid'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Compact terminal-style code viewer (read-only)
 */
export const TerminalCodeViewer = ({ className, css, compact = false }) => {
  const [copied, setCopied] = useState(false);

  // Clean CSS for display
  const cleanCSS = css
    ? css.replace(/\\n/g, '\n').replace(/\n\s*\n/g, '\n').trim()
    : '/* No CSS available */';

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(cleanCSS);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`terminal-viewer ${compact ? 'compact' : ''}`}>
      <div className="terminal-header">
        <div className="terminal-controls">
          <div className="terminal-dots">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>
          <div className="terminal-title">
            {className ? `.${className}` : 'CSS Code'}
          </div>
        </div>
        <div className="terminal-actions">
          <button 
            className="terminal-btn"
            onClick={copyToClipboard}
            title="Copy to Clipboard"
          >
            {copied ? '[ ✓ ]' : '[ copy ]'}
          </button>
        </div>
      </div>
      <div className="terminal-content">
        <pre className="terminal-code">
          <code>{cleanCSS}</code>
        </pre>
      </div>
    </div>
  );
};

export default TerminalEditor;