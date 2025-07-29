#!/usr/bin/env python3

import argparse
import json
import os
import re
import subprocess
import asyncio
import aiohttp
from datetime import datetime
from typing import Dict, List, Tuple, Optional

class OllamaClient:
    """Client for interacting with Ollama API"""

    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.session = None

    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def generate(self, model: str, prompt: str, system: str = None) -> str:
        """Generate response using Ollama model"""
        if not self.session:
            raise RuntimeError("Client not initialized. Use async context manager.")

        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.8,
                "num_predict": 500
            }
        }

        if system:
            payload["system"] = system

        try:
            async with self.session.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result.get("response", "").strip()
                else:
                    error_text = await response.text()
                    raise Exception(f"Ollama API error {response.status}: {error_text}")
        except asyncio.TimeoutError:
            raise Exception("Ollama API request timed out")
        except Exception as e:
            raise Exception(f"Failed to communicate with Ollama: {str(e)}")

def parse_args():
    parser = argparse.ArgumentParser(description='Update changelog with AI-powered analysis')
    parser.add_argument('--pr-number', required=True, help='PR number')
    parser.add_argument('--pr-title', required=True, help='PR title')
    parser.add_argument('--pr-author', required=True, help='PR author')
    parser.add_argument('--base-sha', required=True, help='Base commit SHA')
    parser.add_argument('--head-sha', required=True, help='Head commit SHA')
    parser.add_argument('--ollama-model', default='codellama:7b-code', help='Ollama model to use')
    parser.add_argument('--ollama-url', default='http://localhost:11434', help='Ollama API URL')
    parser.add_argument('--no-ai', action='store_true', help='Skip AI analysis, use basic categorization only')
    return parser.parse_args()

def get_changed_files(base_sha: str, head_sha: str) -> Dict[str, List[str]]:
    """Get changed files using git diff"""
    changes = {'added': [], 'modified': [], 'deleted': []}

    try:
        result = subprocess.run(
            ['git', 'diff', '--name-status', f'{base_sha}..{head_sha}'],
            capture_output=True,
            text=True,
            check=True
        )

        for line in result.stdout.strip().split('\n'):
            if not line:
                continue

            parts = line.split('\t')
            if len(parts) < 2:
                continue

            status = parts[0]
            filename = parts[1]

            if status == 'A':
                changes['added'].append(filename)
            elif status == 'M':
                changes['modified'].append(filename)
            elif status == 'D':
                changes['deleted'].append(filename)

    except subprocess.CalledProcessError as e:
        print(f"Error getting changed files: {e}")
        return changes

    return changes

def get_diff_content(base_sha: str, head_sha: str) -> str:
    """Get diff content directly from git"""
    try:
        result = subprocess.run(
            ['git', 'diff', f'{base_sha}..{head_sha}'],
            capture_output=True,
            text=True,
            check=True
        )

        diff_content = result.stdout

        # Limit diff size for AI processing (max 8000 chars for better context)
        if len(diff_content) > 2000:
            diff_content = diff_content[:2000] + "\n... [truncated for AI analysis]"

        return diff_content

    except subprocess.CalledProcessError as e:
        print(f"Error getting diff content: {e}")
        return ""
    except Exception as e:
        print(f"Unexpected error getting diff: {e}")
        return ""

def create_analysis_prompt(pr_title: str, pr_author: str, diff_content: str, file_changes: Dict[str, List[str]]) -> str:
    """Create a comprehensive prompt for AI analysis"""

    prompt = f"""Analyze this pull request and provide a structured changelog entry.

PR DETAILS:
- Title: {pr_title}
- Author: {pr_author}
- Files Added: {len(file_changes['added'])}
- Files Modified: {len(file_changes['modified'])}
- Files Deleted: {len(file_changes['deleted'])}

CHANGED FILES:
Added: {', '.join(file_changes['added'][:10]) + ('...' if len(file_changes['added']) > 10 else '')}
Modified: {', '.join(file_changes['modified'][:10]) + ('...' if len(file_changes['modified']) > 10 else '')}
Deleted: {', '.join(file_changes['deleted'][:10]) + ('...' if len(file_changes['deleted']) > 10 else '')}

CODE DIFF:
{diff_content}

INSTRUCTIONS:
1. Categorize the changes into: Added, Changed, Fixed, Removed, Security
2. Provide a 1-2 sentence technical summary of what was changed
3. Identify the primary impact/purpose of this PR
4. Note any significant architectural or dependency changes
5. Flag any potential security implications

Respond in this exact JSON format:
{{
    "category": "Added|Changed|Fixed|Removed|Security",
    "summary": "Brief technical description of changes",
    "impact": "Primary purpose/impact of this PR",
    "details": [
        "Specific change 1",
        "Specific change 2"
    ],
    "architectural_changes": "Description if any significant architectural changes",
    "security_notes": "Any security implications or improvements"
}}"""

    return prompt

