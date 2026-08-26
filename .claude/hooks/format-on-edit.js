// PostToolUse hook: runs Prettier on whatever file Edit/Write/NotebookEdit
// just touched. Formats in place; never blocks the tool result on failure.
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const FORMATTABLE_EXT = new Set(['.html', '.css', '.js', '.json', '.md']);

let raw = '';
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath =
    input?.tool_input?.file_path || input?.tool_input?.notebook_path;
  if (!filePath) process.exit(0);

  if (!FORMATTABLE_EXT.has(path.extname(filePath).toLowerCase())) {
    process.exit(0);
  }

  const result = spawnSync('npx', ['prettier', '--write', filePath], {
    cwd: input.cwd || process.cwd(),
    stdio: 'ignore',
    shell: true,
  });

  if (result.status !== 0) {
    console.error(`format-on-edit: prettier failed on ${filePath}`);
  }
  process.exit(0);
});
