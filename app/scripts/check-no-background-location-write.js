// E9 (§16, question 2): the CEO's defensive default is that location is a
// sensitive class, written only when a user deliberately saves something
// (a private gem, a trip stop) — never captured continuously or in the
// background. This does not forbid location entirely: a one-shot foreground
// read (e.g. "use my current location" while filling out a gem form) is the
// deliberate-save path and is fine. It forbids the call sites that turn
// location into ambient telemetry instead.
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const SCAN_DIRS = [path.join(REPO_ROOT, 'app'), path.join(REPO_ROOT, 'server')];
const SKIP_DIR_NAMES = new Set(['node_modules', 'dist', '.expo', 'test-results', 'coverage', 'playwright-report', 'drizzle', '.git']);
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const BACKGROUND_LOCATION_PATTERNS = [
  /watchPositionAsync/,
  /\.watchPosition\s*\(/,
  /startLocationUpdatesAsync/,
  /requestBackgroundPermissionsAsync/,
  /BackgroundGeolocation/,
  /expo-task-manager/,
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIR_NAMES.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name)) && full !== __filename) {
      files.push(full);
    }
  }
  return files;
}

const violations = [];

for (const dir of SCAN_DIRS) {
  if (!fs.existsSync(dir)) continue;
  for (const file of walk(dir)) {
    const content = fs.readFileSync(file, 'utf8');
    const relFile = path.relative(REPO_ROOT, file);
    for (const re of BACKGROUND_LOCATION_PATTERNS) {
      if (re.test(content)) {
        violations.push({ file: relFile, name: re.source });
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Background-location check FAILED — a background/continuous location call site was found:');
  for (const v of violations) {
    console.error(`  ${v.file}  (matched ${v.name})`);
  }
  console.error('\nLocation is a sensitive class per §16: writes must come only from a user deliberately saving something, never from background or continuous tracking.');
  process.exit(1);
}

console.log('Background-location check passed — no background or continuous location call sites in app/ or server/.');
