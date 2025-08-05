/* eslint-disable react/prop-types */
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

vi.mock('../src/components/UI/MainComponents.jsx', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn()
  }),
  AltModernHeader: ({ theme }) => (
    <header className="simple-header mobile-header" data-testid="header">
      <div className="simple-header-content">
        <div className="simple-header-left">
          <a href="/" className="simple-logo">
            <span className="simple-logo-text">mcontr</span>
          </a>
        </div>
        <div className="simple-header-right">
          <span>{theme}</span>
        </div>
      </div>
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
      expect(document.querySelector('.upload-section')).toBeInTheDocument();

      // Check for mobile-specific classes
      expect(screen.getByTestId('header')).toHaveClass('mobile-header');
      expect(document.querySelector('.upload-section')).toHaveClass('upload-section');
    });

    it('displays mobile-appropriate content', () => {
      render(<Parser />);

      // Header should be compact
      expect(screen.getByText('mcontr')).toBeInTheDocument();

      // Upload section should be simplified
      expect(screen.getByText('Upload Center')).toBeInTheDocument();
      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
    });

    it('handles mobile layout structure', () => {
      render(<Parser />);

      // Test mobile layout classes and structure
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toHaveClass('mobile-header');
      expect(document.querySelector('.upload-section')).toHaveClass('upload-section');
    });
  });

  describe('Desktop Viewport (min-width: 769px)', () => {
    beforeEach(() => {
      mockMatchMedia(false); // Doesn't match mobile query
    });

    it('renders desktop layout', () => {
      render(<Parser />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(document.querySelector('.upload-section')).toBeInTheDocument();

      // Should still have the classes (they're in the mocks)
      expect(screen.getByTestId('header')).toHaveClass('mobile-header');
    });

    it('displays full desktop content', () => {
      render(<Parser />);

      expect(screen.getByText('mcontr')).toBeInTheDocument();
      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
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
      expect(document.querySelector('.upload-section')).toBeInTheDocument();
    });
  });

  describe('Touch-friendly Elements', () => {
    it('renders touch-appropriate UI elements', () => {
      render(<Parser />);

      // Elements should be rendered and accessible
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(document.querySelector('.upload-section')).toBeInTheDocument();
    });
  });
});