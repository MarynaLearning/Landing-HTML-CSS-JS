// PreToolUse hook: blocks any Bash command that would run `npm publish`.
// This is a static site with no package to publish — block by default rather
// than relying on habit.
const { tokenize } = require('./lib/shell-tokenize');

function isNpmToken(t) {
  return typeof t === 'string' && /^npm(\.cmd)?$/i.test(t);
}

function isPublishToken(t) {
  return typeof t === 'string' && /^publish$/i.test(t);
}

// Adjacent-token matching (not a raw substring/regex test on the whole
// command) so a commit message that merely *mentions* "npm publish" in a
// quoted string or heredoc body doesn't trip this — only an actual
// `npm publish` invocation, as its own unquoted-or-lone-quoted words, does.
function commandPublishes(command) {
  if (typeof command !== 'string') return false;
  const tokens = tokenize(command);
  return tokens.some((t, i) => isNpmToken(t) && isPublishToken(tokens[i + 1]));
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

  const command = input?.tool_input?.command;
  if (!commandPublishes(command)) {
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
