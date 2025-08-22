import React, { useState } from 'react';
import { getClassesByCategory, getClassesByFile } from '../../utils/cssParser';
// Import only transparent SVG assets for logos
import logo from '../../assets/logo.svg';
import lightIcon from '../../assets/light.svg';
import darkIcon from '../../assets/dark.svg';
import parserLogo from '../../assets/parser-logo.svg';
import errorIcon from '../../assets/error.svg';

// CSS Code data for classes - properly formatted
const CSS_CODE = {
  'theme-toggle': `.theme-toggle {
  background: var(--accent);
  border-radius: 8px;
  padding: 0.5rem;
  font-size: 1.2rem;
  font-family: 'Roboto Mono', monospace;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.theme-toggle:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}`,

  'my-button': `.my-button {
  background: var(--text-primary);
  color: var(--bg-card);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.my-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.my-button.secondary {
  background: var(--accent);
  color: var(--text-primary);
}

.my-button.outline {
  background: transparent;
  color: var(--text-primary);
  border: 2px solid var(--border);
}`,

  'my-nav': `.my-nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 0;
}`,

  'my-logo': `.my-logo {
  display: flex;
  align-items: center;
  gap: 5px;
}

.my-logo img {
  transition: transform 0.3s ease;
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.my-logo img:hover {
  animation: logo-rotate 10s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes logo-rotate {
  to {
    transform: rotate(-45deg);
  }
}`,

  'my-header': `.my-header {
  background-color: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(8px);
  transition: background-color 0.3s ease;
}`,

  'my-header-content': `.my-header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
}`
};

// Enhanced Code viewer component with syntax highlighting
const CodeViewer = ({ className, code, onClose }) => (
  <div className="code-viewer-overlay" onClick={onClose}>
    <div className="code-viewer-modal" onClick={e => e.stopPropagation()}>
      <div className="code-viewer-header">
        <h3>.{className}</h3>
        <button className="code-viewer-close" onClick={onClose}>×</button>
      </div>
      <div className="code-viewer-content">
        <pre className="css-code-block">
          <code className="css-code">{code}</code>
        </pre>
      </div>
    </div>
  </div>
);

// Visual class demonstration component with code viewer
const ClassDemo = ({ className, children, label }) => {
  const [showCode, setShowCode] = useState(false);
  const cssCode = CSS_CODE[className];

  return (
    <div className="class-demo">
      <div className="class-demo-visual">
        {children}
      </div>
      <div className="class-demo-label">
        <div className="class-demo-title">
          <code>.{className}</code>
          {cssCode && (
            <button 
              className="code-view-button" 
              onClick={() => setShowCode(true)}
              title="View CSS Code"
            >
              [{}]
            </button>
          )}
        </div>
        {label && <span className="demo-description">{label}</span>}
      </div>
      
      {showCode && cssCode && (
        <CodeViewer 
          className={className} 
          code={cssCode} 
          onClose={() => setShowCode(false)} 
        />
      )}
    </div>
  );
};

// Enhanced Button Showcase
export const ButtonShowcase = () => {
  return (
    <div className="showcase-container">
      <div className="showcase-grid">
        
        <ClassDemo className="theme-toggle" label="Theme toggle button">
          <button className="theme-toggle">
            <img src={lightIcon} alt="theme" width="20" height="20" />
          </button>
        </ClassDemo>

        <ClassDemo className="my-button" label="Primary button">
          <button className="my-button">Primary Button</button>
        </ClassDemo>

        <ClassDemo className="my-button secondary" label="Secondary button variant">
          <button className="my-button secondary">Secondary</button>
        </ClassDemo>

        <ClassDemo className="my-button outline" label="Outline button variant">
          <button className="my-button outline">Outline</button>
        </ClassDemo>

        <ClassDemo className="my-button disabled" label="Disabled state">
          <button className="my-button disabled" disabled>Disabled</button>
        </ClassDemo>

        <ClassDemo className="upload-dropzone" label="File upload area">
          <div className="upload-dropzone demo-upload">
            <div className="upload-icon">[FILE]</div>
            <span>Drop files here</span>
          </div>
        </ClassDemo>

        <ClassDemo className="clear-files-btn" label="Clear action button">
          <button className="clear-files-btn demo-clear-btn">Clear All</button>
        </ClassDemo>

        <ClassDemo className="game-button" label="Game interface button">
          <button className="game-button demo-game-btn">Start Game</button>
        </ClassDemo>

      </div>
    </div>
  );
};

