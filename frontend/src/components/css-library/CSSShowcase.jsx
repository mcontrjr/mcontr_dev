import React, { useState } from 'react';
import logo from '../../assets/logo.svg';
import lightIcon from '../../assets/light.svg';
import darkIcon from '../../assets/dark.svg';

// Terminal-style icons as requested
const ICONS = {
  code: '[<>]',
  copy: '[cp]',
  close: '[x]',
  grid: '[#]',
  card: '[□]',
  button: '[btn]',
  text: '[txt]',
  layout: '[:::]',
  theme: '[°]',
  nav: '[===]',
  hero: '[^^^]',
  table: '[|||]',
  image: '[img]',
  footer: '[___]',
  animation: '[~>]',
  utility: '[+]',
  pdf: '[pdf]',
  accordion: '[^^^]'
};

// Comprehensive CSS class database organized by category
const CSS_CATEGORIES = {
  'Layout & Grid': {
    icon: ICONS.layout,
    classes: {
      'my-container': {
        description: 'Main container with max-width and padding',
        usage: 'Content wrapper'
      },
      'my-grid': {
        description: 'Responsive grid with auto-fit columns',
        usage: 'Card layouts and content grids'
      },
      'my-grid-2': {
        description: 'Grid with larger minimum column width',
        usage: 'For larger content items'
      },
      'my-grid-3': {
        description: 'Standard 3-column responsive grid',
        usage: 'Standard content layout'
      },
      'centered-grid': {
        description: 'Grid with centered content alignment',
        usage: 'For centered layouts'
      },
      'unified-card-grid': {
        description: 'Specialized grid for unified cards',
        usage: 'Hero sections and card showcases'
      }
    }
  },
  
  'Cards & Surfaces': {
    icon: ICONS.card,
    classes: {
      'my-card': {
        description: 'Interactive card with hover effects',
        usage: 'Content cards, features'
      },
      'my-card-static': {
        description: 'Static card without hover effects',
        usage: 'Non-interactive content'
      },
      'my-card-interactive': {
        description: 'Card with click interaction styles',
        usage: 'Clickable cards'
      },
      'my-card-header': {
        description: 'Card header section',
        usage: 'Card titles and metadata'
      },
      'my-card-body': {
        description: 'Card content section',
        usage: 'Main card content'
      },
      'my-card-footer': {
        description: 'Card footer with border',
        usage: 'Card actions and metadata'
      },
      'my-card-title': {
        description: 'Card title styling',
        usage: 'Card headings'
      },
      'unified-card': {
        description: 'Modern card with advanced hover effects',
        usage: 'Featured content cards'
      },
      'unified-card-header': {
        description: 'Header for unified cards',
        usage: 'Unified card titles'
      },
      'unified-card-body': {
        description: 'Body content for unified cards',
        usage: 'Unified card content'
      },
      'unified-card-footer': {
        description: 'Footer for unified cards',
        usage: 'Unified card actions'
      }
    }
  },

  'Navigation & Headers': {
    icon: ICONS.nav,
    classes: {
      'my-header': {
        description: 'Sticky header with backdrop blur',
        usage: 'Main site header'
      },
      'my-header-content': {
        description: 'Header content container',
        usage: 'Header layout wrapper'
      },
      'simple-header': {
        description: 'Fixed header with simple styling',
        usage: 'Alternative header style'
      },
      'simple-header-content': {
        description: 'Simple header content wrapper',
        usage: 'Simple header layout'
      },
      'simple-nav': {
        description: 'Navigation menu styling',
        usage: 'Navigation links'
      },
      'simple-nav-item': {
        description: 'Individual navigation items',
        usage: 'Nav menu items'
      },
      'simple-dropdown': {
        description: 'Dropdown menu with animations',
        usage: 'Dropdown navigation'
      },
      'my-logo': {
        description: 'Logo with hover rotation animation',
        usage: 'Brand logo display'
      },
      'my-nav': {
        description: 'Navigation container',
        usage: 'Navigation wrapper'
      }
    }
  },

  'Buttons & Controls': {
    icon: ICONS.button,
    classes: {
      'my-button': {
        description: 'Primary button with hover effects',
        usage: 'Call-to-action buttons'
      },
      'theme-toggle': {
        description: 'Theme switcher button',
        usage: 'Dark/light mode toggle'
      }
    }
  },

  'Typography & Text': {
    icon: ICONS.text,
    classes: {
      'my-section-title': {
        description: 'Large centered section title',
        usage: 'Page section headers'
      },
      'my-hero-title': {
        description: 'Hero section title with gradient',
        usage: 'Main page headings'
      },
      'my-hero-subtitle': {
        description: 'Hero section subtitle',
        usage: 'Hero descriptions'
      },
      'hero-section-title': {
        description: 'Hero title for unified sections',
        usage: 'Unified hero headings'
      },
      'hero-section-subtitle': {
        description: 'Hero subtitle for unified sections',
        usage: 'Unified hero descriptions'
      },
      'text-center': {
        description: 'Center-aligned text',
        usage: 'Text alignment utility'
      },
      'text-left': {
        description: 'Left-aligned text',
        usage: 'Text alignment utility'
      },
      'text-right': {
        description: 'Right-aligned text',
        usage: 'Text alignment utility'
      }
    }
  },

  'Hero Sections': {
    icon: ICONS.hero,
    classes: {
      'my-hero': {
        description: 'Hero section with gradient background',
        usage: 'Page hero sections'
      },
      'unified-hero': {
        description: 'Modern hero section layout',
        usage: 'Advanced hero layouts'
      },
      'hero-content': {
        description: 'Hero content layout container',
        usage: 'Hero section content'
      },
      'hero-text': {
        description: 'Hero text content area',
        usage: 'Hero text sections'
      },
      'hero-cards': {
        description: 'Hero cards display area',
        usage: 'Hero section cards'
      }
    }
  },

  'Forms & Inputs': {
    icon: ICONS.utility,
    classes: {
      'custom-table': {
        description: 'Styled table with hover effects',
        usage: 'Data tables'
      },
      'custom-table-container': {
        description: 'Table wrapper with styling',
        usage: 'Table containers'
      }
    }
  },

  'Images & Media': {
    icon: ICONS.image,
    classes: {
      'custom-img': {
        description: 'Responsive image with hover effects',
        usage: 'Content images'
      }
    }
  },

  'Interactive Components': {
    icon: ICONS.accordion,
    classes: {
      'context-accordion': {
        description: 'Expandable accordion component',
        usage: 'Collapsible content'
      },
      'context-accordion-trigger': {
        description: 'Accordion toggle button',
        usage: 'Accordion controls'
      },
      'context-accordion-content': {
        description: 'Accordion content area',
        usage: 'Accordion body'
      }
    }
  },

  'PDF Components': {
    icon: ICONS.pdf,
    classes: {
      'pdf-thumbnail': {
        description: 'PDF file thumbnail display',
        usage: 'File previews'
      },
      'pdf-thumbnail-container': {
        description: 'PDF thumbnail wrapper',
        usage: 'PDF preview containers'
      },
      'upload-status-badge': {
        description: 'Upload status indicator',
        usage: 'File upload feedback'
      }
    }
  },

  'Animations & Effects': {
    icon: ICONS.animation,
    classes: {
      'animate-fade-in-up': {
        description: 'Fade in with upward motion',
        usage: 'Element entrance animations'
      },
      'status-spinner': {
        description: 'Loading spinner animation',
        usage: 'Loading indicators'
      }
    }
  },

  'Spacing Utilities': {
    icon: ICONS.utility,
    classes: {
      'mb-0': { description: 'Margin bottom: 0', usage: 'Remove bottom margin' },
      'mb-1': { description: 'Margin bottom: 0.5rem', usage: 'Small bottom margin' },
      'mb-2': { description: 'Margin bottom: 1rem', usage: 'Medium bottom margin' },
      'mb-3': { description: 'Margin bottom: 1.5rem', usage: 'Large bottom margin' },
      'mb-4': { description: 'Margin bottom: 2rem', usage: 'Extra large bottom margin' },
      'mt-0': { description: 'Margin top: 0', usage: 'Remove top margin' },
      'mt-1': { description: 'Margin top: 0.5rem', usage: 'Small top margin' },
      'mt-2': { description: 'Margin top: 1rem', usage: 'Medium top margin' },
      'mt-3': { description: 'Margin top: 1.5rem', usage: 'Large top margin' },
      'mt-4': { description: 'Margin top: 2rem', usage: 'Extra large top margin' }
    }
  },

  'Layout Sections': {
    icon: ICONS.layout,
    classes: {
      'my-section': {
        description: 'Section with margin and padding',
        usage: 'Page sections'
      },
      'my-footer': {
        description: 'Footer section styling',
        usage: 'Page footers'
      },
      'feature-card': {
        description: 'Feature showcase card',
        usage: 'Feature highlights'
      }
    }
  }
};

