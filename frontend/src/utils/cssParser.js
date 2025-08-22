// CSS Class Parser and Categorizer
// This utility extracts CSS classes from files and categorizes them

export const CSS_CATEGORIES = {
  inputs: {
    title: 'Inputs & Controls',
    description: 'Buttons, forms, toggles, and interactive elements',
    keywords: ['button', 'btn', 'input', 'form', 'toggle', 'switch', 'control', 'field', 'select', 'checkbox', 'radio']
  },
  layout: {
    title: 'Layout & Grid', 
    description: 'Containers, grids, flexbox layouts',
    keywords: ['container', 'grid', 'flex', 'layout', 'row', 'col', 'wrap', 'center', 'align', 'justify']
  },
  cards: {
    title: 'Cards & Surfaces',
    description: 'Card designs, panels, surfaces', 
    keywords: ['card', 'panel', 'surface', 'box', 'item', 'tile', 'modal', 'dialog', 'popover']
  },
  typography: {
    title: 'Typography & Text',
    description: 'Headers, text styles, font variants',
    keywords: ['text', 'font', 'title', 'header', 'heading', 'label', 'caption', 'subtitle']
  },
  navigation: {
    title: 'Navigation & Headers', 
    description: 'Navigation bars, headers, menu items',
    keywords: ['nav', 'menu', 'header', 'breadcrumb', 'tab', 'link', 'brand', 'logo']
  },
  animations: {
    title: 'Animations & Effects',
    description: 'Transitions, animations, hover effects',
    keywords: ['animate', 'animation', 'transition', 'fade', 'slide', 'bounce', 'spin', 'hover', 'effect']
  },
  utilities: {
    title: 'Utilities & Helpers',
    description: 'Helper classes, utilities, modifiers',
    keywords: ['util', 'helper', 'margin', 'padding', 'display', 'position', 'size', 'color', 'bg', 'border']
  }
};

export const CSS_FILES = {
  stock: {
    title: 'Stock.css',
    description: 'Global styles, theme variables, common components',
    path: '../styles/stock.css'
  },
  parser: {
    title: 'Parser.css',
    description: 'Financial parser specific styles', 
    path: '../styles/parser.css'
  },
  guess: {
    title: 'Guess.css',
    description: 'Guessing game specific styles',
    path: '../styles/guess.css'
  },
  weather: {
    title: 'Weather.css', 
    description: 'Weather dashboard styles',
    path: '../styles/weather.css'
  },
  random: {
    title: 'Random.css',
    description: 'Image search page styles',
    path: '../styles/random.css'
  }
};

// Parse CSS content to extract class names
export const parseCSSClasses = (cssContent) => {
  const classes = [];
  
  // Regex to match CSS class selectors
  const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
  let match;
  
  while ((match = classRegex.exec(cssContent)) !== null) {
    const className = match[1];
    
    // Skip pseudo-classes and states
    if (!className.includes(':') && !className.includes('(')) {
      classes.push({
        name: className,
        type: categorizeClass(className),
        fullMatch: match[0]
      });
    }
  }
  
  // Remove duplicates
  const uniqueClasses = classes.filter((cls, index, self) => 
    index === self.findIndex(c => c.name === cls.name)
  );
  
  return uniqueClasses;
};

