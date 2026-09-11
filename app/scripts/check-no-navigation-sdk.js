// B6: "Start Navigation" hands off to the platform maps app; it must never
// grow a turn-by-turn navigation SDK dependency. Mapbox Directions itself
// stays in scope elsewhere for drive-time estimates between stops, so this
// only rejects navigation/turn-by-turn packages, not Mapbox generally.
const fs = require('fs');
const path = require('path');

const APP_PACKAGE_JSON = path.join(__dirname, '..', 'package.json');
const NAVIGATION_SDK_PATTERN = /turn-by-turn|navigation-sdk|mapbox-navigation|react-native-navigation-sdk/i;

const pkg = JSON.parse(fs.readFileSync(APP_PACKAGE_JSON, 'utf8'));
const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

const violations = Object.keys(allDeps).filter((dep) => NAVIGATION_SDK_PATTERN.test(dep));

if (violations.length > 0) {
  console.error('Navigation SDK check FAILED — a turn-by-turn navigation dependency was added:');
  for (const dep of violations) {
    console.error(`  app/package.json  (${dep})`);
  }
  console.error('\n"Start Navigation" hands off to the platform maps app; it does not implement in-app navigation.');
  process.exit(1);
}

console.log('Navigation SDK check passed — no turn-by-turn navigation dependency present.');
