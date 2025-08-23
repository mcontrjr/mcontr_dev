import React, { useState, useEffect } from 'react';
import { getCSSParser, getFormattedCSS, getClassInfo } from '../../utils/cssParser';
import { TerminalEditor, TerminalCodeViewer } from './TerminalEditor';
import './library.css'; // Import consolidated library styles
import logo from '../../assets/logo.svg';
import lightIcon from '../../assets/light.svg';
import darkIcon from '../../assets/dark.svg';

/**
 * Enhanced CSS Showcase with MUI-inspired API documentation
 * Features dynamic CSS parsing, interactive editing, and comprehensive documentation
 */

// Terminal-style icons and category icons
const ICONS = {
  code: '[</>]',
  copy: '[cp]',
  close: '[×]',
  edit: '[edit]',
  preview: '[👁]',
  api: '[api]',
  search: '[🔍]',
  layout: '🏗️',
  button: '🔘',
  card: '🗃️',
  nav: '🧭',
  hero: '⭐',
  interactive: '🖱️',
  animation: '✨',
  text: '📝',
  form: '📋',
  media: '🖼️',
  terminal: '💻',
  utility: '🔧'
};

// Category icons mapping
const CATEGORY_ICONS = {
  'Layout & Grid': ICONS.layout,
  'Buttons & Controls': ICONS.button,
  'Cards & Surfaces': ICONS.card,
  'Navigation & Headers': ICONS.nav,
  'Hero Sections': ICONS.hero,
  'Interactive & States': ICONS.interactive,
  'Animations & Effects': ICONS.animation,
  'Typography & Text': ICONS.text,
  'Forms & Tables': ICONS.form,
  'Media & Images': ICONS.media,
  'Terminal & Editor': ICONS.terminal,
  'Utilities & Spacing': ICONS.utility
};

// Comprehensive categories for complete showcase
const FEATURED_CATEGORIES = [
  'Layout & Grid',
  'Buttons & Controls', 
  'Cards & Surfaces',
  'Navigation & Headers',
  'Hero Sections',
  'Interactive & States',
  'Animations & Effects',
  'Typography & Text',
  'Forms & Tables',
  'Media & Images',
  'Terminal & Editor',
  'Utilities & Spacing'
];

/**
 * MUI-inspired API documentation table
 */