// Enhanced Code Modal with copy functionality
const CodeModal = ({ className, category, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  
  if (!isOpen || !className) return null;

  const classInfo = CSS_CATEGORIES[category]?.classes[className];
  
  // Extract CSS code from stock.css (simplified version)
  const getCSSCode = (className) => {
    // This would ideally read from the actual CSS file, but for now using examples
    const cssExamples = {
      'my-button': `.my-button {
  background: var(--accent);
  color: var(--text-primary);
  border: var(--accent-hover);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.my-button:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: var(--text-primary);
  text-decoration: none;
}`,

      'my-card': `.my-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  max-width: 400px;
  text-align: center;
}

.my-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px -8px rgba(210, 198, 198, 0.2);
}`,

      'my-grid': `.my-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  justify-items: center;
}`,

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
}

.theme-toggle:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}`
    };
    
    return cssExamples[className] || `/* CSS for .${className} not available in preview */
.${className} {
  /* This class is defined in stock.css */
  /* Check the actual file for complete implementation */
}`;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getCSSCode(className));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h3>.{className}</h3>
            {classInfo && (
              <div className="modal-subtitle">
                <span className="modal-category">{category}</span>
                <span className="modal-description">{classInfo.description}</span>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button className="modal-copy" onClick={copyToClipboard} title="Copy to clipboard">
              {copied ? ICONS.close : ICONS.copy}
            </button>
            <button className="modal-close" onClick={onClose}>{ICONS.close}</button>
          </div>
        </div>
        <div className="modal-body">
          <pre><code>{getCSSCode(className)}</code></pre>
        </div>
      </div>
    </div>
  );
};

// Component examples for demonstration
const ComponentExamples = {
  'my-button': () => (
    <button className="my-button">Sample Button</button>
  ),
  'my-card': () => (
    <div className="my-card">
      <h3>Sample Card</h3>
      <p>This is a sample card with hover effects.</p>
    </div>
  ),
  'my-grid': () => (
    <div className="my-grid" style={{minHeight: '120px', maxWidth: '400px'}}>
      <div style={{background: 'var(--accent)', padding: '1rem', borderRadius: '4px', textAlign: 'center'}}>Item 1</div>
      <div style={{background: 'var(--accent)', padding: '1rem', borderRadius: '4px', textAlign: 'center'}}>Item 2</div>
      <div style={{background: 'var(--accent)', padding: '1rem', borderRadius: '4px', textAlign: 'center'}}>Item 3</div>
    </div>
  ),
  'theme-toggle': () => (
    <button className="theme-toggle">
      <img src={lightIcon} alt="Toggle Theme" width="20" height="20" />
    </button>
  ),
  'my-logo': () => (
    <div className="my-logo">
      <img src={logo} alt="Logo" style={{width: '32px', height: '32px'}} />
      <span>Brand</span>
    </div>
  ),
  'custom-img': () => (
    <img src={logo} alt="Sample" className="custom-img" style={{maxWidth: '100px'}} />
  ),
  'my-section-title': () => (
    <h1 className="my-section-title">Section Title</h1>
  ),
  'text-center': () => (
    <p className="text-center">This text is centered</p>
  ),
  'animate-fade-in-up': () => (
    <div className="animate-fade-in-up" style={{padding: '1rem', background: 'var(--accent)', borderRadius: '4px', textAlign: 'center'}}>
      Animated Element
    </div>
  ),
  'status-spinner': () => (
    <div className="status-spinner"></div>
  )
};

export const CSSShowcaseComponents = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  const showCode = (className, category) => {
    setActiveModal(className);
    setActiveCategory(category);
  };

  const closeModal = () => {
    setActiveModal(null);
    setActiveCategory(null);
  };

  const renderExample = (className) => {
    const ExampleComponent = ComponentExamples[className];
    if (ExampleComponent) {
      return <ExampleComponent />;
    }
    
    // Default example for classes without specific components
    return (
      <div className={className} style={{padding: '1rem', minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', borderRadius: '4px'}}>
        .{className} example
      </div>
    );
  };

  return (
    <div className="css-showcase-container">
      
      {/* Header Section */}
      <section className="showcase-section">
        <h1 className="my-section-title">CSS Library Showcase</h1>
        <p className="section-description">
          Interactive showcase of all CSS classes from stock.css. Click {ICONS.code} next to any element to view and copy its CSS code.
        </p>
      </section>

      {/* Render all categories */}
      {Object.entries(CSS_CATEGORIES).map(([categoryName, categoryData]) => (
        <section key={categoryName} className="showcase-section">
          <h2 className="section-title">
            <span className="section-icon">{categoryData.icon}</span>
            {categoryName}
          </h2>
          <div className="showcase-grid">
            
            {Object.entries(categoryData.classes).map(([className, classInfo]) => (
              <div key={className} className="demo-item">
                <div className="demo-header">
                  <div className="demo-title-section">
                    <span className="demo-class-name">.{className}</span>
                    <span className="demo-description">{classInfo.description}</span>
                  </div>
                  <button 
                    className="code-btn" 
                    onClick={() => showCode(className, categoryName)}
                    title={`View CSS code for .${className}`}
                  >
                    {ICONS.code}
                  </button>
                </div>
                <div className="demo-content">
                  {renderExample(className)}
                </div>
                <div className="demo-usage">
                  <span className="usage-label">Usage:</span>
                  <span className="usage-text">{classInfo.usage}</span>
                </div>
              </div>
            ))}

          </div>
        </section>
      ))}

      <CodeModal 
        className={activeModal}
        category={activeCategory}
        isOpen={!!activeModal}
        onClose={closeModal}
      />
    </div>
  );
};
