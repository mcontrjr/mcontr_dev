Here is a comprehensive but concise changelog based on the provided Git changes:

---

### **New Features**

*   **Automated Changelog Generation System**:
    *   Introduced a new GitHub Actions workflow (`.github/workflows/changelog.yml`) to automatically generate project changelogs from Git changes.
    *   The system uses AI (Gemini model) to intelligently analyze code changes and categorize them into meaningful sections.
    *   Includes features like automatic model selection for cost optimization, token usage statistics, automatic commit/push to `CHANGELOG.md`, artifact upload, and posting changelog previews on merged Pull Requests.
    *   Added a new local Python changelog generator script (`changelog.py`) with advanced prompt optimization and git diff analysis.
    *   Incorporated a rich markdown formatting utility (`markdown_formatter.py`) for terminal output, supporting syntax highlighting for code blocks (Python, JSON, JavaScript), table rendering with borders and alignment, and colored text.
*   **Interactive Transaction Category Editing**:
    *   Implemented a new dropdown UI component within the frontend records table, enabling users to directly edit a transaction's category.
    *   Introduced a new `/api/edit_record/` PUT API endpoint to facilitate updating transaction details (category, description, amount) in the backend.
    *   Updated frontend state management (`useParserData` hook) to ensure real-time record updates reflect in the UI and charts after editing.
    *   Added new `EditRecordRequest` and `EditRecordResponse` Pydantic models for the API and a corresponding `update_record` method in the backend handler.
    *   Expanded backend `CORS_METHODS` to explicitly allow `PUT` requests.
*   **Enhanced Transaction Categorization**:
    *   Added new `ACTIVITIES` and `SHOPPING` transaction categories to improve classification granularity.
    *   Expanded keyword lists for existing categories (`TRAVEL`, `FOOD`, `INTERNET`) to refine automated parsing accuracy.
    *   Refined categorization logic, e.g., "SNOW.COM/VAIL RESORTS SKI" is now correctly classified under "ACTIVITIES".
*   **Frontend Data Mocking for Development**:
    *   Introduced a `PARSER_MOCK` environment variable and corresponding logic in the `useParserData` hook to allow developers to use mock data for frontend development and testing, bypassing API calls. A `mock_parser.json` file was added for this purpose.

### **Bug Fixes**

*   Improved the clarity of the error message displayed to users when a PDF file exceeds the maximum allowed upload size limit.

### **Performance Improvements**

*   **Faster Backend Docker Builds**:
    *   Migrated the backend Dockerfile to utilize `uv` (Astral's fast Python package installer) instead of `pip` for managing dependencies. This significantly reduces package installation times during image builds.
    *   This change includes the integration of `uv` binary into the Docker image and the introduction of `uv.lock` for consistent dependency resolution.
    *   A new `UV_DOCKERFILE_README.md` was added to document this significant improvement.

### **Breaking Changes**

*   None.

### **Other Changes**

*   **Development Environment & Tooling**:
    *   The backend Python development environment is now explicitly configured for `3.13` via a `.python-version` file, with `pyproject.toml` specifying `^3.12` for broader compatibility.
    *   Adopted `pyproject.toml` for standardized backend project metadata and dependency definition.
    *   The local development `uvicorn` server in `setup.bash` now defaults to `--host localhost` for enhanced local security.
*   **Build System & Configuration**:
    *   Added `curl` as a system dependency in the backend Dockerfile for broader compatibility during image builds.
    *   Updated the `.gitignore` file to globally exclude `**/*.log` files, leading to a cleaner repository state.
    *   Removed an unused `pdfjs-dist` optimization from the frontend `vite.config.js`, streamlining the frontend build process.
*   **Test Updates**:
    *   Updated existing API comprehensive tests to correctly reflect the addition of the new `/edit_record/` endpoint.