// PreToolUse hook: blocks any tool call that reads, edits, or writes a .env
// file — via Read/Edit/Write/NotebookEdit, the filesystem MCP server, or
// Bash. Matches the path's basename against .env / .env.local / .env.production
// etc., not any path that merely contains the substring "env" (so
// vendor.envelope.png is left alone).
const { tokenize } = require('./lib/shell-tokenize');

const ENV_BASENAME_RE = /^\.env(\..+)?$/i;

function basename(p) {
  return String(p).split(/[\\/]/).pop() || '';
}

function isEnvPath(p) {
  return typeof p === 'string' && ENV_BASENAME_RE.test(basename(p));
}

function commandTouchesEnv(command) {
  if (typeof command !== 'string') return false;
  return tokenize(command).some(isEnvPath);
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
