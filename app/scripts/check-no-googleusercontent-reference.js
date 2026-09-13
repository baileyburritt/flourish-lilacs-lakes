// E10 (§03, §06): fails if any lh3.googleusercontent.com reference survives
// in shipped code — the third-party AI-export asset host that can disappear
// without notice. Scans app/ and server/ source plus the five standalone
// screens (still live documents per earlier tickets, e.g. B3's offline-toast
// check and C1's token re-render); docs/ is excluded because review.html and
// build-plan.html narrate this exact finding in prose and are expected to
// keep mentioning the string they're describing.
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCAN_DIRS = [path.join(REPO_ROOT, 'app'), path.join(REPO_ROOT, 'server')];
const SCREEN_FILES = [
  'explore_curate_flourish/code.html',
  'music_live_events_flourish/code.html',
  'trip_planner_flourish/code.html',
  'destination_detail_private_gem_flourish/code.html',
  'new_private_gem_flourish/code.html',
].map((f) => path.join(REPO_ROOT, f));
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', '.expo', 'test-results', 'coverage', 'playwright-report', 'drizzle', '.git']);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (full !== __filename) {
      files.push(full);
    }
  }
  return files;
}

const filesToScan = [...SCAN_DIRS.filter((d) => fs.existsSync(d)).flatMap((d) => walk(d)), ...SCREEN_FILES];

const violations = [];
for (const file of filesToScan) {
  const content = fs.readFileSync(file, 'utf8');
  if (/googleusercontent\.com/.test(content)) {
    violations.push(path.relative(REPO_ROOT, file));
  }
}

if (violations.length > 0) {
  console.error('googleusercontent check FAILED — a reference to the third-party export host was found:');
  for (const v of violations) {
    console.error(`  ${v}`);
  }
  process.exit(1);
}

console.log(`googleusercontent check passed — no references in ${filesToScan.length} scanned file(s).`);
