#!/bin/bash

# Ultra-lightweight changelog generator using only shell tools
# Optimized for maximum reliability and minimal resource usage

set -euo pipefail

# Configuration
readonly SCRIPT_NAME="changelog-minimal"
readonly MAX_DIFF_SIZE=500
readonly TIMEOUT_DURATION=30

# Environment variables
readonly PR_NUMBER="${PR_NUMBER:-}"
readonly PR_TITLE="${PR_TITLE:-}"
readonly PR_AUTHOR="${PR_AUTHOR:-}"
readonly BASE_SHA="${BASE_SHA:-}"
readonly HEAD_SHA="${HEAD_SHA:-}"
readonly GITHUB_TOKEN="${GITHUB_TOKEN:-}"

log() {
    echo "[$SCRIPT_NAME] $*" >&2
}

error() {
    log "ERROR: $*"
    exit 1
}

# Get changed files efficiently
get_changed_files() {
    local added=0 modified=0 deleted=0
    
    if ! git diff --name-status "$BASE_SHA..$HEAD_SHA" 2>/dev/null | while IFS=$'\t' read -r status file; do
        case "$status" in
            A) ((added++)) ;;
            M) ((modified++)) ;;
            D) ((deleted++)) ;;
        esac
    done; then
        log "Warning: Could not get git diff, using fallback counts"
        added=1; modified=0; deleted=0
    fi
    
    echo "$added,$modified,$deleted"
}

# Get minimal diff content
get_diff_content() {
    if ! git diff "$BASE_SHA..$HEAD_SHA" 2>/dev/null | head -c $MAX_DIFF_SIZE; then
        echo "No diff available"
    fi
}

# Categorize changes based on title and file patterns
categorize_changes() {
    local title="$1"
    local title_lower
    title_lower=$(echo "$title" | tr '[:upper:]' '[:lower:]')
    
    case "$title_lower" in
        *add*|*new*|*feat*|*implement*) echo "Added" ;;
        *fix*|*bug*|*patch*|*resolve*) echo "Fixed" ;;
        *remove*|*delete*|*drop*) echo "Removed" ;;
        *security*|*auth*|*vuln*) echo "Security" ;;
        *) echo "Changed" ;;
    esac
}

# Try GitHub Models API with minimal payload
try_github_api() {
    local prompt="$1"
    local payload
    
    if [[ -z "$GITHUB_TOKEN" ]]; then
        return 1
    fi
    
    log "Attempting GitHub Models API..."
    
    # Create minimal JSON payload
    payload=$(cat <<EOF
{
  "model": "gpt-4.1-mini",
  "messages": [
    {"role": "system", "content": "Analyze code changes. Respond with JSON: {\"category\":\"Added|Changed|Fixed|Removed|Security\",\"summary\":\"brief description\"}"},
    {"role": "user", "content": "$prompt"}
  ],
  "max_tokens": 150,
  "temperature": 0.1
}
EOF
)
    
    # Make API request with timeout
    if response=$(timeout $TIMEOUT_DURATION curl -s -X POST \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        -H "User-Agent: GitHub-Actions-Changelog/1.0" \
        -d "$payload" \
        "https://models.githubusercontent.com/v1/chat/completions" 2>/dev/null); then
        
        # Extract JSON content from response
        if content=$(echo "$response" | grep -o '"content":"[^"]*"' | cut -d'"' -f4 2>/dev/null); then
            log "GitHub API successful"
            echo "$content"
            return 0
        fi
    fi
    
    log "GitHub API failed or timed out"
    return 1
}

# Try lightweight Ollama with ultra-fast models
try_ollama() {
    local prompt="$1"
    local models=("phi3:mini" "gemma2:2b" "tinyllama")
    
    if ! curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        log "Ollama not available"
        return 1
    fi
    
    for model in "${models[@]}"; do
        log "Trying Ollama model: $model"
        
        local payload
        payload=$(cat <<EOF
{
  "model": "$model",
  "prompt": "$prompt Respond only with JSON: {\"category\":\"Added|Changed|Fixed|Removed|Security\",\"summary\":\"brief description\"}",
  "stream": false,
  "options": {
    "temperature": 0.2,
    "num_predict": 100
  }
}
EOF
)
        
        if response=$(timeout $TIMEOUT_DURATION curl -s -X POST \
            -H "Content-Type: application/json" \
            -d "$payload" \
            "http://localhost:11434/api/generate" 2>/dev/null); then
            
            if content=$(echo "$response" | grep -o '"response":"[^"]*"' | cut -d'"' -f4 2>/dev/null); then
                log "Ollama ($model) successful"
                echo "$content"
                return 0
            fi
        fi
        
        log "Ollama ($model) failed"
    done
    
    return 1
}

# Generate rule-based analysis (always succeeds)
generate_rule_based() {
    local title="$1"
    local file_stats="$2"
    local category
    
    category=$(categorize_changes "$title")
    
    # Create JSON response
    cat <<EOF
{
  "category": "$category",
  "summary": "$title (rule-based analysis)",
  "impact": "$category: $title"
}
EOF
}

