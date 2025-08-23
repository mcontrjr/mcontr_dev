/**
 * Advanced CSS Parser for extracting class definitions and creating documentation
 * Parses CSS text to extract actual CSS rules and create interactive documentation
 */
class CSSParser {
  constructor(cssText = '') {
    this.cssText = cssText;
    this.parsedRules = new Map();
    this.categories = new Map();
    this.dependencies = new Map();
    this.isLoading = false;
    this.loadCSS();
  }

  /**
   * Load CSS from the stock.css file
   */
  async loadCSS() {
    if (this.cssText) return; // Already have CSS text
    
    this.isLoading = true;
    try {
      // Fetch the CSS file content
      const response = await fetch('/styles/stock.css');
      const cssText = await response.text();
      this.cssText = cssText;
      this.parse();
    } catch (error) {
      console.warn('Could not load stock.css, using fallback data', error);
      this.loadFallbackData();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load fallback data when CSS file can't be loaded
   */
  loadFallbackData() {
    // Enhanced fallback data with clean formatting and comprehensive examples
    this.cssText = `/* Layout Components */
.my-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.my-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
  justify-items: center;
}

.centered-grid {
  justify-content: center;
}

/* Button Components */
.my-button {
  background: var(--accent);
  color: var(--text-primary);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.my-button:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.action-btn {
  background: var(--accent);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--accent-hover);
  transform: translateY(-1px);
}

/* Card Components */
.my-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  max-width: 400px;
  text-align: center;
}

.my-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.2);
}

.enhanced-showcase-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  animation: card-appear 0.5s ease-out;
}

/* Typography */
.class-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #007acc;
  cursor: pointer;
  transition: color 0.2s ease;
}

.class-description {
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Controls */
.theme-toggle {
  background: var(--accent);
  border-radius: 8px;
  padding: 0.5rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-input {
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: inherit;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: #007acc;
  box-shadow: 0 0 0 3px rgba(0, 122, 204, 0.1);
}

/* Hero Sections */
.my-hero {
  padding: 4rem 0;
  text-align: center;
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
}

.showcase-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 3rem 2rem;
  text-align: center;
}

/* Terminal Components */
.terminal-editor {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  overflow: hidden;
  font-family: 'Monaco', 'Menlo', monospace;
  animation: terminal-appear 0.3s ease-out;
}

.terminal-btn {
  background: transparent;
  border: 1px solid #555;
  color: #ccc;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.terminal-btn:hover {
  background: #3a3a3a;
  color: #fff;
}

/* Animations */
.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-appear {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes terminal-appear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Utilities */
.text-center { text-align: center; }
.mb-2 { margin-bottom: 1rem; }
.mt-3 { margin-top: 1.5rem; }`;
    this.parse();
  }

  /**
   * Parse CSS text and extract class rules
   */
  parse() {
    if (!this.cssText) return;
    
    // Remove comments and normalize
    const cleanCSS = this.cssText
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract CSS rules
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    let match;

    while ((match = ruleRegex.exec(cleanCSS)) !== null) {
      const selector = match[1].trim();
      const declarations = match[2].trim();
      
      // Focus on class selectors
      if (selector.includes('.')) {
        this.parseRule(selector, declarations);
      }
    }

    this.categorizeRules();
  }

  /**
   * Parse individual CSS rule
   */
  parseRule(selector, declarations) {
    const classNames = this.extractClassNames(selector);
    
    classNames.forEach(className => {
      if (!this.parsedRules.has(className)) {
        this.parsedRules.set(className, {
          selectors: [],
          declarations: [],
          properties: new Set(),
          pseudoClasses: new Set(),
          variants: new Set()
        });
      }

      const rule = this.parsedRules.get(className);
      rule.selectors.push(selector);
      
      // Parse declarations
      const props = this.parseDeclarations(declarations);
      rule.declarations.push({ selector, properties: props });
      
      // Track properties and pseudo-classes
      props.forEach(prop => rule.properties.add(prop.property));
      this.extractPseudoClasses(selector).forEach(pseudo => rule.pseudoClasses.add(pseudo));
      this.extractVariants(className).forEach(variant => rule.variants.add(variant));
    });
  }

  /**
   * Extract class names from selector
   */
  extractClassNames(selector) {
    const classRegex = /\.([a-zA-Z][\w-]*)/g;
    const classes = [];
    let match;

    while ((match = classRegex.exec(selector)) !== null) {
      classes.push(match[1]);
    }

    return classes;
  }

  /**
   * Parse CSS declarations into structured format
   */
  parseDeclarations(declarations) {
    return declarations
      .split(';')
      .filter(decl => decl.trim())
      .map(decl => {
        const [property, value] = decl.split(':').map(s => s ? s.trim() : '');
        // Only return valid property-value pairs
        if (property && value) {
          return { property, value };
        }
        // Return property with empty value if value is missing
        return { property: property || '', value: value || '' };
      })
      .filter(({ property }) => property); // Remove entries with empty properties
  }

  /**
   * Extract pseudo-classes from selector
   */
  extractPseudoClasses(selector) {
    const pseudoRegex = /:([a-zA-Z-]+)/g;
    const pseudos = [];
    let match;

    while ((match = pseudoRegex.exec(selector)) !== null) {
      pseudos.push(match[1]);
    }

    return pseudos;
  }

  /**
   * Extract variants from class name (e.g., my-button-primary)
   */
  extractVariants(className) {
    const variants = [];
    
    // Common variant patterns
    if (className.includes('-')) {
      const parts = className.split('-');
      if (parts.length > 2) {
        variants.push(parts.slice(-1)[0]); // Last part as variant
      }
    }

    return variants;
  }

  /**
   * Categorize CSS rules based on patterns and usage - Enhanced categorization
   */
  categorizeRules() {
    const categories = {
      'Layout & Grid': /^(my-container|my-section|my-grid|.*grid|.*layout|.*flex|.*wrap|centered-grid|showcase-content|category-grid)/,
      'Buttons & Controls': /^(my-button|.*button|.*btn|theme-toggle|.*control|action-btn)/,
      'Cards & Surfaces': /^(my-card|unified-card|.*card|.*surface|.*panel|enhanced-showcase-card|stat-card)/,
      'Navigation & Headers': /^(my-header|my-nav|simple-header|.*nav|.*menu|.*header|showcase-header)/,
      'Hero Sections': /^(my-hero|unified-hero|hero-.*|stats-overview)/,
      'Interactive & States': /^(.*hover|.*active|.*focus|.*interactive|.*accordion|.*dropdown)/,
      'Animations & Effects': /^(animate-|.*animation|.*transition|.*fade|.*slide|.*spinner|.*rotate|card-appear|terminal-appear)/,
      'Typography & Text': /^(.*title|.*subtitle|.*text|.*font|.*heading|class-name|class-description|stat-number|stat-label)/,
      'Forms & Tables': /^(custom-table|.*table|.*form|.*input|.*field|search-input|category-select|api-table)/,
      'Media & Images': /^(custom-img|.*img|.*media|.*image|pdf-.*)/,
      'Terminal & Editor': /^(terminal-.*|preview-.*|css-info|error-icon)/,
      'API Documentation': /^(api-.*|selector-.*)/,
      'Utilities & Spacing': /^(mb-|mt-|.*spacing|.*margin|.*padding|text-.*|info-.*|empty-state)/
    };

    this.parsedRules.forEach((rule, className) => {
      let assigned = false;
      
      for (const [categoryName, pattern] of Object.entries(categories)) {
        if (pattern.test(className)) {
          if (!this.categories.has(categoryName)) {
            this.categories.set(categoryName, new Set());
          }
          this.categories.get(categoryName).add(className);
          assigned = true;
          break;
        }
      }

      // Default category for unmatched rules
      if (!assigned) {
        if (!this.categories.has('Other Components')) {
          this.categories.set('Other Components', new Set());
        }
        this.categories.get('Other Components').add(className);
      }
    });
  }

  /**
   * Generate complete CSS code for a class with cleanup
   */
  getCSSCode(className) {
    const rule = this.parsedRules.get(className);
    if (!rule) return null;

    let css = '';
    
    // Group by base selector and variants
    const groupedDeclarations = new Map();
    
    rule.declarations.forEach(({ selector, properties }) => {
      if (!groupedDeclarations.has(selector)) {
        groupedDeclarations.set(selector, []);
      }
      groupedDeclarations.get(selector).push(...properties);
    });

    // Generate CSS output with better formatting
    groupedDeclarations.forEach((properties, selector) => {
      css += `${selector} {\n`;
      properties.forEach(({ property, value }) => {
        css += `  ${property}: ${value};\n`;
      });
      css += '}\n\n';
    });

    // Clean up the CSS output
    const cleanCSS = css
      .replace(/\\n/g, '\n') // Replace escaped newlines
      .replace(/\n\s*\n/g, '\n') // Remove excessive blank lines
      .trim();

    return cleanCSS;
  }

  /**
   * Get comprehensive information about a CSS class
   */
  getClassInfo(className) {
    const rule = this.parsedRules.get(className);
    if (!rule) return null;

    return {
      className,
      css: this.getCSSCode(className),
      properties: Array.from(rule.properties),
      pseudoClasses: Array.from(rule.pseudoClasses),
      variants: Array.from(rule.variants),
      selectors: rule.selectors,
      usage: this.inferUsage(className, rule),
      dependencies: this.getDependencies(className)
    };
  }

  /**
   * Infer usage description from class name and properties
   */
  inferUsage(className, rule) {
    const properties = Array.from(rule.properties);
    
    // Layout components
    if (properties.includes('display') && properties.includes('grid')) {
      return 'Grid container for responsive layouts';
    }
    
    if (properties.includes('display') && properties.includes('flex')) {
      return 'Flexible container for aligned content';
    }

    // Interactive components
    if (rule.pseudoClasses.has('hover')) {
      return 'Interactive component with hover effects';
    }

    // Animation components
    if (properties.includes('animation') || properties.includes('transform')) {
      return 'Animated component with motion effects';
    }

    // Button components
    if (className.includes('button') || className.includes('btn')) {
      return 'Interactive button for user actions';
    }

    // Card components
    if (className.includes('card')) {
      return 'Content container with structured layout';
    }

    return 'CSS component for styling elements';
  }

  /**
   * Get dependencies for a class (other classes it references)
   */
  getDependencies(className) {
    const rule = this.parsedRules.get(className);
    if (!rule) return [];

    const dependencies = new Set();
    
    rule.declarations.forEach(({ properties }) => {
      properties.forEach(({ value }) => {
        // Ensure value exists and is a string before calling match
        if (!value || typeof value !== 'string') return;
        
        // Look for CSS custom properties (variables)
        const varMatches = value.match(/var\(([^)]+)\)/g);
        if (varMatches) {
          varMatches.forEach(match => {
            const varNameMatch = match.match(/var\(([^)]+)\)/);
            if (varNameMatch && varNameMatch[1]) {
              dependencies.add(varNameMatch[1]);
            }
          });
        }
      });
    });

    return Array.from(dependencies);
  }