const APITable = ({ classInfo }) => {
  if (!classInfo) return null;

  const { properties, pseudoClasses, dependencies, selectors } = classInfo;

  return (
    <div className="api-table-container">
      <h4 className="api-table-title">API Reference</h4>
      
      {/* Properties Table */}
      <div className="api-section">
        <h5 className="api-section-title">CSS Properties</h5>
        <table className="api-table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {properties.map(prop => (
              <tr key={prop}>
                <td><code>{prop}</code></td>
                <td>{getCSSPropertyType(prop)}</td>
                <td>{getCSSPropertyDescription(prop)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pseudo-classes */}
      {pseudoClasses.length > 0 && (
        <div className="api-section">
          <h5 className="api-section-title">States & Pseudo-classes</h5>
          <div className="api-badges">
            {pseudoClasses.map(pseudo => (
              <span key={pseudo} className="api-badge pseudo-badge">:{pseudo}</span>
            ))}
          </div>
        </div>
      )}

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div className="api-section">
          <h5 className="api-section-title">CSS Variables Used</h5>
          <div className="api-badges">
            {dependencies.map(dep => (
              <span key={dep} className="api-badge dep-badge">{dep}</span>
            ))}
          </div>
        </div>
      )}

      {/* Selectors */}
      <div className="api-section">
        <h5 className="api-section-title">Selectors</h5>
        <div className="selector-list">
          {selectors.map((selector, index) => (
            <code key={index} className="selector-code">{selector}</code>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced showcase card with terminal editor integration
 */
const EnhancedShowcaseCard = ({ className, classInfo, onOpenEditor }) => {
  const [showAPI, setShowAPI] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyClassName = async () => {
    try {
      await navigator.clipboard.writeText(className);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy class name: ', err);
    }
  };

  const renderPreview = () => {
    // Enhanced dynamic preview with more comprehensive examples
    if (className.includes('button') || className.includes('btn')) {
      return <button className={className}>Sample Button</button>;
    }
    
    if (className.includes('card')) {
      return (
        <div className={className}>
          <h4>Preview Card</h4>
          <p>Interactive card with hover effects and modern styling.</p>
          <div className="preview-actions">
            <span>Learn More</span>
          </div>
        </div>
      );
    }
    
    if (className.includes('grid') || className.includes('container')) {
      return (
        <div className={className} style={{minHeight: '120px', maxWidth: '320px'}}>
          <div className="preview-grid-item">Grid Item 1</div>
          <div className="preview-grid-item">Grid Item 2</div>
          <div className="preview-grid-item">Grid Item 3</div>
          <div className="preview-grid-item">Grid Item 4</div>
        </div>
      );
    }

    if (className.includes('logo')) {
      return (
        <div className={className}>
          <img src={logo} alt="Brand Logo" style={{width: '32px', height: '32px'}} />
          <span>Brand</span>
        </div>
      );
    }

    if (className.includes('header') || className.includes('nav')) {
      return (
        <div className={className} style={{width: '100%', maxWidth: '300px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span>Brand</span>
            <nav style={{display: 'flex', gap: '1rem'}}>
              <span>Home</span>
              <span>About</span>
            </nav>
          </div>
        </div>
      );
    }

    if (className.includes('hero')) {
      return (
        <div className={className} style={{padding: '2rem', maxWidth: '300px', textAlign: 'center'}}>
          <h3>Hero Title</h3>
          <p>Compelling hero section content</p>
        </div>
      );
    }

    if (className.includes('table')) {
      return (
        <div className={className} style={{maxWidth: '300px'}}>
          <table style={{width: '100%', fontSize: '0.8rem'}}>
            <thead>
              <tr><th>Name</th><th>Value</th></tr>
            </thead>
            <tbody>
              <tr><td>Item 1</td><td>100</td></tr>
              <tr><td>Item 2</td><td>200</td></tr>
            </tbody>
          </table>
        </div>
      );
    }

    if (className.includes('input') || className.includes('search')) {
      return (
        <div style={{width: '100%', maxWidth: '250px'}}>
          <input className={className} placeholder="Search..." readOnly />
        </div>
      );
    }

    if (className.includes('spinner') || className.includes('loading')) {
      return <div className={className} style={{width: '40px', height: '40px'}}></div>;
    }

    if (className.includes('title') || className.includes('heading')) {
      return <h2 className={className}>Sample Heading</h2>;
    }

    if (className.includes('text-')) {
      return <p className={className}>Sample text with styling applied</p>;
    }

    if (className.includes('footer')) {
      return (
        <div className={className} style={{width: '100%', maxWidth: '300px', textAlign: 'center'}}>
          <p style={{margin: 0, fontSize: '0.8rem'}}>© 2024 Brand Name</p>
        </div>
      );
    }

    if (className.includes('theme-toggle') || className.includes('toggle')) {
      return (
        <button className={className} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
          {document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙'}
        </button>
      );
    }

    if (className.includes('img') || className.includes('image')) {
      return (
        <div className={className}>
          <img src={logo} alt="Sample" style={{width: '64px', height: '64px', objectFit: 'cover'}} />
        </div>
      );
    }

    if (className.includes('terminal') || className.includes('editor')) {
      return (
        <div className={className} style={{maxWidth: '280px', fontFamily: 'monospace'}}>
          <div style={{background: '#2d2d2d', color: '#fff', padding: '0.5rem', fontSize: '0.8rem'}}>
            <span style={{color: '#569cd6'}}>$</span> npm install awesome-css
          </div>
        </div>
      );
    }

    // Default preview with enhanced styling
    return (
      <div className={className} style={{
        padding: '1rem', 
        minHeight: '60px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-secondary, #f8f9fa)',
        borderRadius: '6px',
        border: '1px solid var(--border, #dee2e6)',
        fontSize: '0.9rem',
        color: 'var(--text-primary)'
      }}>
        <code style={{background: 'var(--accent)', padding: '0.2rem 0.4rem', borderRadius: '3px'}}>
          .{className}
        </code>
      </div>
    );
  };

  return (
    <div className="enhanced-showcase-card">
      {/* Card Header */}
      <div className="card-header">
        <div className="class-info">
          <h3 className="class-name" onClick={copyClassName} title="Click to copy class name">
            .{className}
            {copied && <span className="copy-feedback">Copied!</span>}
          </h3>
          <p className="class-description">{classInfo?.usage || 'CSS component for styling elements'}</p>
        </div>
        <div className="card-actions">
          <button 
            className="action-btn"
            onClick={() => setShowAPI(!showAPI)}
            title="Toggle API Documentation"
          >
            {ICONS.api}
          </button>
          <button 
            className="action-btn"
            onClick={() => onOpenEditor(className, classInfo)}
            title="Open Terminal Editor"
          >
            {ICONS.edit}
          </button>
        </div>
      </div>

      {/* Live Preview */}
      <div className="card-preview">
        <div className="preview-label">Live Preview</div>
        <div className="preview-container">
          {renderPreview()}
        </div>
      </div>

      {/* Compact CSS View */}
      <div className="card-css">
        <TerminalCodeViewer 
          className={className}
          css={classInfo?.css || `/* CSS for .${className} */`}
          compact={true}
        />
      </div>

      {/* HTML Usage Examples */}
      <div className="card-usage">
        <div className="usage-label">HTML Usage</div>
        <div className="usage-examples">
          {getUsageExamples(className)}
        </div>
      </div>

      {/* API Documentation (Expandable) */}
      {showAPI && (
        <div className="card-api">
          <APITable classInfo={classInfo} />
        </div>
      )}
    </div>
  );
};

/**
 * Search and filter component
 */
const SearchFilter = ({ searchTerm, onSearchChange, selectedCategory, onCategoryChange, categories }) => {
  return (
    <div className="search-filter">
      <div className="search-input-container">
        <span className="search-icon">{ICONS.search}</span>
        <input
          type="text"
          placeholder="Search CSS classes..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="category-filter">
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

/**
 * Main Enhanced CSS Showcase Component
 */
export const EnhancedCSSShowcase = () => {
  const [parser] = useState(() => getCSSParser());
  const [categories, setCategories] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [editorClass, setEditorClass] = useState(null);
  const [editorClassInfo, setEditorClassInfo] = useState(null);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      // Wait for parser to finish loading if it's still loading
      if (parser.isLoading) {
        await new Promise(resolve => {
          const checkLoaded = () => {
            if (!parser.isLoading) {
              resolve();
            } else {
              setTimeout(checkLoaded, 100);
            }
          };
          checkLoaded();
        });
      }

      // Load categories from parser
      const allCategories = parser.getCategories();
      
      // Filter to show only featured categories and their classes
      const featuredCategories = {};
      FEATURED_CATEGORIES.forEach(categoryName => {
        if (allCategories[categoryName]) {
          featuredCategories[categoryName] = allCategories[categoryName];
        }
      });
      
      setCategories(featuredCategories);
    };

    loadCategories();
  }, [parser]);

  const openEditor = (className, classInfo) => {
    setEditorClass(className);
    setEditorClassInfo(classInfo);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditorClass(null);
    setEditorClassInfo(null);
  };

  // Filter classes based on search and category
  const getFilteredCategories = () => {
    const filtered = {};
    
    Object.entries(categories).forEach(([categoryName, classNames]) => {
      if (selectedCategory && selectedCategory !== categoryName) return;
      
      const filteredClasses = classNames.filter(className => 
        className.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (filteredClasses.length > 0) {
        filtered[categoryName] = filteredClasses;
      }
    });
    
    return filtered;
  };

  const filteredCategories = getFilteredCategories();

  return (
    <div className="enhanced-css-showcase">
      {/* Header */}
      <header className="showcase-header">
        <div className="header-content">
          <div style={{marginBottom: '2rem'}}>
            <h1>CSS Library Documentation</h1>
            <p>Interactive showcase with live editing, API documentation, and comprehensive examples</p>
          </div>
          
          {/* Statistics Overview */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-number">{Object.keys(categories).reduce((acc, cat) => acc + categories[cat].length, 0)}</div>
              <div className="stat-label">CSS Classes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{Object.keys(categories).length}</div>
              <div className="stat-label">Categories</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{parser.getStatistics().classesWithHover}</div>
              <div className="stat-label">Interactive</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{parser.getStatistics().animatedClasses}</div>
              <div className="stat-label">Animated</div>
            </div>
          </div>
          
          {/* Search and Filter */}
          <SearchFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={FEATURED_CATEGORIES}
          />
        </div>
      </header>

      {/* Category Sections */}
      <main className="showcase-content">
        {Object.entries(filteredCategories).map(([categoryName, classNames]) => (
          <section key={categoryName} className="category-section">
            <h2 className="category-title">
              <span className="category-icon">{CATEGORY_ICONS[categoryName] || '📦'}</span>
              {categoryName}
            </h2>
            <div className="category-grid">
              {classNames.map(className => {
                const classInfo = parser.getClassInfo(className);
                return (
                  <EnhancedShowcaseCard
                    key={className}
                    className={className}
                    classInfo={classInfo}
                    onOpenEditor={openEditor}
                  />
                );
              })}
            </div>
          </section>
        ))}
        
        {/* Empty State */}
        {Object.keys(filteredCategories).length === 0 && (
          <div className="empty-state">
            <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🔍</div>
            <h3>No CSS classes found</h3>
            <p>Try adjusting your search terms or selecting a different category.</p>
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="my-button"
              style={{marginTop: '1rem'}}
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>

      {/* Full-screen Terminal Editor */}
      {showEditor && (
        <div className="terminal-modal" onClick={closeEditor}>
          <div onClick={e => e.stopPropagation()}>
            <TerminalEditor
              className={editorClass}
              initialCSS={editorClassInfo?.css}
              onClose={closeEditor}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions for API documentation
function getCSSPropertyType(property) {
  const types = {
    'display': 'Layout',
    'position': 'Layout',
    'top': 'Position',
    'left': 'Position',
    'right': 'Position',
    'bottom': 'Position',
    'width': 'Dimension',
    'height': 'Dimension',
    'margin': 'Spacing',
    'padding': 'Spacing',
    'border': 'Border',
    'background': 'Visual',
    'color': 'Visual',
    'font-size': 'Typography',
    'font-weight': 'Typography',
    'line-height': 'Typography',
    'text-align': 'Typography',
    'transform': 'Animation',
    'transition': 'Animation',
    'animation': 'Animation',
    'opacity': 'Visual',
    'z-index': 'Layout',
    'overflow': 'Layout',
    'cursor': 'Interaction'
  };
  
  return types[property] || 'Other';
}

// Generate HTML usage examples for CSS classes
function getUsageExamples(className) {
  const examples = [];
  
  if (className.includes('button') || className.includes('btn')) {
    examples.push(`<button class="${className}">Click Me</button>`);
    examples.push(`<a href="#" class="${className}">Link Button</a>`);
  } else if (className.includes('card')) {
    examples.push(`<div class="${className}">
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</div>`);
  } else if (className.includes('grid')) {
    examples.push(`<div class="${className}">
  <div>Grid Item 1</div>
  <div>Grid Item 2</div>
  <div>Grid Item 3</div>
</div>`);
  } else if (className.includes('header')) {
    examples.push(`<header class="${className}">
  <div class="logo">Brand</div>
  <nav>Navigation items</nav>
</header>`);
  } else if (className.includes('hero')) {
    examples.push(`<section class="${className}">
  <h1>Hero Title</h1>
  <p>Hero description</p>
</section>`);
  } else if (className.includes('input') || className.includes('search')) {
    examples.push(`<input class="${className}" placeholder="Enter text...">`);
  } else if (className.includes('table')) {
    examples.push(`<div class="${className}">
  <table>
    <thead><tr><th>Header</th></tr></thead>
    <tbody><tr><td>Data</td></tr></tbody>
  </table>
</div>`);
  } else {
    // Generic usage
    examples.push(`<div class="${className}">Content</div>`);
    if (className.includes('text') || className.includes('title')) {
      examples.push(`<p class="${className}">Text content</p>`);
      examples.push(`<h2 class="${className}">Heading</h2>`);
    }
  }
  
  return examples.map((example, index) => (
    <div key={index} className="usage-example">
      <pre><code>{example}</code></pre>
    </div>
  ));
}

function getCSSPropertyDescription(property) {
  const descriptions = {
    'display': 'Sets how an element is displayed',
    'position': 'Sets the positioning method',
    'background': 'Sets background styling',
    'color': 'Sets text color',
    'border': 'Sets border properties',
    'margin': 'Sets outer spacing',
    'padding': 'Sets inner spacing',
    'transform': 'Applies transformations',
    'transition': 'Defines animation transitions',
    'animation': 'Defines keyframe animations',
    'font-size': 'Sets text size',
    'font-weight': 'Sets text weight',
    'border-radius': 'Sets corner rounding',
    'box-shadow': 'Adds shadow effects',
    'opacity': 'Sets element transparency',
    'cursor': 'Sets cursor appearance on hover',
    'overflow': 'Controls content overflow',
    'z-index': 'Sets stacking order'
  };
  
  return descriptions[property] || `Controls ${property} styling`;
}

export default EnhancedCSSShowcase;