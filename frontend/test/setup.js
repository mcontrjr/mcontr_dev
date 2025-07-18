/* eslint-disable no-undef */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia for CSS media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock getComputedStyle for CSS custom properties
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = vi.fn().mockImplementation((element) => {
  const computedStyle = originalGetComputedStyle(element);
  return {
    ...computedStyle,
    getPropertyValue: vi.fn().mockImplementation((property) => {
      // Mock CSS custom properties used in theme colors
      const mockValues = {
        '--text-primary': '#000000',
        '--text-secondary': '#666666',
        '--border': '#e0e0e0',
        '--bg-card': '#ffffff',
        '--bg-secondary': '#f5f5f5',
        '--accent': '#007bff',
        '--accent-hover': '#0056b3',
      };
      return mockValues[property] || computedStyle.getPropertyValue(property);
    }),
  };
});

// Mock fetch for API calls
global.fetch = vi.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ records: [] }),
  })
);