// Enhanced Layout Showcase
export const LayoutShowcase = () => {
  return (
    <div className="showcase-container">
      <div className="showcase-section">

        <ClassDemo className="my-container" label="Main content container">
          <div className="my-container demo-container">
            <div className="demo-content">Container Content</div>
          </div>
        </ClassDemo>

        <ClassDemo className="my-section" label="Page section wrapper">
          <div className="my-section demo-section">
            <h3>Section Title</h3>
            <p>Section content goes here</p>
          </div>
        </ClassDemo>

        <ClassDemo className="my-grid" label="Basic responsive grid">
          <div className="my-grid demo-grid">
            <div className="demo-grid-item">Item 1</div>
            <div className="demo-grid-item">Item 2</div>
            <div className="demo-grid-item">Item 3</div>
          </div>
        </ClassDemo>

        <ClassDemo className="my-grid-2" label="2-column grid layout">
          <div className="my-grid-2 demo-grid">
            <div className="demo-grid-item">Column 1</div>
            <div className="demo-grid-item">Column 2</div>
          </div>
        </ClassDemo>

        <ClassDemo className="my-grid-3" label="3-column grid layout">
          <div className="my-grid-3 demo-grid">
            <div className="demo-grid-item">Col 1</div>
            <div className="demo-grid-item">Col 2</div>
            <div className="demo-grid-item">Col 3</div>
          </div>
        </ClassDemo>

        <ClassDemo className="centered-grid" label="Centered grid container">
          <div className="centered-grid demo-grid">
            <div className="demo-grid-item">Centered Item</div>
          </div>
        </ClassDemo>

        <ClassDemo className="game-layout-active" label="Game active layout">
          <div className="game-layout-active demo-game-layout">
            <div className="game-left-panel demo-panel">Sidebar</div>
            <div className="game-right-panel demo-panel">Main Content</div>
          </div>
        </ClassDemo>

      </div>
    </div>
  );
};

// Enhanced Card Showcase
export const CardShowcase = () => {
  return (
    <div className="showcase-container">
      <div className="showcase-grid">

        <ClassDemo className="my-card" label="Basic card component">
          <div className="my-card demo-card">
            <h3>Basic Card</h3>
            <p>Standard card with default styling</p>
          </div>
        </ClassDemo>

        <ClassDemo className="my-card elevated" label="Card with shadow elevation">
          <div className="my-card elevated demo-card">
            <h3>Elevated Card</h3>
            <p>Card with enhanced shadow depth</p>
          </div>
        </ClassDemo>

        <ClassDemo className="my-card outlined" label="Card with border outline">
          <div className="my-card outlined demo-card">
            <h3>Outlined Card</h3>
            <p>Card with visible border styling</p>
          </div>
        </ClassDemo>

        <ClassDemo className="pdf-thumbnail" label="PDF file preview card">
          <div className="pdf-thumbnail demo-pdf">
            <div className="pdf-icon">PDF</div>
            <div className="pdf-info">
              <span>document.pdf</span>
              <span>2.4 MB</span>
            </div>
          </div>
        </ClassDemo>

        <ClassDemo className="weather-card" label="Weather data display">
          <div className="weather-card demo-weather">
            <div className="weather-icon">☀️</div>
            <div className="weather-info">
              <h4>San Francisco</h4>
              <span>22°C</span>
            </div>
          </div>
        </ClassDemo>

        <ClassDemo className="game-card" label="Game interface card">
          <div className="game-card demo-game-card">
            <h4>Score Card</h4>
            <div className="score">1,250</div>
          </div>
        </ClassDemo>

      </div>
    </div>
  );
};

// Enhanced Typography Showcase
export const TypographyShowcase = () => {
  return (
    <div className="showcase-container">
      <div className="showcase-section">

        <ClassDemo className="my-section-title" label="Large section heading">
          <h1 className="my-section-title">Section Title</h1>
        </ClassDemo>

        <ClassDemo className="my-header" label="Page header style">
          <h2 className="my-header">Page Header</h2>
        </ClassDemo>

        <ClassDemo className="subsection-title" label="Subsection heading">
          <h3 className="subsection-title">Subsection Title</h3>
        </ClassDemo>

        <ClassDemo className="text-primary" label="Primary text color">
          <p className="text-primary">Primary text color for main content</p>
        </ClassDemo>

        <ClassDemo className="text-secondary" label="Secondary text color">
          <p className="text-secondary">Secondary text for supporting content</p>
        </ClassDemo>

        <ClassDemo className="text-muted" label="Muted text color">
          <p className="text-muted">Muted text for subtle information</p>
        </ClassDemo>

        <ClassDemo className="text-center" label="Center-aligned text">
          <p className="text-center">This text is center-aligned</p>
        </ClassDemo>

        <ClassDemo className="text-small" label="Small text size">
          <p className="text-small">Small text for fine print or captions</p>
        </ClassDemo>

      </div>
    </div>
  );
};