# Parse any AI response into structured format
parse_ai_response() {
    local response="$1"
    local category summary
    
    # Try to extract JSON fields
    if category=$(echo "$response" | grep -o '"category":\s*"[^"]*"' | cut -d'"' -f4 2>/dev/null) && \
       summary=$(echo "$response" | grep -o '"summary":\s*"[^"]*"' | cut -d'"' -f4 2>/dev/null); then
        echo "{\"category\":\"$category\",\"summary\":\"$summary\"}"
    else
        # Fallback: use the response as summary
        category=$(categorize_changes "$PR_TITLE")
        summary=$(echo "$response" | head -c 100)
        echo "{\"category\":\"$category\",\"summary\":\"$summary\"}"
    fi
}

# Generate changelog entry
generate_changelog_entry() {
    local analysis="$1"
    local file_stats="$2"
    local date category summary
    
    date=$(date +%Y-%m-%d)
    category=$(echo "$analysis" | grep -o '"category":\s*"[^"]*"' | cut -d'"' -f4)
    summary=$(echo "$analysis" | grep -o '"summary":\s*"[^"]*"' | cut -d'"' -f4)
    
    cat <<EOF
## [$date] - PR #$PR_NUMBER (minimal)

**$PR_TITLE** by @$PR_AUTHOR

*$summary*

### $category
- $PR_TITLE
- Files changed: $file_stats

EOF
}

# Update changelog file
update_changelog() {
    local entry="$1"
    local changelog="CHANGELOG.md"
    local temp_file
    temp_file=$(mktemp)
    
    if [[ ! -f "$changelog" ]]; then
        log "Creating new CHANGELOG.md"
        cat > "$changelog" <<EOF
# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

EOF
    fi
    
    # Insert after [Unreleased] section
    if grep -q "## \[Unreleased\]" "$changelog"; then
        # Find line number of [Unreleased]
        local line_num
        line_num=$(grep -n "## \[Unreleased\]" "$changelog" | cut -d: -f1)
        
        # Insert entry after [Unreleased]
        head -n "$line_num" "$changelog" > "$temp_file"
        echo "" >> "$temp_file"
        echo "$entry" >> "$temp_file"
        tail -n +$((line_num + 1)) "$changelog" >> "$temp_file"
        
        mv "$temp_file" "$changelog"
    else
        # Fallback: append to end
        echo "$entry" >> "$changelog"
    fi
    
    log "Changelog updated successfully"
}

# Main execution
main() {
    local start_time file_stats diff_content prompt analysis
    
    start_time=$(date +%s)
    log "Starting minimal changelog generation for PR #$PR_NUMBER"
    
    # Validate required variables
    [[ -n "$PR_NUMBER" ]] || error "PR_NUMBER not set"
    [[ -n "$PR_TITLE" ]] || error "PR_TITLE not set"
    [[ -n "$PR_AUTHOR" ]] || error "PR_AUTHOR not set"
    [[ -n "$BASE_SHA" ]] || error "BASE_SHA not set"
    [[ -n "$HEAD_SHA" ]] || error "HEAD_SHA not set"
    
    # Get change information
    file_stats=$(get_changed_files)
    diff_content=$(get_diff_content)
    
    log "Files changed: $file_stats"
    
    # Create optimized prompt
    prompt="PR: '$PR_TITLE' by $PR_AUTHOR. Files: $file_stats. Changes: ${diff_content:0:200}"
    
    # Try AI analysis (progressive fallback)
    analysis=""
    
    # Tier 1: GitHub Models API
    if [[ -n "$GITHUB_TOKEN" ]]; then
        if ai_response=$(try_github_api "$prompt"); then
            analysis=$(parse_ai_response "$ai_response")
        fi
    fi
    
    # Tier 2: Lightweight Ollama
    if [[ -z "$analysis" ]] && [[ "${OLLAMA_AVAILABLE:-false}" == "true" ]]; then
        if ai_response=$(try_ollama "$prompt"); then
            analysis=$(parse_ai_response "$ai_response")
        fi
    fi
    
    # Tier 3: Rule-based (always works)
    if [[ -z "$analysis" ]]; then
        log "Using rule-based analysis"
        analysis=$(generate_rule_based "$PR_TITLE" "$file_stats")
    fi
    
    # Generate and update changelog
    entry=$(generate_changelog_entry "$analysis" "$file_stats")
    update_changelog "$entry"
    
    local duration=$(($(date +%s) - start_time))
    log "Completed in ${duration}s"
    
    # Output summary
    local category summary
    category=$(echo "$analysis" | grep -o '"category":\s*"[^"]*"' | cut -d'"' -f4)
    summary=$(echo "$analysis" | grep -o '"summary":\s*"[^"]*"' | cut -d'"' -f4)
    
    log "Category: $category"
    log "Summary: ${summary:0:100}${#summary -gt 100:+...}"
}

# Execute if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi