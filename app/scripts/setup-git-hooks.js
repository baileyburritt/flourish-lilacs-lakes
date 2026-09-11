// A6: point git at the repo-wide .githooks directory so the secret-scan
// pre-commit hook is active for every clone after `npm install`, without
// requiring anyone to run a manual git config step.
const { execFileSync } = require('child_process');

try {
  execFileSync('git', ['config', 'core.hooksPath', '.githooks']);
  console.log('git hooks path set to .githooks');
} catch (err) {
  console.warn('Could not configure git hooks path (not a git checkout?):', err.message);
}
