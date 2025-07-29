#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import fetch from 'node-fetch';

// Configuration with progressive timeouts
const CONFIG = {
  tiers: [
    {
      name: 'GitHub Models API',
      timeout: 15000, // 15s for cloud API
      model: 'gpt-4.1-mini',
      maxTokens: 300,
      maxContext: 1000
    },
    {
      name: 'Lightweight Ollama',
      timeout: 300000, // 300s for local lightweight
      model: 'llama3.2:1b',
      fallbackModel: 'gemma2:2b',
      maxTokens: 200,
      maxContext: 800
    },
    {
      name: 'Rule-based Fallback',
      timeout: 1000, // 1s for rule-based
      maxContext: 500
    }
  ]
};

class PerformantChangelogGenerator {
  constructor(options = {}) {
    // Support both command line args and environment variables
    this.prNumber = options.prNumber || process.env.PR_NUMBER;
    this.prTitle = options.prTitle || process.env.PR_TITLE;
    this.prAuthor = options.prAuthor || process.env.PR_AUTHOR;
    this.baseSha = options.baseSha || process.env.BASE_SHA;
    this.headSha = options.headSha || process.env.HEAD_SHA;
    this.githubToken = options.githubToken || process.env.GITHUB_TOKEN;
    this.repository = options.repository || process.env.GITHUB_REPOSITORY;
    this.ollamaAvailable = options.ollamaAvailable || process.env.OLLAMA_AVAILABLE === 'true';
  }

