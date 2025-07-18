# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial project setup with changelog automation

### Changed

### Fixed

### Removed

## [2025-07-18] - PR #7

**Sc frontend analysis** by @mcontrjr

### Added
- New files: frontend/E2E-FIXES.md, frontend/TEST.md, frontend/src/components/UI/Card.jsx, frontend/src/components/UI/ErrorBoundary.jsx, frontend/src/components/parser/ParserComponents.jsx, frontend/src/hooks/useErrorHandler.js, frontend/test/e2e/basic-page-load.spec.js

### Changed
- Sc frontend analysis (#7)
- Updated frontend components: frontend/package.json, frontend/playwright.config.js, frontend/src/guess.jsx, frontend/src/hooks/useParserData.js, frontend/src/hooks/useThemeColors.js, frontend/src/index.jsx, frontend/src/info.jsx, frontend/src/main.jsx, frontend/src/parser.jsx, frontend/src/random.jsx, frontend/src/weather.jsx, frontend/test/e2e/layout/responsive.spec.js, frontend/test/e2e/layout/theme-accessibility.spec.js, frontend/test/e2e/parser/data-visualization.spec.js, frontend/test/e2e/parser/upload-functionality.spec.js, frontend/test/layout.test.jsx, frontend/test/mobile-layout.test.jsx, frontend/test/parser-ui.test.jsx, frontend/test/setup.js, frontend/vite.config.js, frontend/vitest.config.js
- Updated tests: .github/workflows/frontend-tests.yml
- Updated other: frontend/dist/index.html, frontend/styles/parser.css, frontend/styles/stock.css

### Removed
- Removed files: frontend/src/components/PDFThumbnail.jsx, frontend/src/components/ParserComponents.jsx, frontend/src/styles/parser-mobile.css, frontend/src/styles/pdf-thumbnail.css


## [2025-07-17] - PR #6

**Add more banks** by @mcontrjr

### Added
- Add more banks (#6)


## [2025-07-17] - PR #5

**Api improvements** by @mcontrjr

### Changed
- Api improvements (#5)


## [2025-07-16] - PR #123

**Add new feature for user authentication** by @testuser

### Added
- Add new feature for user authentication (#123)

### Changed
- Updated backend services: server/openapi_spec.py, server/run_tests.py, server/src/parser.py
- Updated configuration: server/openapi.json


---

*This changelog is automatically updated when PRs are merged. Changes are categorized by type and include file modifications.*