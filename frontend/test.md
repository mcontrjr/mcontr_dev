# Test Strategy - Parser Frontend

## Overview

This document outlines the **simplified testing strategy** for the mcontr.dev frontend application, focusing on **layout and UI testing** with minimal mocking to reduce complexity and errors. The goal is to achieve **50% code coverage** through targeted testing of core functionality.

## Test Architecture

### Test Files Structure
```
test/
├── layout.test.jsx          # Basic layout structure tests
├── parser-ui.test.jsx       # UI component behavior tests  
├── mobile-layout.test.jsx   # Mobile/responsive layout tests
├── setup.js                 # Test configuration and global mocks
└── e2e/                     # End-to-end tests (separate from unit tests)
```

## Test Strategy

### 1. Layout Tests (`layout.test.jsx`)
**Focus**: Basic layout structure and dynamic layout changes
- ✅ Header and container rendering
- ✅ Upload section display
- ✅ Conditional breakdown section rendering
- ✅ Responsive CSS classes
- ✅ Theme toggle functionality

### 2. UI Component Tests (`parser-ui.test.jsx`)
**Focus**: UI component behavior and states
- ✅ Error state UI rendering
- ✅ Normal state UI elements
- ✅ Conditional UI element display
- ✅ Interactive element presence
- ✅ Message display functionality

### 3. Mobile Layout Tests (`mobile-layout.test.jsx`)
**Focus**: Mobile and responsive behavior
- ✅ Mobile viewport adaptation (max-width: 768px)
- ✅ Desktop viewport rendering (min-width: 769px)
- ✅ Responsive behavior across viewports
- ✅ Touch-friendly element rendering
- ✅ Mobile-specific CSS classes

## Mocking Strategy

### Minimal Mocking Approach
- **Simple hook mocks**: Basic return values without complex logic
- **Component mocks**: Lightweight components with essential props
- **No API mocking**: Tests focus on UI rendering, not data fetching
- **No complex state management**: Tests use static mock data

### Mock Structure
```javascript
// Simple useParserData mock
vi.mock('../src/hooks/useParserData', () => ({
  useParserData: () => ({
    // Basic static values
    bankName: '',
    bankNames: [],
    sortedRecords: [],
    // Simple function mocks
    setBankName: vi.fn(),
    uploadFiles: vi.fn(),
    // ... other props
  })
}));
```

## Coverage Goals

### Target: 50% Code Coverage
- **Layout rendering**: 100% of layout paths
- **UI states**: Error, loading, normal states
- **Responsive behavior**: Mobile and desktop viewports
- **Conditional rendering**: Dynamic UI elements

### Coverage Areas
- ✅ Component rendering
- ✅ CSS class application
- ✅ Conditional display logic
- ✅ Error state handling
- ✅ Theme integration
- ✅ Mobile responsiveness

## Test Execution

### Running Tests
```bash
# Run all unit tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- layout.test.jsx

# Run in watch mode
npm test -- --watch
```

### Expected Results
- **Total Tests**: ~40-50 tests
- **Test Files**: 3 unit test files
- **Coverage**: 50%+ on parser.jsx
- **Test Speed**: Fast execution (<10s)

## Benefits of This Approach

### ✅ Advantages
- **Reduced complexity**: Simple mocks, fewer dependencies
- **Fast execution**: Minimal setup and teardown
- **Focused testing**: Layout and UI behavior only
- **Maintainable**: Easy to understand and modify
- **Stable**: Less prone to breaking changes

### ⚠️ Limitations
- **Limited integration testing**: Components tested in isolation
- **No API testing**: Network requests not tested
- **No complex state testing**: Advanced state management not covered
- **No performance testing**: Focus on functionality only

## Future Enhancements

### Phase 2 (Optional)
- Add integration tests for component interactions
- Add snapshot testing for UI regression detection
- Add accessibility testing with @testing-library/jest-dom
- Add performance testing for large datasets

### Phase 3 (Optional)
- Add end-to-end testing with Playwright
- Add visual regression testing
- Add cross-browser testing
- Add user interaction testing

## Test Maintenance

### Regular Tasks
- Update mocks when component props change
- Add tests for new UI features
- Maintain coverage above 50%
- Review and update test documentation

### Best Practices
- Keep mocks simple and focused
- Test user-visible behavior, not implementation details
- Use semantic queries (getByText, getByRole)
- Focus on critical user paths
- Maintain clear test descriptions

---

**Status**: ✅ Implementation Complete
**Coverage Target**: 50%
**Test Files**: 3 unit tests + e2e tests
**Approach**: Minimal mocking, layout/UI focused