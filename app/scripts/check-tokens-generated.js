// C1: fails if app/theme/tokens.ts is stale relative to DESIGN.md's
// frontmatter — i.e. DESIGN.md changed without regenerating the token file,
// or the generated file was hand-edited directly. Proof this check works:
// before C1, theme/tokens.ts didn't exist at all, so this failed too.
const fs = require('fs');
const path = require('path');
const { readDesignTokens, renderTokensFile } = require('./lib/design-tokens');

const OUT_FILE = path.join(__dirname, '..', 'theme', 'tokens.ts');

const expected = renderTokensFile(readDesignTokens());
const actual = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : null;

if (actual !== expected) {
  console.error('Token generation check FAILED — app/theme/tokens.ts is stale or missing.');
  console.error('Run `npm run generate:tokens` after editing DESIGN.md, then commit the result.');
  process.exit(1);
}

console.log('Token generation check passed — app/theme/tokens.ts matches DESIGN.md.');