// Categorize a class name based on keywords
export const categorizeClass = (className) => {
  const lowerName = className.toLowerCase();
  
  for (const [category, config] of Object.entries(CSS_CATEGORIES)) {
    if (config.keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return 'utilities'; // Default category
};

// Sample parsed data for immediate use (since we can't dynamically import CSS files)
export const PARSED_CSS_CLASSES = {
  stock: {
    inputs: [
      { name: 'theme-toggle', description: 'Theme switcher button' },
      { name: 'my-button', description: 'Primary button style' },
      { name: 'button-primary', description: 'Primary action button' },
      { name: 'button-secondary', description: 'Secondary action button' },
    ],
    layout: [
      { name: 'my-container', description: 'Main content container' },
      { name: 'my-section', description: 'Page section wrapper' },
      { name: 'my-grid', description: 'Basic grid layout' },
      { name: 'my-grid-2', description: '2-column grid' },
      { name: 'my-grid-3', description: '3-column grid' },
      { name: 'centered-grid', description: 'Centered grid layout' },
      { name: 'flex-center', description: 'Flexbox center alignment' },
    ],
    cards: [
      { name: 'my-card', description: 'Basic card component' },
      { name: 'card-elevated', description: 'Card with elevation shadow' },
      { name: 'card-outlined', description: 'Card with border outline' },
    ],
    typography: [
      { name: 'my-section-title', description: 'Section heading style' },
      { name: 'my-header', description: 'Page header style' },
      { name: 'text-center', description: 'Center-aligned text' },
      { name: 'text-primary', description: 'Primary text color' },
      { name: 'text-secondary', description: 'Secondary text color' },
      { name: 'text-muted', description: 'Muted text color' },
    ],
    navigation: [
      { name: 'my-nav', description: 'Navigation bar' },
      { name: 'my-logo', description: 'Logo container' },
      { name: 'nav-item', description: 'Navigation item' },
      { name: 'my-header-content', description: 'Header content wrapper' },
    ],
    animations: [
      { name: 'animate-fade-in-up', description: 'Fade in from bottom animation' },
      { name: 'loading-spinner', description: 'Loading spinner animation' },
      { name: 'hover-lift', description: 'Hover lift effect' },
    ]
  },
  parser: {
    inputs: [
      { name: 'upload-dropzone', description: 'File upload drop area' },
      { name: 'file-input', description: 'File input styling' },
      { name: 'clear-files-btn', description: 'Clear files button' },
      { name: 'parser-session-editor', description: 'Session editor input' },
    ],
    layout: [
      { name: 'parser-container', description: 'Parser main container' },
      { name: 'breakdown-section', description: 'Data breakdown section' },
      { name: 'upload-section', description: 'File upload section' },
      { name: 'parser-grid', description: 'Parser specific grid' },
    ],
    cards: [
      { name: 'pdf-thumbnail', description: 'PDF file thumbnail card' },
      { name: 'breakdown-card', description: 'Data breakdown card' },
      { name: 'upload-card', description: 'Upload status card' },
    ],
    utilities: [
      { name: 'compact', description: 'Compact spacing modifier' },
      { name: 'uploading', description: 'Upload state modifier' },
      { name: 'success', description: 'Success state' },
      { name: 'error', description: 'Error state' },
    ]
  },
  guess: {
    inputs: [
      { name: 'game-button', description: 'Game action button' },
      { name: 'keypad-button', description: 'Number keypad button' },
      { name: 'clear-button', description: 'Clear input button' },
    ],
    layout: [
      { name: 'game-layout-active', description: 'Active game layout' },
      { name: 'game-layout-centered', description: 'Centered game layout' },
      { name: 'game-left-panel', description: 'Game sidebar panel' },
      { name: 'game-right-panel', description: 'Game main panel' },
    ],
    cards: [
      { name: 'game-card', description: 'Game interface card' },
      { name: 'score-card', description: 'Score display card' },
      { name: 'history-card', description: 'Game history card' },
    ]
  },
  weather: {
    cards: [
      { name: 'weather-card', description: 'Weather data display card' },
      { name: 'weather-profile-card', description: 'Weather profile card' },
      { name: 'weather-table', description: 'Weather data table' },
    ],
    inputs: [
      { name: 'weather-search', description: 'Weather location search' },
      { name: 'search-button', description: 'Search action button' },
    ]
  },
  random: {
    cards: [
      { name: 'image-gallery', description: 'Image gallery container' },
      { name: 'image-card', description: 'Individual image card' },
      { name: 'gallery-tab', description: 'Gallery tab selector' },
    ],
    layout: [
      { name: 'gallery-grid', description: 'Image gallery grid' },
      { name: 'tabulated-gallery', description: 'Tabbed gallery layout' },
    ]
  }
};

// Get classes by category across all files
export const getClassesByCategory = (category) => {
  const classes = [];
  
  Object.entries(PARSED_CSS_CLASSES).forEach(([file, fileClasses]) => {
    if (fileClasses[category]) {
      fileClasses[category].forEach(cls => {
        classes.push({
          ...cls,
          file: file
        });
      });
    }
  });
  
  return classes;
};

// Get all classes from a specific file
export const getClassesByFile = (fileName) => {
  return PARSED_CSS_CLASSES[fileName] || {};
};