async def analyze_changes_with_ai(ollama_client: OllamaClient, model: str, pr_title: str, pr_author: str, diff_content: str, file_changes: Dict[str, List[str]]) -> Dict:
    """Use AI to analyze the changes and generate intelligent summary"""

    system_prompt = """You are an expert software engineer analyzing code changes for changelog generation.
Focus on the technical impact and user-facing changes. Be concise but informative.
Always respond with valid JSON as requested."""

    analysis_prompt = create_analysis_prompt(pr_title, pr_author, diff_content, file_changes)

    try:
        response = await ollama_client.generate(
            model=model,
            prompt=analysis_prompt,
            system=system_prompt
        )

        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Fallback: create structured response from text
        return create_fallback_analysis(pr_title, response, file_changes)

    except Exception as e:
        print(f"AI analysis failed: {e}")
        return create_fallback_analysis(pr_title, f"AI analysis unavailable: {str(e)}", file_changes)

def create_fallback_analysis(pr_title: str, ai_response: str, file_changes: Dict[str, List[str]]) -> Dict:
    """Create fallback analysis when AI response is invalid"""

    # Determine category from title
    title_lower = pr_title.lower()
    if any(word in title_lower for word in ['add', 'new', 'feature', 'implement']):
        category = 'Added'
    elif any(word in title_lower for word in ['fix', 'bug', 'patch', 'resolve']):
        category = 'Fixed'
    elif any(word in title_lower for word in ['remove', 'delete', 'drop']):
        category = 'Removed'
    elif any(word in title_lower for word in ['security', 'auth', 'permission']):
        category = 'Security'
    else:
        category = 'Changed'

    details = []
    if file_changes['added']:
        details.append(f"Added {len(file_changes['added'])} new files")
    if file_changes['modified']:
        details.append(f"Modified {len(file_changes['modified'])} existing files")
    if file_changes['deleted']:
        details.append(f"Removed {len(file_changes['deleted'])} files")

    return {
        "category": category,
        "summary": f"{pr_title} - {ai_response[:100]}..." if len(ai_response) > 100 else ai_response,
        "impact": f"Updates to project functionality via {pr_title}",
        "details": details if details else [pr_title],
        "architectural_changes": "",
        "security_notes": ""
    }

def generate_changelog_entry(pr_number: str, pr_title: str, pr_author: str, ai_analysis: Dict, file_changes: Dict[str, List[str]]) -> str:
    """Generate changelog entry from AI analysis"""
    date = datetime.now().strftime('%Y-%m-%d')
    entry = f"## [{date}] - PR #{pr_number}\n\n"
    entry += f"**{pr_title}** by @{pr_author}\n\n"

    # Add AI-generated summary
    if ai_analysis.get('summary'):
        entry += f"*{ai_analysis['summary']}*\n\n"

    # Primary category based on AI analysis
    primary_category = ai_analysis.get('category', 'Changed')

    # Initialize categories
    categories = {
        'Added': [],
        'Changed': [],
        'Fixed': [],
        'Removed': [],
        'Security': []
    }

    # Add main change to appropriate category
    if ai_analysis.get('impact'):
        categories[primary_category].append(ai_analysis['impact'])

    # Add AI-identified details
    for detail in ai_analysis.get('details', []):
        if detail and detail not in categories[primary_category]:
            categories[primary_category].append(detail)

    # Add file-specific changes if not covered by AI analysis
    categories_str = str(categories).lower()
    if file_changes['added'] and not any(word in categories_str for word in ['added', 'new']):
        if len(file_changes['added']) <= 3:
            categories['Added'].append(f"New files: {', '.join(file_changes['added'])}")
        else:
            categories['Added'].append(f"Added {len(file_changes['added'])} new files")

    if file_changes['deleted'] and not any(word in categories_str for word in ['removed', 'deleted']):
        if len(file_changes['deleted']) <= 3:
            categories['Removed'].append(f"Removed files: {', '.join(file_changes['deleted'])}")
        else:
            categories['Removed'].append(f"Removed {len(file_changes['deleted'])} files")

    # Build the entry
    for category, items in categories.items():
        if items:
            entry += f"### {category}\n"
            for item in items:
                entry += f"- {item}\n"
            entry += "\n"

    # Add architectural notes if present
    if ai_analysis.get('architectural_changes'):
        entry += f"### Technical Notes\n- {ai_analysis['architectural_changes']}\n\n"

    # Add security notes if present
    if ai_analysis.get('security_notes'):
        entry += f"### Security\n- {ai_analysis['security_notes']}\n\n"

    return entry

