#!/usr/bin/env node

/**
 * PreToolUse hook to validate Read operations
 * Loads configuration from hooks-config.json
 *
 * Exit codes:
 * 0 = allow operation (warnings logged to logs/tools/Read.jsonl)
 * 1 = reserved for future use
 * 2 = block operation (stderr shown to Claude)
 *
 * Logs:
 * - Warnings: logs/tools/Read.jsonl (for evaluation and threshold tuning)
 * - Blocks: stderr (shown to Claude for immediate action)
 */

const fs = require('fs');
const path = require('path');

// Load configuration from JSON file
function loadConfig() {
  const defaults = {
    max_lines: 400,
    suggest_grep_threshold: 200,
    suggestions: {
      blocked: "Split into smaller reads or use Grep to find specific content first. Consider using grep, rg, sed, or fzf for targeted search.",
      warning: "The model hit the allowed threshold. Consider prompt engineering or refining your query."
    }
  };

  try {
    const configPath = path.join(__dirname, 'hooks-config.json');
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);

    // Return read_validator config, merge with defaults
    return { ...defaults, ...config.read_validator };
  } catch (error) {
    // Config not found or parse error - use defaults
    return defaults;
  }
}

// Log warning to JSONL file for evaluation
function logWarning(data, limit, offset, endLine, config) {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const logDir = path.join(projectDir, 'logs', 'tools');
    const logFile = path.join(logDir, 'Read.jsonl');

    // Ensure logs/tools directory exists
    fs.mkdirSync(logDir, { recursive: true });

    const logEntry = {
      timestamp: new Date().toISOString(),
      tool: 'Read',
      limit: limit,
      threshold: config.suggest_grep_threshold,
      max_lines: config.max_lines,
      offset: offset,
      end_line: endLine,
      file_path: data.tool_input?.file_path || 'unknown',
      session_id: data.session_id || 'unknown',
      message: config.suggestions.warning
    };

    // Append to JSONL file (one JSON object per line)
    fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    // Silently fail - logging shouldn't break the hook
    console.error(`[read_validator] Failed to log warning: ${error.message}`);
  }
}

function main() {
  const config = loadConfig();

  try {
    let input = '';

    process.stdin.on('data', chunk => {
      input += chunk;
    });

    process.stdin.on('end', () => {
      try {
        const data = JSON.parse(input);

        // Only validate Read tool
        if (data.tool_name !== 'Read') {
          process.exit(0);
          return;
        }

        const toolInput = data.tool_input || {};
        const limit = toolInput.limit;

        // If no limit specified, reading entire file - allow
        if (!limit) {
          process.exit(0);
          return;
        }

        const offset = toolInput.offset || 1;
        const endLine = offset + limit - 1;

        // Hard block: exceeds max_lines
        if (limit > config.max_lines) {
          console.error(
            `Read operation blocked: requested ${limit} lines (${offset}-${endLine}).\n` +
            `Maximum allowed: ${config.max_lines} lines.\n\n` +
            `Suggestion: ${config.suggestions.blocked}`
          );
          process.exit(2);
        }

        // Soft warning: exceeds threshold but under max
        if (limit > config.suggest_grep_threshold) {
          // Log to JSONL for evaluation
          logWarning(data, limit, offset, endLine, config);

          // Also output to stderr for transcript mode
          console.error(
            `Reading ${limit} lines (${offset}-${endLine}).\n` +
            `Note: ${config.suggestions.warning}`
          );

          // Allow operation
          process.exit(0);
        }

        // Within acceptable range - allow silently
        process.exit(0);

      } catch (parseError) {
        console.error(`[read_validator] Parse error: ${parseError.message}`);
        process.exit(0);
      }
    });

  } catch (error) {
    console.error(`[read_validator] Error: ${error.message}`);
    process.exit(0);
  }
}

process.stdin.on('error', (error) => {
console.error(`[read_validator] stdin error: ${error.message}`);
process.exit(0);
});

main();