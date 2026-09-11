// B1: fails if any of the five screens' viewport meta tag disables pinch
// zoom (`user-scalable=no`) or caps it below 2x (WCAG 1.4.4).
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

const USER_SCALABLE_NO = /user-scalable\s*=\s*no/i;
const MAXIMUM_SCALE = /maximum-scale\s*=\s*([0-9.]+)/i;

const violations = [];

for (const file of SCREEN_FILES) {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(REPO_ROOT, file);

  if (USER_SCALABLE_NO.test(content)) {
    violations.push({ file: relFile, name: 'user-scalable=no' });
  }

  const scaleMatch = content.match(MAXIMUM_SCALE);
  if (scaleMatch && Number(scaleMatch[1]) < 2) {
    violations.push({ file: relFile, name: `maximum-scale=${scaleMatch[1]} (below 2)` });
  }
}

if (violations.length > 0) {
  console.error('Viewport zoom-lock check FAILED — pinch-to-zoom is disabled or capped (WCAG 1.4.4):');
  for (const v of violations) {
    console.error(`  ${v.file}  (${v.name})`);
  }
  process.exit(1);
}

console.log(`Viewport zoom-lock check passed — no zoom restrictions in ${SCREEN_FILES.length} screen(s).`);
