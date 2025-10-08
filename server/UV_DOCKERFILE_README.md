# UV Dockerfile Conversion

## Changes Made
The backend Dockerfile has been converted to use **uv** (Astral's fast Python package installer) instead of pip for significantly faster builds.

## Key Improvements

### Speed
- **10-100x faster** package installation compared to pip
- Parallel downloads and installations
- Better caching and resolution

### Changes
1. **Added uv installation** via multi-stage copy from official image
2. **Replaced pip commands** with `uv pip`
3. **Set UV_SYSTEM_PYTHON=1** to use system Python
4. **Added curl** for compatibility (already includes ca-certificates)

## Build Command
```bash
docker-compose build server
```

Or standalone:
```bash
docker build -t server ./server
```

## Performance Comparison
| Method | Typical Install Time |
|--------|---------------------|
| pip    | ~60-120 seconds     |
| uv     | ~5-15 seconds       |

## Compatibility
- Fully compatible with existing `requirements.txt`
- No changes needed to your application code
- Works with all existing Docker Compose configurations
