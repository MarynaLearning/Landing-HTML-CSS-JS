// Rough shell tokenizer shared by the PreToolUse Bash-command hooks.
//
// Heredoc bodies (e.g. `<<'EOF' ... EOF`) and quoted spans carry free-form
// prose — a commit message describing one of these hooks, for instance —
// not shell arguments. Stripping heredocs and collapsing each quoted span
// into a single token keeps that prose from being split back into bare
// words a hook's word-matching logic would mistake for real arguments.
function stripHeredocs(command) {
  return command.replace(/<<[-~]?\s*(['"]?)(\w+)\1[\s\S]*?\n\s*\2\b/g, ' ');
}

function tokenize(command) {
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

module.exports = { tokenize };
