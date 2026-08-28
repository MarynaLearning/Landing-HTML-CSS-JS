// PreToolUse hook: blocks any tool call that reads, edits, or writes a .env
// file — via Read/Edit/Write/NotebookEdit, the filesystem MCP server, or
// Bash. Matches the path's basename against .env / .env.local / .env.production
// etc., not any path that merely contains the substring "env" (so
// vendor.envelope.png is left alone).
const ENV_BASENAME_RE = /^\.env(\..+)?$/i;

function basename(p) {
  return String(p).split(/[\\/]/).pop() || '';
}

function isEnvPath(p) {
  return typeof p === 'string' && ENV_BASENAME_RE.test(basename(p));
}

// Heredoc bodies (e.g. `<<'EOF' ... EOF`) carry free-form prose — a commit
// message describing this very hook, for instance — not shell arguments, so
// strip them before tokenizing.
function stripHeredocs(command) {
  return command.replace(/<<[-~]?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2\b/g, ' ');
}

// Quote-aware: a whole quoted/heredoc sentence collapses into one token that
// won't equal ".env", while a bare or singly-quoted path argument still will.
function shellTokenize(command) {
  const tokens = [];
  let current = '';
  let quote = null;

  for (const ch of stripHeredocs(command)) {
    if (quote) {
      if (ch === quote) quote = null;
      else current += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/[\s;&|()<>]/.test(ch)) {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  if (current) tokens.push(current);
  return tokens;
}

function commandTouchesEnv(command) {
  if (typeof command !== 'string') return false;
  return shellTokenize(command).some(isEnvPath);
}

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolInput = input?.tool_input || {};
  const candidatePaths = [
    toolInput.file_path,
    toolInput.notebook_path,
    toolInput.path,
    toolInput.source,
    toolInput.destination,
    ...(Array.isArray(toolInput.paths) ? toolInput.paths : []),
  ];

  const touchesEnv =
    candidatePaths.some(isEnvPath) || commandTouchesEnv(toolInput.command);

  if (!touchesEnv) process.exit(0);

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          '.env files are off limits (.claude/hooks/block-env.js).',
      },
    }),
  );
  process.exit(0);
});