  /**
   * Get all categories with their classes
   */
  getCategories() {
    const result = {};
    this.categories.forEach((classes, categoryName) => {
      result[categoryName] = Array.from(classes);
    });
    return result;
  }

  /**
   * Search classes by pattern
   */
  searchClasses(pattern) {
    const regex = new RegExp(pattern, 'i');
    const results = [];
    
    this.parsedRules.forEach((rule, className) => {
      if (regex.test(className)) {
        results.push(this.getClassInfo(className));
      }
    });

    return results;
  }

  /**
   * Get class statistics
   */
  getStatistics() {
    return {
      totalClasses: this.parsedRules.size,
      totalCategories: this.categories.size,
      classesWithHover: Array.from(this.parsedRules.values()).filter(rule => rule.pseudoClasses.has('hover')).length,
      animatedClasses: Array.from(this.parsedRules.values()).filter(rule => rule.properties.has('animation') || rule.properties.has('transform')).length
    };
  }
}

// Create global parser instance
let globalParser = null;

/**
 * Get or create the global CSS parser instance
 */
export function getCSSParser() {
  if (!globalParser) {
    globalParser = new CSSParser();
  }
  return globalParser;
}

/**
 * Helper function to get formatted CSS for a class
 */
export function getFormattedCSS(className) {
  const parser = getCSSParser();
  return parser.getCSSCode(className);
}

/**
 * Helper function to get complete class information
 */
export function getClassInfo(className) {
  const parser = getCSSParser();
  return parser.getClassInfo(className);
}

/**
 * Helper function to get all categories
 */
export function getCategories() {
  const parser = getCSSParser();
  return parser.getCategories();
}

export default CSSParser;