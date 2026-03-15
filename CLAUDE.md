# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack financial management web app (mcontr.dev) that parses PDF bank statements and visualizes transactions. Stack: PostgreSQL + FastAPI (`server/`) + React/Vite (`frontend/`). Deployed via Docker Compose.

## Commands

### Backend (run from `server/`)
```bash
# Activate venv first
source .venv/bin/activate

# Run all tests (requires 80% coverage)
pytest

# Run a single test file
pytest tests/test_parser.py

# Run tests by marker
pytest -m parser
pytest -m unit

# Run server locally
uvicorn main:app --reload
```

### Frontend (run from `frontend/`)
```bash
npm run dev          # Start Vite dev server (port 5173)
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:coverage
npm run test:e2e     # Playwright e2e (basic page load)
npm run test:all     # Unit + e2e
```

### Full App
```bash
./run.bash           # Start all containers (production)
./run.bash --dev     # Start with hot-reloading
./run.bash --down    # Stop and remove containers
```

## Architecture

### Backend (`server/`)
- `main.py` — FastAPI app, all route definitions. Mounted at `/api` root path.
- `src/parser.py` — Core PDF parser. Auto-detects bank from first/last page text, then dispatches to one of three parse strategies:
  - `parse_purchases_from_text()` — Amex, Citi, Discover, Schwab (line-by-line with date regex)
  - `parse_purchases_from_tabular()` — Capital One (regex matches on multi-column rows)
  - `parse_transactions_from_checkings()` — Schwab checking (handles debits/credits)
- `src/config.py` — All env vars, CORS origins, `CATEGORY_KEYWORDS` dict (edit here to add/change categories)
- `src/handler.py` — `PostgresHandler`: saves/retrieves/updates/clears records in PostgreSQL
- `src/models.py` — Pydantic models for API request/response + `BankType`/`TransactionCategory` enums
- `src/error_handler.py` — `@handle_api_errors` decorator used on all routes

**Session isolation**: Every API call requires a `session_id` (UUID4). Records are scoped to the session — users never see each other's data.

**Bank detection**: `Parser.determine_bank()` checks first+last page text for bank-specific keywords ("American Express", "Citi", "Discover Bank", "Capital One", "Schwab").

### Frontend (`frontend/src/`)
- `index.jsx` — Router root. Routes: `/`, `/info`, `/guess`, `/random`, `/weather`, `/parser`
- `parser.jsx` — Main finance parser page; orchestrates upload + data visualization
- `hooks/useParserData.js` — All state and API calls for the parser feature (records, bank filter, month filter, charts, session management)
- `hooks/useErrorHandler.js` — Centralized error handling hook
- `components/parser/` — Upload section, tabbed breakdown, charts, filter controls
- `components/UI/` — Shared layout components (header, footer, cards)
- `utils/dataProcessing.js` — Chart data transformation utilities

### Database
Single table `bank_statements` (defined in `sql/init.sql`):
```
id, bank, date, description, amount, category, session_id
```

## Environment Variables

Required in `.env` at repo root:
```
DB_NAME, DB_USER, DB_PASSWORD, DB_PORT, DB_HOST
SERVER_PORT, FRONTEND_PORT, API_URL
```

## Testing

- Backend tests use `pytest-mock` for mocking DB/file I/O. Mock bank statement text fixtures are in `server/tests/mock_*.txt`.
- Frontend unit tests use Vitest + Testing Library. E2e tests use Playwright.
- Coverage threshold: 80% (enforced in `pytest.ini`).

## Adding a New Bank

1. Add a `BankConfig` subclass in `server/src/parser.py`
2. Add detection logic in `Parser.determine_bank()`
3. Add `BankType` enum value in `server/src/models.py`
4. Add mock statement text in `server/tests/` and test cases in `test_parser.py`
