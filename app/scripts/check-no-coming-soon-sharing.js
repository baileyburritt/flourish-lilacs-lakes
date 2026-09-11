// B5: fails if a "Coming Soon" sharing affordance ever comes back on any
// screen. Community sharing for private gems is off the roadmap (§16) — the
// is_private schema column stays, but no sharing UI and no promise of one.
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SCREEN_FILES = [
  'explore_curate_flourish/code.html',
  'music_live_events_flourish/code.html',
  'trip_planner_flourish/code.html',
  'destination_detail_private_gem_flourish/code.html',
  'new_private_gem_flourish/code.html',
].map((f) => path.join(REPO_ROOT, f));

const PATTERNS = [/coming soon/i, /community sharing/i];

const violations = [];

for (const file of SCREEN_FILES) {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(REPO_ROOT, file);

  for (const re of PATTERNS) {
    if (re.test(content)) {
      violations.push({ file: relFile, name: re.source });
    }
  }
}

if (violations.length > 0) {
  console.error('Community-sharing check FAILED — "Coming Soon" or sharing copy found:');
  for (const v of violations) {
    console.error(`  ${v.file}  (matched ${v.name})`);
  }
  process.exit(1);
}

console.log(`Community-sharing check passed — no "Coming Soon" sharing copy in ${SCREEN_FILES.length} screen(s).`);
