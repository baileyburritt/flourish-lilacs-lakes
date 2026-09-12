// D6: fails if any <TextInput> in screens/ or components/ relies on
// `placeholder` as its only descriptor (WCAG 3.3.2) — placeholder text
// disappears the moment a user types, so it can never stand in for a real
// label. FormField already derives `accessibilityLabel` from its own
// `label` prop for every field that goes through it, so this only ever
// catches a raw <TextInput> that skips FormField and forgets its own name.
const fs = require('fs');
const path = require('path');

const APP_ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['screens', 'components'].map((d) => path.join(APP_ROOT, d));

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (full.endsWith('.tsx') && !full.endsWith('.test.tsx')) {
      files.push(full);
    }
  }
  return files;
}

const TEXT_INPUT_TAG = /<TextInput\b[\s\S]*?(?:\/>|>)/g;
const ACCESSIBILITY_LABEL = /accessibilityLabel\s*=/;

const violations = [];

for (const dir of SCAN_DIRS) {
  for (const file of walk(dir, [])) {
    const content = fs.readFileSync(file, 'utf8');
    for (const match of content.matchAll(TEXT_INPUT_TAG)) {
      if (ACCESSIBILITY_LABEL.test(match[0])) continue;
      const line = content.slice(0, match.index).split('\n').length;
      violations.push({ file: path.relative(APP_ROOT, file), line });
    }
  }
}

if (violations.length > 0) {
  console.error('Placeholder-as-label check FAILED — a TextInput has no accessibilityLabel (WCAG 3.3.2):');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`);
  }
  console.error('\nEvery field needs a real accessible name — route it through FormField, or set accessibilityLabel directly.');
  process.exit(1);
}

console.log('Placeholder-as-label check passed — every TextInput carries a real accessibilityLabel.');