// Completely Fixed Navigation Showcase with working logo rotation
export const NavigationShowcase = () => {
  return (
    <div className="showcase-container">
      <div className="showcase-section">

        <ClassDemo className="my-nav" label="Navigation component">
          <div className="nav-demo-container">
            <div className="my-nav nav-demo">
              <a href="#" className="nav-item">Home</a>
              <a href="#" className="nav-item">About</a>
              <a href="#" className="nav-item">Contact</a>
            </div>
          </div>
        </ClassDemo>

        <ClassDemo className="my-logo" label="Logo container with rotation effect">
          <div className="logo-demo-container">
            <div className="my-logo logo-demo-working">
              <img src={logo} alt="Logo" />
              <span className="my-logo-text">Hover logo to rotate</span>
            </div>
          </div>
        </ClassDemo>

        <ClassDemo className="my-header" label="Page header wrapper">
          <div className="header-demo-container">
            <div className="my-header header-demo">
              <div className="my-header-content">
                <div className="my-logo logo-demo-working">
                  <img src={logo} alt="Main Logo" />
                  <span className="my-logo-text">Main Site</span>
                </div>
                <button className="theme-toggle">
                  <img src={lightIcon} alt="Theme" width="16" height="16" />
                </button>
              </div>
            </div>
          </div>
        </ClassDemo>

        <ClassDemo className="my-header-content" label="Header content wrapper">
          <div className="header-content-demo-container">
            <div className="my-header-content header-content-demo">
              <div className="my-logo logo-demo-working">
                <img src={parserLogo} alt="Parser" />
                <span className="my-logo-text">Parser Tool</span>
              </div>
              <button className="theme-toggle">
                <img src={lightIcon} alt="Theme" width="16" height="16" />
              </button>
            </div>
          </div>
        </ClassDemo>

      </div>
    </div>
  );
};

// Enhanced Animation Showcase
export const AnimationShowcase = () => {
  return (
    <div className="showcase-container">
      <div className="showcase-grid">

        <ClassDemo className="animate-fade-in-up" label="Fade in from bottom">
          <div className="animate-fade-in-up demo-animation">
            <div>Fade In Up Animation</div>
          </div>
        </ClassDemo>

        <ClassDemo className="loading-spinner" label="Loading spinner animation">
          <div className="demo-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        </ClassDemo>

        <ClassDemo className="hover-lift" label="Hover lift effect">
          <div className="hover-lift demo-animation">
            <div>Hover me to lift</div>
          </div>
        </ClassDemo>

        <ClassDemo className="uploading" label="Upload progress state">
          <div className="demo-card uploading">
            <span>Uploading file...</span>
          </div>
        </ClassDemo>

      </div>
    </div>
  );
};

// Enhanced Utilities Showcase
export const UtilitiesShowcase = () => {
  return (
    <div className="showcase-container">
      <div className="showcase-grid">

        <ClassDemo className="compact" label="Compact spacing modifier">
          <div className="demo-card compact">
            <span>Compact spacing</span>
          </div>
        </ClassDemo>

        <ClassDemo className="success" label="Success state styling">
          <div className="demo-card success">
            <span>✓ Success State</span>
          </div>
        </ClassDemo>

        <ClassDemo className="error" label="Error state styling">
          <div className="demo-card error">
            <span>✗ Error State</span>
          </div>
        </ClassDemo>

        <ClassDemo className="demo-label" label="Demo label styling">
          <div className="demo-label">Demo Label</div>
        </ClassDemo>

      </div>
    </div>
  );
};

// File-specific showcase component
export const FileShowcase = ({ fileName }) => {
  const fileClasses = getClassesByFile(fileName);
  
  if (!fileClasses || Object.keys(fileClasses).length === 0) {
    return (
      <div className="css-file-content">
        <p>No classes found for {fileName}.css</p>
      </div>
    );
  }
  
  return (
    <div className="file-showcase-container">
      {Object.entries(fileClasses).map(([category, classes]) => (
        <div key={category} className="file-category-section">
          <h4 className="file-category-title">{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
          <div className="file-class-list">
            {classes.map((cls, index) => (
              <div key={index} className="file-class-item">
                <code>.{cls.name}</code>
                <span className="class-description">{cls.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
