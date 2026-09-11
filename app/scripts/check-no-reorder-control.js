// B4: fails if the Trip Planner's Reorder control (or a drag-and-drop
// library it would need) ever comes back. Product's own finding: a control
// that does nothing is worse than no control, so it was removed outright
// rather than implemented.
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const APP_PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const TRIP_PLANNER_FILE = path.join(REPO_ROOT, 'trip_planner_flourish', 'code.html');

const REORDER_PATTERNS = [/toggle-reorder-btn/i, /Reorder Stops/i, /aria-label="Reorder/i];
const DRAG_LIBRARY_PATTERN = /drag|sortable|dnd-kit|react-beautiful-dnd/i;

const violations = [];

const screenContent = fs.readFileSync(TRIP_PLANNER_FILE, 'utf8');
for (const re of REORDER_PATTERNS) {
  if (re.test(screenContent)) {
    violations.push({ file: path.relative(REPO_ROOT, TRIP_PLANNER_FILE), name: re.source });
  }
}

const pkg = JSON.parse(fs.readFileSync(APP_PACKAGE_JSON, 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
for (const dep of Object.keys(allDeps)) {
  if (DRAG_LIBRARY_PATTERN.test(dep)) {
    violations.push({ file: 'app/package.json', name: `drag-and-drop dependency: ${dep}` });
  }
}

if (violations.length > 0) {
  console.error('Reorder-control check FAILED — the removed Trip Planner Reorder control has returned:');
  for (const v of violations) {
    console.error(`  ${v.file}  (${v.name})`);
  }
  process.exit(1);
}

console.log('Reorder-control check passed — no Reorder control or drag-and-drop dependency present.');
