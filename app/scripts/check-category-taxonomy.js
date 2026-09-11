// C3: fails if any screen (or the PRD) defines its own category list
// instead of deriving from constants/categories.js. Before this fix, three
// incompatible lists existed for the same concept (§04, critical finding):
// the PRD's destination_category enum, the destination-detail screen's
// 5-value "vibe" picker, and the New Private Gem screen's 7-value emoji
// picker — none of which overlapped cleanly.
const fs = require('fs');
const path = require('path');
const { DESTINATION_CATEGORIES } = require('../constants/categories');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PRD_FILE = path.join(REPO_ROOT, 'flourish_lilacs_lakes_technical_handoff_prd.md');
const DESTINATION_DETAIL_FILE = path.join(REPO_ROOT, 'destination_detail_private_gem_flourish', 'code.html');
const NEW_PRIVATE_GEM_FILE = path.join(REPO_ROOT, 'new_private_gem_flourish', 'code.html');

const CANONICAL_IDS = new Set(DESTINATION_CATEGORIES.map((c) => c.id));
const CANONICAL_LABELS = new Set(DESTINATION_CATEGORIES.map((c) => c.label));

// Literal strings from the three pre-fix taxonomies. If any of these show up
// again, a screen (or the PRD) has drifted back to inventing its own list.
const RETIRED_STRINGS = [
  'Scenic View',
  'Hidden Trail',
  'Food &amp; Drink',
  'Craft Shop',
  'Live Acoustic',
  'Scenic Overlook',
  'Quiet Kayak &amp; Swim',
  'Roadside Stand',
  'Secret Cidery',
  'Acoustic Busker Spot',
  'Hidden Garden Patio',
  'Unmarked Trailhead',
  '🌅',
  '🛶',
  '🥧',
  '🍇',
  '🎷',
  '☕',
  '🥾',
];

const violations = [];

function decodeEntities(str) {
  return str.replace(/&amp;/g, '&');
}

function labelsFromDataValues(content) {
  const values = new Set();
  const re = /data-value="([^"]+)"/g;
  let match;
  while ((match = re.exec(content))) {
    values.add(decodeEntities(match[1]));
  }
  return values;
}

function assertSameSet(actual, expected, sourceName) {
  for (const value of actual) {
    if (!expected.has(value)) {
      violations.push(`${sourceName} defines a category not in the canonical list: "${value}"`);
    }
  }
  for (const value of expected) {
    if (!actual.has(value)) {
      violations.push(`${sourceName} is missing a canonical category: "${value}"`);
    }
  }
}

function checkRetiredStrings(content, sourceName) {
  for (const retired of RETIRED_STRINGS) {
    if (content.includes(retired)) {
      violations.push(`${sourceName} still contains a retired pre-C3 category string: "${retired}"`);
    }
  }
}

const destinationDetailContent = fs.readFileSync(DESTINATION_DETAIL_FILE, 'utf8');
assertSameSet(
  labelsFromDataValues(destinationDetailContent),
  CANONICAL_LABELS,
  'destination_detail_private_gem_flourish/code.html'
);
checkRetiredStrings(destinationDetailContent, 'destination_detail_private_gem_flourish/code.html');

const newPrivateGemContent = fs.readFileSync(NEW_PRIVATE_GEM_FILE, 'utf8');
assertSameSet(
  labelsFromDataValues(newPrivateGemContent),
  CANONICAL_LABELS,
  'new_private_gem_flourish/code.html'
);
checkRetiredStrings(newPrivateGemContent, 'new_private_gem_flourish/code.html');

// The PRD's destination_category enum is the canonical ids' source — if it
// diverges, someone edited one without the other.
const prdContent = fs.readFileSync(PRD_FILE, 'utf8');
const enumMatch = prdContent.match(/CREATE TYPE destination_category AS ENUM \(([\s\S]*?)\)/);
if (!enumMatch) {
  violations.push('flourish_lilacs_lakes_technical_handoff_prd.md: could not find the destination_category enum');
} else {
  const prdIds = new Set(Array.from(enumMatch[1].matchAll(/'([A-Z_]+)'/g)).map((m) => m[1]));
  for (const id of prdIds) {
    if (!CANONICAL_IDS.has(id)) {
      violations.push(`PRD's destination_category enum has an id not in the canonical list: "${id}"`);
    }
  }
  for (const id of CANONICAL_IDS) {
    if (!prdIds.has(id)) {
      violations.push(`PRD's destination_category enum is missing a canonical id: "${id}"`);
    }
  }
}

if (violations.length > 0) {
  console.error('Category taxonomy check FAILED:');
  for (const v of violations) {
    console.error(`  ${v}`);
  }
  process.exit(1);
}

console.log(`Category taxonomy check passed — ${CANONICAL_LABELS.size} canonical categories, one list.`);
