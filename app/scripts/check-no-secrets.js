// A6: pre-commit gate that rejects a commit containing what looks like a
// credential — an API key, access token, private key block, or a committed
// .env file. Scans staged content only (git show :<file>), not the working
// tree, so an ignored real .env sitting on disk untouched never trips it.
const { execFileSync } = require('child_process');
const path = require('path');

const SECRET_PATTERNS = [
  { name: 'AWS access key ID', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'generic secret assignment', re: /(?:api[_-]?key|secret|access[_-]?token|auth[_-]?token|client[_-]?secret|password)\s*[:=]\s*['"][A-Za-z0-9\-_./+]{16,}['"]/i },
  { name: 'private key block', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Stripe secret key', re: /sk_live_[0-9a-zA-Z]{16,}/ },
  { name: 'Slack token', re: /xox[baprs]-[0-9A-Za-z-]{10,}/ },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{36,}/ },
];

const BLOCKED_FILENAMES = /(^|\/)\.env(\.[^.]+)?$/;
const ALLOWED_ENV_FILENAME = /(^|\/)\.env\.example$/;

function stagedFiles() {
  const out = execFileSync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACM'], {
    encoding: 'utf8',
  });
  return out.split('\n').filter(Boolean);
}

function stagedContent(file) {
  try {
    return execFileSync('git', ['show', `:${file}`], { encoding: 'utf8' });
  } catch {
    // Binary or otherwise unreadable as text — nothing to scan.
    return '';
  }
}

const violations = [];

for (const file of stagedFiles()) {
  if (BLOCKED_FILENAMES.test(file) && !ALLOWED_ENV_FILENAME.test(file)) {
    violations.push({ file, line: null, name: 'committed .env file' });
    continue;
  }

  const content = stagedContent(file);
  if (!content) continue;

  const lines = content.split('\n');
  lines.forEach((line, index) => {
    for (const { name, re } of SECRET_PATTERNS) {
      if (re.test(line)) {
        violations.push({ file, line: index + 1, name });
      }
    }
  });
}

if (violations.length > 0) {
  console.error('Secret scan FAILED — refusing to commit what looks like a credential:');
  for (const v of violations) {
    const loc = v.line ? `${v.file}:${v.line}` : v.file;
    console.error(`  ${loc}  (${v.name})`);
  }
  console.error(
    '\nIf this is a false positive, rename/rewrite it so it no longer matches, or use git commit --no-verify' +
      ' deliberately and explain why.'
  );
  process.exit(1);
}

console.log(`Secret scan passed — no credential-shaped content in ${stagedFiles().length} staged file(s).`);
