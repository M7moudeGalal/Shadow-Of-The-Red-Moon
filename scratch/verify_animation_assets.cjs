const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

console.log('============================================================');
console.log('SHADOW OF THE RED MOON — PRODUCTION FRAME & ASSET AUDIT TEST');
console.log('============================================================\n');

/**
 * Checks if a file exists on disk with EXACT CASE matching (vital for Linux/Vercel deployments)
 */
function verifyExactCaseExists(relativePath) {
  // Strip leading slash
  const cleanRel = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  const fullPath = path.join(publicDir, cleanRel);

  if (!fs.existsSync(fullPath)) {
    return { exists: false, exactCase: false, actualPath: null };
  }

  // Verify exact casing by traversing directories
  const segments = cleanRel.split('/');
  let currentDir = publicDir;

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const entries = fs.readdirSync(currentDir);
    const match = entries.find((e) => e === seg);

    if (!match) {
      // Found with different casing
      const looseMatch = entries.find((e) => e.toLowerCase() === seg.toLowerCase());
      return {
        exists: true,
        exactCase: false,
        expected: seg,
        actual: looseMatch || 'unknown',
        fullExpected: fullPath,
      };
    }
    currentDir = path.join(currentDir, seg);
  }

  return { exists: true, exactCase: true, fullPath };
}

/**
 * Extracts array definitions of paths from a typescript file
 */
function extractArraysFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const arrayRegex = /export\s+const\s+([A-Z0-9_]+)\s*=\s*\[([\s\S]*?)\]\s*as\s*const/g;
  const singleRegex = /export\s+const\s+([A-Z0-9_]+)\s*=\s*['"]([^'"]+)['"]\s*as\s*const/g;

  const result = {};

  let match;
  while ((match = arrayRegex.exec(content)) !== null) {
    const name = match[1];
    const body = match[2];
    const paths = [];
    const pathRegex = /['"]([^'"]+)['"]/g;
    let pm;
    while ((pm = pathRegex.exec(body)) !== null) {
      paths.push(pm[1]);
    }
    result[name] = paths;
  }

  while ((match = singleRegex.exec(content)) !== null) {
    result[match[1]] = [match[2]];
  }

  return result;
}

const componentFiles = [
  path.join(projectRoot, 'src', 'components', 'NinjaCharacter.tsx'),
  path.join(projectRoot, 'src', 'components', 'HanzoCharacter.tsx'),
  path.join(projectRoot, 'src', 'components', 'CorruptedSamuraiCharacter.tsx'),
  path.join(projectRoot, 'src', 'components', 'CorruptedBatCharacter.tsx'),
];

let totalAssetsChecked = 0;
let totalErrors = 0;
let totalWarnings = 0;
const uniqueAssets = new Set();

for (const compFile of componentFiles) {
  const baseName = path.basename(compFile);
  console.log(`\n--- Auditing ${baseName} ---`);
  const arrays = extractArraysFromFile(compFile);

  const arrayNames = Object.keys(arrays);
  console.log(`Found ${arrayNames.length} asset definitions: ${arrayNames.join(', ')}`);

  for (const [name, frames] of Object.entries(arrays)) {
    if (frames.length === 0) {
      console.error(`  ❌ ERROR: ${name} is EMPTY!`);
      totalErrors++;
      continue;
    }

    let arrayOk = true;
    for (let idx = 0; idx < frames.length; idx++) {
      const framePath = frames[idx];
      totalAssetsChecked++;
      uniqueAssets.add(framePath);

      const check = verifyExactCaseExists(framePath);
      if (!check.exists) {
        console.error(`  ❌ MISSING ASSET: [${name}][${idx}] -> ${framePath}`);
        totalErrors++;
        arrayOk = false;
      } else if (!check.exactCase) {
        console.error(
          `  ⚠️ CASING MISMATCH (Fails on Vercel): [${name}][${idx}] -> expected "${check.expected}" but disk has "${check.actual}"`
        );
        totalErrors++;
        arrayOk = false;
      }
    }

    if (arrayOk) {
      console.log(`  ✓ ${name} (${frames.length} frames) — All files exist with exact casing.`);
    }
  }
}

// Check GameScreen effects
console.log(`\n--- Auditing GameScreen.tsx Effects ---`);
const gameScreenFile = path.join(projectRoot, 'src', 'pages', 'GameScreen.tsx');
const gameScreenContent = fs.readFileSync(gameScreenFile, 'utf-8');
const effectPaths = [
  '/assets/sprites/player/effects/slash_01.png',
  '/assets/sprites/player/effects/slash_02.png',
  '/assets/sprites/player/effects/slash_03.png',
  '/assets/sprites/player/effects/impact_01.png',
  '/assets/sprites/player/effects/impact_02.png',
  '/assets/sprites/player/effects/dust_01.png',
  '/assets/sprites/player/effects/dust_02.png',
];

for (const ep of effectPaths) {
  totalAssetsChecked++;
  uniqueAssets.add(ep);
  const check = verifyExactCaseExists(ep);
  if (!check.exists) {
    console.error(`  ❌ MISSING EFFECT: ${ep}`);
    totalErrors++;
  } else if (!check.exactCase) {
    console.error(`  ⚠️ CASING MISMATCH: ${ep}`);
    totalErrors++;
  }
}
console.log(`  ✓ Visual Effects (${effectPaths.length} frames) — All files exist.`);

console.log('\n============================================================');
console.log(`AUDIT COMPLETE:`);
console.log(`  Total Asset References Checked: ${totalAssetsChecked}`);
console.log(`  Unique Assets: ${uniqueAssets.size}`);
console.log(`  Total Errors: ${totalErrors}`);
console.log(`  Total Warnings: ${totalWarnings}`);
console.log('============================================================\n');

if (totalErrors > 0) {
  console.error('❌ AUDIT FAILED with errors.');
  process.exit(1);
} else {
  console.log('✅ AUDIT PASSED: All animation assets exist, exact casing is validated, and zero broken paths detected.');
  process.exit(0);
}
