// B3: fails if any screen can produce a simulated download-progress message
// (the fake "42 MB downloaded" offline-map toast) — it told users something
// untrue about their own device, promoted into Phase 0 hygiene by §16.
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

const FAKE_DOWNLOAD_PATTERNS = [/\d+\s*MB\s*downloaded/i, /offline-map-btn/i, /download_for_offline/i];

const violations = [];

for (const file of SCREEN_FILES) {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(REPO_ROOT, file);

  for (const re of FAKE_DOWNLOAD_PATTERNS) {
    if (re.test(content)) {
      violations.push({ file: relFile, name: re.source });
    }
  }
}

if (violations.length > 0) {
  console.error('Fake offline-download check FAILED — simulated download-progress content found:');
  for (const v of violations) {
    console.error(`  ${v.file}  (matched ${v.name})`);
  }
  process.exit(1);
}

console.log(`Fake offline-download check passed — no simulated download UI in ${SCREEN_FILES.length} screen(s).`);
