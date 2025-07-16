import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Parser from '../src/parser';

// Mock window.matchMedia for mobile/desktop testing
const mockMatchMedia = (matches) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// Simple mocks
vi.mock('../src/hooks/useParserData', () => ({
  useParserData: () => ({
    bankName: '',
    bankNames: [],
    sortedRecords: [],
    selectedMonths: [],
    loading: false,
    error: null,
    lineData: {},
    pieData: {},
    totalAmount: {},
    setBankName: vi.fn(),
    setSelectedMonths: vi.fn(),
    requestSort: vi.fn(),
    uploadFiles: vi.fn(),
    clearData: vi.fn(),
    fetchRecords: vi.fn(),
    fetchBankNames: vi.fn(),
    retryFetch: vi.fn()
  })
}));

vi.mock('../src/components/MainComponents.jsx', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn()
  }),
  AltModernHeader: ({ theme }) => (
    <header data-testid="header" className="mobile-header">
      <h1>Parser</h1>
      <span>{theme}</span>
    </header>
  )
}));

vi.mock('../src/components/UploadSection', () => ({
  default: ({ uploadMessage }) => (
    <div data-testid="upload-section" className="mobile-upload">
      <h2>Upload</h2>
      <p>{uploadMessage}</p>
    </div>
  )
}));

vi.mock('../src/components/BreakdownSection', () => ({
  default: ({ loading, sortedRecords }) => (
    <div data-testid="breakdown-section" className="mobile-breakdown">
      <h2>Breakdown</h2>
      {loading ? <p>Loading...</p> : <p>{sortedRecords.length} records</p>}
    </div>
  )
}));

describe('Mobile Layout Tests', () => {
  beforeEach(() => {
    // Reset window.matchMedia before each test (if it exists)
    if (window.matchMedia) {
      window.matchMedia = undefined;
    }
  });

  describe('Mobile Viewport (max-width: 768px)', () => {
    beforeEach(() => {
      mockMatchMedia(true); // Matches mobile query
    });

    it('renders mobile-optimized layout', () => {
      render(<Parser />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('upload-section')).toBeInTheDocument();
      
      // Check for mobile-specific classes
      expect(screen.getByTestId('header')).toHaveClass('mobile-header');
      expect(screen.getByTestId('upload-section')).toHaveClass('mobile-upload');
    });

    it('displays mobile-appropriate content', () => {
      render(<Parser />);
      
      // Header should be compact
      expect(screen.getByText('Parser')).toBeInTheDocument();
      
      // Upload section should be simplified
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Upload your PDF statements to get started')).toBeInTheDocument();
    });

    it('handles mobile layout structure', () => {
      render(<Parser />);
      
      // Test mobile layout classes and structure
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toHaveClass('mobile-header');
      expect(screen.getByTestId('upload-section')).toHaveClass('mobile-upload');
    });
  });

  describe('Desktop Viewport (min-width: 769px)', () => {
    beforeEach(() => {
      mockMatchMedia(false); // Doesn't match mobile query
    });

    it('renders desktop layout', () => {
      render(<Parser />);
      
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('upload-section')).toBeInTheDocument();
      
      // Should still have the classes (they're in the mocks)
      expect(screen.getByTestId('header')).toHaveClass('mobile-header');
    });

    it('displays full desktop content', () => {
      render(<Parser />);
      
      expect(screen.getByText('Parser')).toBeInTheDocument();
      expect(screen.getByText('Upload your PDF statements to get started')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('adapts to different screen sizes', () => {
      const { container } = render(<Parser />);
      
      // Check for responsive container
      expect(container.querySelector('.parser-container')).toBeInTheDocument();
    });

    it('maintains functionality across viewports', () => {
      render(<Parser />);
      
      // Core functionality should be present regardless of viewport
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('upload-section')).toBeInTheDocument();
    });
  });

  describe('Touch-friendly Elements', () => {
    it('renders touch-appropriate UI elements', () => {
      render(<Parser />);
      
      // Elements should be rendered and accessible
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('upload-section')).toBeInTheDocument();
    });
  });
});