#!/usr/bin/env python3

import argparse
import os
import re
import subprocess
from datetime import datetime
from typing import Dict, List, Tuple

def parse_args():
    parser = argparse.ArgumentParser(description='Update changelog with PR information')
    parser.add_argument('--pr-number', required=True, help='PR number')
    parser.add_argument('--pr-title', required=True, help='PR title')
    parser.add_argument('--pr-author', required=True, help='PR author')
    parser.add_argument('--base-sha', required=True, help='Base commit SHA')
    parser.add_argument('--head-sha', required=True, help='Head commit SHA')
    return parser.parse_args()

def get_changed_files(base_sha: str, head_sha: str) -> Dict[str, List[str]]:
    """Get changed files using git diff"""
    changes = {'added': [], 'modified': [], 'deleted': []}
    
    try:
        # Get file changes between base and head
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

def categorize_modified_files(files: List[str]) -> Dict[str, List[str]]:
    """Categorize modified files by type"""
    categories = {
        'frontend components': [],
        'backend services': [],
        'tests': [],
        'documentation': [],
        'configuration': [],
        'other': []
    }
    
    for file in files:
        filename = file.lower()
        
        if 'frontend/' in filename and ('.jsx' in filename or '.js' in filename):
            categories['frontend components'].append(file)
        elif 'server/' in filename and '.py' in filename:
            categories['backend services'].append(file)
        elif 'test' in filename or 'spec' in filename:
            categories['tests'].append(file)
        elif '.md' in filename or 'readme' in filename:
            categories['documentation'].append(file)
        elif any(x in filename for x in ['config', '.yml', '.yaml', '.json']):
            categories['configuration'].append(file)
        else:
            categories['other'].append(file)
    
    return categories

def determine_primary_category(title: str) -> str:
    """Determine the primary changelog category based on PR title"""
    title_lower = title.lower()
    
    if any(word in title_lower for word in ['add', 'new', 'feature', 'implement']):
        return 'Added'
    elif any(word in title_lower for word in ['fix', 'bug', 'patch', 'resolve']):
        return 'Fixed'
    elif any(word in title_lower for word in ['remove', 'delete', 'drop']):
        return 'Removed'
    else:
        return 'Changed'

def generate_changelog_entry(pr_number: str, pr_title: str, pr_author: str, file_changes: Dict[str, List[str]]) -> str:
    """Generate a changelog entry for the PR"""
    date = datetime.now().strftime('%Y-%m-%d')
    entry = f"## [{date}] - PR #{pr_number}\n\n"
    entry += f"**{pr_title}** by @{pr_author}\n\n"
    
    # Initialize categories
    categories = {
        'Added': [],
        'Changed': [],
        'Fixed': [],
        'Removed': []
    }
    
    # Determine primary category and add main change
    primary_category = determine_primary_category(pr_title)
    categories[primary_category].append(f"{pr_title} (#{pr_number})")
    
    # Add file-specific changes
    if file_changes['added']:
        categories['Added'].append(f"New files: {', '.join(file_changes['added'])}")
    
    if file_changes['deleted']:
        categories['Removed'].append(f"Removed files: {', '.join(file_changes['deleted'])}")
    
    if file_changes['modified']:
        modified_by_type = categorize_modified_files(file_changes['modified'])
        for file_type, files in modified_by_type.items():
            if files:
                categories['Changed'].append(f"Updated {file_type}: {', '.join(files)}")
    
    # Build the entry
    for category, items in categories.items():
        if items:
            entry += f"### {category}\n"
            for item in items:
                entry += f"- {item}\n"
            entry += "\n"
    
    return entry

def update_changelog(entry: str):
    """Update the changelog file with the new entry"""
    changelog_path = 'CHANGELOG.md'
    
    with open(changelog_path, 'r') as f:
        content = f.read()
    
    # Find the "## [Unreleased]" section
    unreleased_pattern = r'## \[Unreleased\]'
    match = re.search(unreleased_pattern, content)
    
    if not match:
        raise ValueError('Could not find "## [Unreleased]" section in changelog')
    
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

def main():
    args = parse_args()
    
    # Get changed files using git
    file_changes = get_changed_files(args.base_sha, args.head_sha)
    
    # Generate changelog entry
    entry = generate_changelog_entry(
        args.pr_number,
        args.pr_title,
        args.pr_author,
        file_changes
    )
    
    # Update changelog
    update_changelog(entry)
    
    # Print summary
    print(f"Changelog updated for PR #{args.pr_number}: {args.pr_title}")
    print(f"Files changed: {sum(len(files) for files in file_changes.values())}")
    print(f"- Added: {len(file_changes['added'])}")
    print(f"- Modified: {len(file_changes['modified'])}")
    print(f"- Deleted: {len(file_changes['deleted'])}")

if __name__ == '__main__':
    main()