def update_changelog(entry: str):
    """Update the changelog file with the new entry"""
    changelog_path = 'CHANGELOG.md'

    try:
        with open(changelog_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print("CHANGELOG.md not found, creating new one")
        content = "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## [Unreleased]\n\n"

    # Find the "## [Unreleased]" section
    unreleased_pattern = r'## \[Unreleased\]'
    match = re.search(unreleased_pattern, content)

    if not match:
        print('Warning: Could not find "## [Unreleased]" section, appending to top')
        updated_content = content.split('\n', 3)
        if len(updated_content) >= 3:
            updated_content = '\n'.join(updated_content[:3]) + '\n\n' + entry + '\n' + '\n'.join(updated_content[3:])
        else:
            updated_content = content + '\n\n' + entry
    else:
        # Find the next section or separator
        insert_pos = match.end()

        # Look for the next ## section or the --- separator
        next_section = re.search(r'\n## \[', content[insert_pos:])
        separator = re.search(r'\n---', content[insert_pos:])

        if next_section:
            insert_pos += next_section.start()
        elif separator:
            insert_pos += separator.start()
        else:
            insert_pos = len(content)

        # Insert the new entry
        updated_content = content[:insert_pos] + '\n' + entry + content[insert_pos:]

    with open(changelog_path, 'w') as f:
        f.write(updated_content)

async def main():
    args = parse_args()

    print(f"Starting AI-powered changelog generation for PR #{args.pr_number}")

    # Get changed files using git
    file_changes = get_changed_files(args.base_sha, args.head_sha)

    # Get diff content directly from git
    diff_content = get_diff_content(args.base_sha, args.head_sha)
    if not diff_content:
        print("Warning: No diff content available, using basic analysis")
        diff_content = "No diff content available"

    # Analyze changes with AI (if enabled and available)
    if args.no_ai:
        print("Skipping AI analysis (--no-ai flag set)")
        ai_analysis = create_fallback_analysis(args.pr_title, "AI analysis skipped", file_changes)
    else:
        try:
            async with OllamaClient(args.ollama_url) as ollama_client:
                print("Analyzing changes with AI...")
                ai_analysis = await analyze_changes_with_ai(
                    ollama_client,
                    args.ollama_model,
                    args.pr_title,
                    args.pr_author,
                    diff_content,
                    file_changes
                )
        except Exception as e:
            print(f"AI analysis failed, using fallback: {e}")
            ai_analysis = create_fallback_analysis(args.pr_title, f"AI unavailable: {str(e)[:50]}...", file_changes)

    # Generate changelog entry
    entry = generate_changelog_entry(
        args.pr_number,
        args.pr_title,
        args.pr_author,
        ai_analysis,
        file_changes
    )

    # Update changelog
    update_changelog(entry)

    # Print summary
    print(f"Changelog updated for PR #{args.pr_number}: {args.pr_title}")
    print(f"AI Analysis Category: {ai_analysis.get('category', 'Unknown')}")
    print(f"Files changed: {sum(len(files) for files in file_changes.values())}")
    print(f"- Added: {len(file_changes['added'])}")
    print(f"- Modified: {len(file_changes['modified'])}")
    print(f"- Deleted: {len(file_changes['deleted'])}")
    print(f"AI Summary: {ai_analysis.get('summary', 'No summary available')[:100]}...")

if __name__ == '__main__':
    asyncio.run(main())