  // GitHub Models API (Tier 1 - Fastest)
  async analyzeWithGitHubModels(diffContent, fileChanges) {
    console.log('🚀 Attempting GitHub Models API (GPT-4.1-mini)...');

    const prompt = this.createOptimizedPrompt(diffContent, fileChanges, 'compact');
    const payload = {
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a changelog expert. Analyze code changes and respond with a brief JSON summary.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: CONFIG.tiers[0].maxTokens,
      temperature: 0.1
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.tiers[0].timeout);

      const response = await fetch('https://models.githubusercontent.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.githubToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'GitHub-Actions-Changelog/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const analysis = this.parseAIResponse(content);
          console.log('✅ GitHub Models API succeeded');
          return analysis;
        }
      }
      throw new Error(`GitHub Models API failed: ${response.status}`);
    } catch (error) {
      console.log(`❌ GitHub Models API failed: ${error.message}`);
      return null;
    }
  }

  // Lightweight Ollama (Tier 2 - Local fallback)
  async analyzeWithOllama(diffContent, fileChanges) {
    if (!this.ollamaAvailable) {
      console.log('⚠️ Ollama not available, skipping...');
      return null;
    }

    console.log('🔄 Attempting lightweight Ollama models...');

    const models = [CONFIG.tiers[1].model, CONFIG.tiers[1].fallbackModel];

    for (const model of models) {
      try {
        console.log(`🧪 Trying ${model}...`);
        const prompt = this.createOptimizedPrompt(diffContent, fileChanges, 'simple');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.tiers[1].timeout);

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt,
            stream: false,
            options: {
              temperature: 0.2,
              num_predict: CONFIG.tiers[1].maxTokens,
              top_p: 0.8
            }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.response) {
            const analysis = this.parseAIResponse(data.response);
            console.log(`✅ Ollama (${model}) succeeded`);
            return analysis;
          }
        }
      } catch (error) {
        console.log(`❌ Ollama (${model}) failed: ${error.message}`);
        continue;
      }
    }

    return null;
  }

  // Rule-based Analysis (Tier 3 - Always works)
  async analyzeWithRules(diffContent, fileChanges) {
    console.log('🛠️ Using rule-based analysis (fallback)...');

    const title = this.prTitle.toLowerCase();
    let category = 'Changed';

    // Smart categorization based on title and files
    if (title.includes('add') || title.includes('new') || title.includes('feat') || fileChanges.added.length > 0) {
      category = 'Added';
    } else if (title.includes('fix') || title.includes('bug') || title.includes('patch')) {
      category = 'Fixed';
    } else if (title.includes('remove') || title.includes('delete') || fileChanges.deleted.length > 0) {
      category = 'Removed';
    } else if (title.includes('security') || title.includes('auth') || title.includes('vuln')) {
      category = 'Security';
    }

    const summary = this.generateRuleBasedSummary(fileChanges, title);

    console.log('✅ Rule-based analysis completed');
    return {
      category,
      summary,
      impact: `${category}: ${this.prTitle}`,
      details: this.generateRuleBasedDetails(fileChanges),
      confidence: 'rule-based'
    };
  }

  // Optimized prompts for different tiers
  createOptimizedPrompt(diffContent, fileChanges, style = 'compact') {
    const maxContext = CONFIG.tiers[style === 'compact' ? 0 : 1].maxContext;
    const truncatedDiff = diffContent.length > maxContext
      ? diffContent.substring(0, maxContext) + '...[truncated]'
      : diffContent;

    if (style === 'compact') {
      return `PR: "${this.prTitle}"
Author: ${this.prAuthor}
Files: +${fileChanges.added.length} ~${fileChanges.modified.length} -${fileChanges.deleted.length}

Diff:
${truncatedDiff}

Respond only with JSON:
{"category":"Added|Changed|Fixed|Removed|Security","summary":"Brief technical summary","impact":"User-facing impact"}`;
    } else {
      return `Analyze this PR: "${this.prTitle}"
Changes: ${fileChanges.added.length + fileChanges.modified.length + fileChanges.deleted.length} files
Code: ${truncatedDiff}

JSON response only:
{"category":"Added|Changed|Fixed|Removed|Security","summary":"What changed","impact":"Why it matters"}`;
    }
  }

  // Enhanced JSON parsing with fallbacks
  parseAIResponse(response) {
    try {
      // Try direct JSON parse
      return JSON.parse(response);
    } catch {
      // Extract JSON from text
      const jsonMatch = response.match(/\{[^}]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Continue to fallback
        }
      }

      // Extract key information with regex
      const category = (response.match(/category['"]\s*:\s*['"]([^'"]+)/i) || [])[1] || 'Changed';
      const summary = (response.match(/summary['"]\s*:\s*['"]([^'"]+)/i) || [])[1] || response.substring(0, 100);
      const impact = (response.match(/impact['"]\s*:\s*['"]([^'"]+)/i) || [])[1] || this.prTitle;

      return { category, summary, impact };
    }
  }

  generateRuleBasedSummary(fileChanges, title) {
    const totalFiles = fileChanges.added.length + fileChanges.modified.length + fileChanges.deleted.length;

    if (totalFiles === 1) {
      if (fileChanges.added.length) return `Added ${fileChanges.added[0]}`;
      if (fileChanges.modified.length) return `Updated ${fileChanges.modified[0]}`;
      if (fileChanges.deleted.length) return `Removed ${fileChanges.deleted[0]}`;
    }

    return `${title} (${totalFiles} files changed)`;
  }

  generateRuleBasedDetails(fileChanges) {
    const details = [];
    if (fileChanges.added.length) details.push(`Added ${fileChanges.added.length} files`);
    if (fileChanges.modified.length) details.push(`Modified ${fileChanges.modified.length} files`);
    if (fileChanges.deleted.length) details.push(`Removed ${fileChanges.deleted.length} files`);
    return details.length ? details : [this.prTitle];
  }

  // Get git changes efficiently
  getChangedFiles() {
    try {
      const output = execSync(`git diff --name-status ${this.baseSha}..${this.headSha}`, { encoding: 'utf8' });
      const changes = { added: [], modified: [], deleted: [] };

      for (const line of output.split('\n').filter(Boolean)) {
        const [status, file] = line.split('\t');
        if (status === 'A') changes.added.push(file);
        else if (status === 'M') changes.modified.push(file);
        else if (status === 'D') changes.deleted.push(file);
      }

      return changes;
    } catch (error) {
      console.error('Error getting changed files:', error.message);
      return { added: [], modified: [], deleted: [] };
    }
  }

  getDiffContent() {
    try {
      const output = execSync(`git diff ${this.baseSha}..${this.headSha}`, { encoding: 'utf8' });
      // Aggressive truncation for performance
      return output.length > 1500 ? output.substring(0, 1500) + '\n...[truncated]' : output;
    } catch (error) {
      console.error('Error getting diff:', error.message);
      return 'No diff available';
    }
  }

  // Generate changelog entry
  generateChangelogEntry(analysis, fileChanges) {
    const date = new Date().toISOString().split('T')[0];
    const confidence = analysis.confidence ? ` (${analysis.confidence})` : '';

    let entry = `## [${date}] - PR #${this.prNumber}${confidence}\n\n`;
    entry += `**${this.prTitle}** by @${this.prAuthor}\n\n`;

    if (analysis.summary) {
      entry += `*${analysis.summary}*\n\n`;
    }

    const category = analysis.category || 'Changed';
    entry += `### ${category}\n`;

    if (analysis.impact) {
      entry += `- ${analysis.impact}\n`;
    }

    if (analysis.details && Array.isArray(analysis.details)) {
      for (const detail of analysis.details) {
        entry += `- ${detail}\n`;
      }
    }

    entry += '\n';
    return entry;
  }

  // Update changelog file
  updateChangelog(entry) {
    const changelogPath = 'CHANGELOG.md';
    let content;

    try {
      content = readFileSync(changelogPath, 'utf8');
    } catch {
      console.log('Creating new CHANGELOG.md');
      content = '# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n## [Unreleased]\n\n';
    }

    // Find insertion point after [Unreleased]
    const unreleasedMatch = content.match(/## \[Unreleased\]/);
    if (unreleasedMatch) {
      const insertPos = unreleasedMatch.index + unreleasedMatch[0].length;
      const nextSection = content.indexOf('\n## [', insertPos);
      const actualInsertPos = nextSection !== -1 ? nextSection : content.length;

      content = content.slice(0, actualInsertPos) + '\n' + entry + content.slice(actualInsertPos);
    } else {
      // Fallback: append after header
      const lines = content.split('\n');
      lines.splice(3, 0, '', entry);
      content = lines.join('\n');
    }

    writeFileSync(changelogPath, content);
  }

  // Main execution with progressive fallback
  async run() {
    console.log(`🎯 Starting optimized changelog generation for PR #${this.prNumber}`);
    console.log(`📊 Title: "${this.prTitle}"`);

    const startTime = Date.now();
    const fileChanges = this.getChangedFiles();
    const diffContent = this.getDiffContent();

    console.log(`📁 Files changed: +${fileChanges.added.length} ~${fileChanges.modified.length} -${fileChanges.deleted.length}`);

    let analysis = null;

    // Tier 1: GitHub Models API (fastest, most reliable)
    if (this.githubToken) {
      analysis = await this.analyzeWithGitHubModels(diffContent, fileChanges);
    }

    // Tier 2: Lightweight Ollama (local fallback)
    if (!analysis) {
      analysis = await this.analyzeWithOllama(diffContent, fileChanges);
    }

    // Tier 3: Rule-based (always works)
    if (!analysis) {
      analysis = await this.analyzeWithRules(diffContent, fileChanges);
    }

    // Generate and write changelog
    const entry = this.generateChangelogEntry(analysis, fileChanges);
    this.updateChangelog(entry);

    const duration = Date.now() - startTime;
    console.log(`✅ Changelog updated successfully in ${duration}ms`);
    console.log(`📝 Category: ${analysis.category}`);
    console.log(`📄 Summary: ${analysis.summary?.substring(0, 100)}${analysis.summary?.length > 100 ? '...' : ''}`);
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--pr-number':
        options.prNumber = value;
        break;
      case '--pr-title':
        options.prTitle = value;
        break;
      case '--pr-author':
        options.prAuthor = value;
        break;
      case '--base-sha':
        options.baseSha = value;
        break;
      case '--head-sha':
        options.headSha = value;
        break;
      case '--github-token':
        options.githubToken = value;
        break;
      case '--repository':
        options.repository = value;
        break;
      case '--ollama-available':
        options.ollamaAvailable = value === 'true';
        break;
      case '--help':
      case '-h':
        console.log(`
AI-Powered Changelog Generator

Usage: node update-changelog-ai.js [options]

Options:
  --pr-number <number>        PR number (required)
  --pr-title <title>          PR title (required)
  --pr-author <author>        PR author (required)
  --base-sha <sha>            Base commit SHA (required)
  --head-sha <sha>            Head commit SHA (required)
  --github-token <token>      GitHub token (optional)
  --repository <owner/repo>   Repository (optional)
  --ollama-available <bool>   Ollama available (default: false)
  --help, -h                  Show this help message

Environment Variables (alternative to CLI args):
  PR_NUMBER, PR_TITLE, PR_AUTHOR, BASE_SHA, HEAD_SHA
  GITHUB_TOKEN, GITHUB_REPOSITORY, OLLAMA_AVAILABLE

Examples:
  # Using command line arguments
  node update-changelog-ai.js \\
    --pr-number 123 \\
    --pr-title "Add user authentication" \\
    --pr-author "developer" \\
    --base-sha abcd123 \\
    --head-sha efgh456

  # Using environment variables
  export PR_NUMBER=123
  export PR_TITLE="Add user authentication"
  export PR_AUTHOR="developer"
  export BASE_SHA=abcd123
  export HEAD_SHA=efgh456
  node update-changelog-ai.js

  # Mixed usage (CLI args override env vars)
  export PR_AUTHOR="default-author"
  node update-changelog-ai.js --pr-number 123 --pr-title "Fix bug" --pr-author "specific-author"
`);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Validate required parameters
function validateOptions(options) {
  const required = ['prNumber', 'prTitle', 'prAuthor', 'baseSha', 'headSha'];
  const missing = required.filter(key => !options[key]);

  if (missing.length > 0) {
    console.error('❌ Missing required parameters:', missing.join(', '));
    console.error('Use --help for usage information');
    process.exit(1);
  }
}

// Execute if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const cliOptions = parseArgs();
  const generator = new PerformantChangelogGenerator(cliOptions);

  // Validate required options (from CLI args or env vars)
  validateOptions({
    prNumber: generator.prNumber,
    prTitle: generator.prTitle,
    prAuthor: generator.prAuthor,
    baseSha: generator.baseSha,
    headSha: generator.headSha
  });

  generator.run().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}