Here is a comprehensive but concise changelog based on the provided Git changes:

---

### **New Features**

*   **Interactive Category Editing:**
    *   Introduced a new dropdown UI component in the records table, allowing users to directly edit a transaction's category.
    *   Implemented a new `/api/edit_record/` PUT API endpoint to update transaction details (category, description, amount) in the backend.
    *   Updated frontend data models and state management (`useParserData` hook) to support real-time record updates after editing.
    *   Expanded backend `CORS_METHODS` to include `PUT` requests.
*   **Enhanced Transaction Categorization:**
    *   Added new `ACTIVITIES` and `SHOPPING` transaction categories.
    *   Expanded keyword lists for existing categories (`TRAVEL`, `FOOD`, `INTERNET`) to improve automated parsing accuracy.
*   **Frontend Data Mocking:**
    *   Introduced a `PARSER_MOCK` environment variable and corresponding logic in `useParserData` to enable using mock data for frontend development and testing, bypassing API calls.

### **Bug Fixes**

*   Improved the clarity of the error message displayed when a user attempts to upload a PDF file exceeding the maximum size limit.

### **Performance Improvements**

*   **Faster Backend Docker Builds:**
    *   Migrated the backend Dockerfile to use `uv` (Astral's fast Python package installer) instead of `pip`, significantly reducing package installation times during image builds.
    *   A new `UV_DOCKERFILE_README.md` has been added to document this change and its benefits.

### **Breaking Changes**

*   None.

### **Other Changes**

*   **Development Environment:**
    *   Backend Python version is now explicitly set to `3.13` via a `.python-version` file.
    *   Adopted `pyproject.toml` for standardized backend project metadata and dependency definition.
    *   Added `uv.lock` for consistent dependency resolution with `uv`.
    *   The local development `uvicorn` server in `setup.bash` now defaults to `--host localhost` for improved local security.
*   **Build System & Configuration:**
    *   Updated `.gitignore` to include `**/*.log` files.
    *   Removed an unused `pdfjs-dist` optimization from the frontend `vite.config.js`.
    *   Added `curl` as a system dependency in the backend Dockerfile for broader compatibility.