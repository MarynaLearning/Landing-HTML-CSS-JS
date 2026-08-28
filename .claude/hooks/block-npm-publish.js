// PreToolUse hook: blocks any Bash command that would run `npm publish`.
// This is a static site with no package to publish — block by default rather
// than relying on habit.
const PUBLISH_RE = /(^|[;&|]\s*|\s)npm(\.cmd)?\s+publish\b/i;

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const command = input?.tool_input?.command;
  if (typeof command !== 'string' || !PUBLISH_RE.test(command)) {
    process.exit(0);
  }

  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          'npm publish is blocked by .claude/hooks/block-npm-publish.js.',
      },
    }),
  );
  process.exit(0);
});
