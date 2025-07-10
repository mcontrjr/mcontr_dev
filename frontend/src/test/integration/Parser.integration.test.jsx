import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Parser from '../../parser';

// Mock fetch
global.fetch = vi.fn();

// Mock PDF.js
vi.mock('pdfjs-dist', () => ({
  default: {
    getDocument: vi.fn(() => ({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn(() => Promise.resolve({
          getViewport: vi.fn(() => ({ width: 100, height: 100 })),
          render: vi.fn(() => ({ promise: Promise.resolve() }))
        }))
      })
    }))
  }
}));

// Mock worker
vi.mock('pdfjs-dist/legacy/build/pdf.worker.min.js', () => ({}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:test');
global.URL.revokeObjectURL = vi.fn();

describe('Parser Integration Tests', () => {
  const mockRecordsResponse = {
    records: [
      {
        id: 1,
        date: '2023-01-01',
        description: 'Coffee Shop Purchase',
        amount: '15.99',
        category: 'Food',
        bank: 'Test Bank'
      },
      {
        id: 2,
        date: '2023-01-02',
        description: 'Payment Received',
        amount: '-50.00',
        category: 'Payment',
        bank: 'Test Bank'
      },
      {
        id: 3,
        date: '2023-02-01',
        description: 'Grocery Store',
        amount: '45.67',
        category: 'Food',
        bank: 'Another Bank'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('completes full upload-to-breakdown flow', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      });

    render(<Parser />);

    // 1. Initial state - should show upload section
    expect(screen.getByText('Upload PDF Statements')).toBeInTheDocument();
    expect(screen.getByText('Upload your PDF statements to get started')).toBeInTheDocument();
    expect(screen.queryByText('Financial Breakdown')).not.toBeInTheDocument();

    // 2. Upload a file
    const file = new File(['test pdf content'], 'test-statement.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i);
    
    await user.upload(input, file);

    // 3. Should show PDF thumbnail
    await waitFor(() => {
      expect(screen.getByText('test-statement.pdf')).toBeInTheDocument();
    });

    // 4. Should show uploading message
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });

    // 5. After upload completes, should show breakdown section
    await waitFor(() => {
      expect(screen.getByText('Financial Breakdown')).toBeInTheDocument();
    }, { timeout: 5000 });

    // 6. Should display processed data
    await waitFor(() => {
      expect(screen.getByText('Coffee Shop Purchase')).toBeInTheDocument();
      expect(screen.getByText('Payment Received')).toBeInTheDocument();
      expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    });
  });

  it('handles bank filtering integration', async () => {
    const user = userEvent.setup();
    
    // Mock API responses for initial load and bank filtering
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      });

    render(<Parser />);

    // Upload file first
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i);
    await user.upload(input, file);

    // Wait for breakdown section
    await waitFor(() => {
      expect(screen.getByText('Financial Breakdown')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Should show all records initially
    await waitFor(() => {
      expect(screen.getByText('Coffee Shop Purchase')).toBeInTheDocument();
      expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    });

    // Test bank filtering
    const bankSelect = screen.getByRole('combobox');
    await user.selectOptions(bankSelect, 'Test Bank');

    // Should filter to only Test Bank records
    await waitFor(() => {
      expect(screen.getByText('Coffee Shop Purchase')).toBeInTheDocument();
      expect(screen.getByText('Payment Received')).toBeInTheDocument();
      expect(screen.queryByText('Grocery Store')).not.toBeInTheDocument();
    });
  });

  it('handles month filtering integration', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      });

    render(<Parser />);

    // Upload file first
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i);
    await user.upload(input, file);

    // Wait for breakdown section
    await waitFor(() => {
      expect(screen.getByText('Financial Breakdown')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Initially should show all records
    await waitFor(() => {
      expect(screen.getByText('Coffee Shop Purchase')).toBeInTheDocument();
      expect(screen.getByText('Grocery Store')).toBeInTheDocument();
    });

    // Test month filtering - unselect February
    const februaryCheckbox = screen.getByLabelText('02');
    await user.click(februaryCheckbox);

    // Should filter out February records
    await waitFor(() => {
      expect(screen.getByText('Coffee Shop Purchase')).toBeInTheDocument();
      expect(screen.getByText('Payment Received')).toBeInTheDocument();
      expect(screen.queryByText('Grocery Store')).not.toBeInTheDocument();
    });
  });

  it('handles error states during upload', async () => {
    const user = userEvent.setup();
    
    // Mock API responses - initial load succeeds, upload fails
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockRejectedValueOnce(new Error('Upload failed'));

    render(<Parser />);

    // Upload a file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText(/upload/i);
    
    await user.upload(input, file);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText('Error uploading files. Please try again.')).toBeInTheDocument();
    });

    // Should not show breakdown section
    expect(screen.queryByText('Financial Breakdown')).not.toBeInTheDocument();
  });

  it('handles API error states', async () => {
    // Mock API failure
    fetch.mockRejectedValue(new Error('API Error'));

    render(<Parser />);

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('handles retry functionality', async () => {
    const user = userEvent.setup();
    
    // Mock API failure then success
    fetch
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      });

    render(<Parser />);

    // Should show error state
    await waitFor(() => {
      expect(screen.getByText('Error Loading Data')).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    // Should recover and show normal state
    await waitFor(() => {
      expect(screen.getByText('Upload PDF Statements')).toBeInTheDocument();
      expect(screen.queryByText('Error Loading Data')).not.toBeInTheDocument();
    });
  });

  it('handles multiple file uploads', async () => {
    const user = userEvent.setup();
    
    // Mock API responses
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRecordsResponse)
      });

    render(<Parser />);

    // Upload multiple files
    const files = [
      new File(['test1'], 'statement1.pdf', { type: 'application/pdf' }),
      new File(['test2'], 'statement2.pdf', { type: 'application/pdf' })
    ];
    const input = screen.getByLabelText(/upload/i);
    
    await user.upload(input, files);

    // Should show both thumbnails
    await waitFor(() => {
      expect(screen.getByText('statement1.pdf')).toBeInTheDocument();
      expect(screen.getByText('statement2.pdf')).toBeInTheDocument();
    });

    // Should show uploading message for multiple files
    await waitFor(() => {
      expect(screen.getByText('Uploading 2 file(s)...')).toBeInTheDocument();
    });

    // Should eventually show breakdown
    await waitFor(() => {
      expect(screen.getByText('Financial Breakdown')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});