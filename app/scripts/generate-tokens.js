// C1: regenerates app/theme/tokens.ts from DESIGN.md's frontmatter — the
// single source of truth for the app's color, typography, radius and
// spacing tokens. Run this after any change to DESIGN.md's frontmatter and
// commit the result; check-tokens-generated.js fails CI if you forget.
const fs = require('fs');
const path = require('path');
const { readDesignTokens, renderTokensFile } = require('./lib/design-tokens');

const OUT_FILE = path.join(__dirname, '..', 'theme', 'tokens.ts');

const tokens = readDesignTokens();
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, renderTokensFile(tokens));

console.log(`Generated ${path.relative(path.join(__dirname, '..'), OUT_FILE)} from DESIGN.md.`);
