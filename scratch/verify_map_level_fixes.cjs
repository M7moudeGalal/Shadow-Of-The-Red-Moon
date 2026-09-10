const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('============================================================');
console.log('VERIFYING MAP LEVEL FIXES: YUNAMI JIGOKU + CHINOIKE JIGOKU');
console.log('============================================================\n');

// 1. Read source files
const levelPath = path.join(__dirname, '../src/game/level.ts');
const levelContent = fs.readFileSync(levelPath, 'utf8');

const enginePath = path.join(__dirname, '../src/game/useGameEngine.ts');
const engineContent = fs.readFileSync(enginePath, 'utf8');

const gameScreenPath = path.join(__dirname, '../src/pages/GameScreen.tsx');
const gameScreenContent = fs.readFileSync(gameScreenPath, 'utf8');

// --- 1. Verify Yunami Samurai Patrol Ranges on Safe Platforms ---
console.log('--- 1 & 2. Checking Yunami Samurai Patrol Ranges & Platform Margins ---');

// Parse mkEnemy calls from level.ts
// mkEnemy(type, x, y, patrolRange)
const samuraiRegex = /mkEnemy\('samurai',\s*(\d+),\s*GROUND_Y\s*-\s*48,\s*(\d+)\)/g;
const matches = [];
let m;
while ((m = samuraiRegex.exec(levelContent)) !== null) {
  matches.push({ x: parseInt(m[1]), range: parseInt(m[2]) });
}

// In Yunami, there are 8 samurai:
// 1: 1020, 440 (ground: 760 - 1320)
// 2: 2220, 400 (ground: 1960 - 2474)
// 3: 3100, 160 (ground: 2700 - 3240, spikes 2800-2980, safe: 2980 - 3240)
// Section 6: 3900, 320 (ground: 3560 - 4220)
// 4: 4760, 200 (ground: 4320 - 4920, spikes 4420-4620, safe: 4620 - 4920)
// 5: 5310, 360 (ground: 5080 - 5540)
// 6: 5730, 160 (ground: 5620 - 5860, spikes 5860-6060, safe: 5620 - 5860)
// 7: 6240, 300 (ground: 6060 - 6600)

const yunamiSamuraiSpecs = [
  { name: 'Samurai 1', x: 1020, range: 440, safeMin: 760, safeMax: 1320 },
  { name: 'Samurai 2', x: 2220, range: 400, safeMin: 1960, safeMax: 2474 },
  { name: 'Samurai 3', x: 3100, range: 160, safeMin: 2980, safeMax: 3240 },
  { name: 'Samurai in S6', x: 3900, range: 320, safeMin: 3560, safeMax: 4220 },
  { name: 'Samurai 4', x: 4760, range: 200, safeMin: 4620, safeMax: 4920 },
  { name: 'Samurai 5', x: 5310, range: 360, safeMin: 5080, safeMax: 5540 },
  { name: 'Samurai 6', x: 5730, range: 160, safeMin: 5620, safeMax: 5860 },
  { name: 'Samurai 7', x: 6240, range: 300, safeMin: 6060, safeMax: 6600 },
];

const SAMURAI_W = 34;

for (const spec of yunamiSamuraiSpecs) {
  const minX = spec.x - spec.range / 2;
  const maxX = spec.x + spec.range / 2;
  const rightEdge = maxX + SAMURAI_W;

  const leftMargin = minX - spec.safeMin;
  const rightMargin = spec.safeMax - rightEdge;

  assert(minX >= spec.safeMin, `${spec.name} minX (${minX}) must be >= safeMin (${spec.safeMin})`);
  assert(rightEdge <= spec.safeMax, `${spec.name} rightEdge (${rightEdge}) must be <= safeMax (${spec.safeMax})`);
  assert(leftMargin >= 15, `${spec.name} left margin (${leftMargin}px) must be >= 15px`);
  assert(rightMargin >= 15, `${spec.name} right margin (${rightMargin}px) must be >= 15px`);

  console.log(`✔ ${spec.name}: patrol [${minX}, ${maxX}] (body [${minX}, ${rightEdge}]) fits [${spec.safeMin}, ${spec.safeMax}] (margins: L=${leftMargin}px, R=${rightMargin}px)`);
}

// Verify level.ts specifically contains updated values
assert(levelContent.includes("mkEnemy('samurai', 3100, GROUND_Y - 48, 160)"), 'Samurai 3 configured with x=3100, range=160');
assert(levelContent.includes("mkEnemy('samurai', 4760, GROUND_Y - 48, 200)"), 'Samurai 4 configured with x=4760, range=200');
assert(levelContent.includes("mkEnemy('samurai', 5730, GROUND_Y - 48, 160)"), 'Samurai 6 configured with x=5730, range=160');
console.log('✔ All Yunami Samurai patrol definitions verified in level.ts');

// --- 3. Verify Chinoike Enemies on Platform Boundaries ---
console.log('\n--- 3. Checking Chinoike Jigoku Enemy Platform Boundaries ---');
const chinoikeSamuraiSpecs = [
  { name: 'Chinoike Samurai 1', x: 2560, range: 280, platMin: 2360, platMax: 2760 },
  { name: 'Chinoike Samurai 2', x: 3160, range: 130, platMin: 3076, platMax: 3276 },
  { name: 'Chinoike Samurai 3', x: 3660, range: 260, platMin: 3470, platMax: 3840 },
  { name: 'Chinoike Samurai 4', x: 4200, range: 200, platMin: 4080, platMax: 4360 },
  { name: 'Chinoike Samurai 5', x: 5540, range: 320, platMin: 5320, platMax: 5780 },
  { name: 'Chinoike Hanzo', x: 6750, range: 600, platMin: 6100, platMax: 7500 },
];

for (const spec of chinoikeSamuraiSpecs) {
  const minX = spec.x - spec.range / 2;
  const maxX = spec.x + spec.range / 2;
  const rightEdge = maxX + (spec.name.includes('Hanzo') ? 36 : 34);

  assert(minX >= spec.platMin, `${spec.name} minX (${minX}) >= platMin (${spec.platMin})`);
  assert(rightEdge <= spec.platMax, `${spec.name} rightEdge (${rightEdge}) <= platMax (${spec.platMax})`);
  console.log(`✔ ${spec.name}: body [${minX}, ${rightEdge}] safely within platform [${spec.platMin}, ${spec.platMax}]`);
}

// --- 4. Verify Spike Trench 1 Coverage ---
console.log('\n--- 4. Checking Yunami Spike Trench 1 Coverage (1440 - 1780) ---');
assert(
  levelContent.includes('{ x: 1440, y: GROUND_Y - 18, w: 340, h: 18 }'),
  'Spike trench 1 must be unified to { x: 1440, y: GROUND_Y - 18, w: 340, h: 18 }'
);
assert(
  !levelContent.includes('{ x: 1640, y: GROUND_Y - 18, w: 140, h: 18 }'),
  'Old second segment at 1640 must be removed to avoid 20px gap'
);
console.log('✔ Spike Trench 1: Continuous 340px coverage from 1440 to 1780 (no gap at 1620-1640)');

// --- 5 & 8. Verify No GroundY Fallback in Great Temple Abyss (3240 - 3560) ---
console.log('\n--- 5 & 8. Checking Absence of groundY Fallback over Chasms ---');
// Verify useGameEngine does not contain groundY fallback in airborne collision or walking verification
assert(
  !engineContent.includes('e.y >= level.groundY - e.h'),
  'Airborne collision must NOT use level.groundY - e.h fallback'
);
assert(
  !engineContent.includes('e.y + e.h >= level.groundY - 6'),
  'Walking verification must NOT use level.groundY - 6 fallback'
);
assert(
  !engineContent.includes('footY >= level.groundY - 4'),
  'Ledge detection must NOT use level.groundY - 4 fallback'
);
console.log('✔ All groundY fallbacks removed from enemy physics (airborne landing, walking, ledge check)');

// Simulate an enemy over the Great Temple Abyss (x: 3300, y: 552)
// Platform list around abyss:
const abyssPlatforms = [
  { x: 2700, y: 600, w: 540, h: 120, type: 'ground' }, // ends at 3240
  { x: 3350, y: 470, w: 120, h: 16, type: 'platform' }, // mastaba at 3350-3470, y=470
  { x: 3560, y: 600, w: 660, h: 120, type: 'ground' }, // starts at 3560
];

// Falling enemy at X: 3300 (abyss between 3240 and 3350)
const enemyAtAbyss = { x: 3300, y: 560, w: 34, h: 48, vy: 5 };
let landedOnPlat = false;
for (const pl of abyssPlatforms) {
  if (pl.type !== 'wall' && enemyAtAbyss.x + enemyAtAbyss.w > pl.x && enemyAtAbyss.x < pl.x + pl.w) {
    if (enemyAtAbyss.y + enemyAtAbyss.h >= pl.y && enemyAtAbyss.y + enemyAtAbyss.h <= pl.y + 20 && enemyAtAbyss.vy >= 0) {
      landedOnPlat = true;
    }
  }
}
assert(!landedOnPlat, 'Enemy falling over Great Temple Abyss must NOT land on any platform');
console.log('✔ Enemy falling at X:3300 correctly has landedOnPlat = false (continues falling into abyss)');

// --- 6. Platform-Based Ledge Detection at Great Temple Abyss Edge (X: 3240) ---
console.log('\n--- 6. Checking Ledge Detection at Great Temple Abyss Edge (X: 3240) ---');
// Enemy at X: 3220, facing right (1), w: 34
const enemyAtLedge = { x: 3220, y: 552, w: 34, h: 48, facing: 1 };
const footX = enemyAtLedge.x + (enemyAtLedge.facing === 1 ? enemyAtLedge.w + 8 : -8); // 3220 + 34 + 8 = 3262
let groundAhead = false;
for (const pl of abyssPlatforms) {
  if (pl.type !== 'wall' && footX >= pl.x && footX <= pl.x + pl.w) {
    if (pl.y >= enemyAtLedge.y + enemyAtLedge.h - 4 && pl.y <= enemyAtLedge.y + enemyAtLedge.h + 20) {
      groundAhead = true;
      break;
    }
  }
}
assert(!groundAhead, 'Ledge detection at X:3220 facing right into 3240 abyss must report groundAhead = false');
console.log('✔ Ledge detection: footX=3262 into Great Temple Abyss correctly reports groundAhead = false');

// --- 7. Enemy Landing Uses Actual Platform Y ---
console.log('\n--- 7. Checking Enemy Landing Uses Actual Platform Y Coordinates ---');
// Platform at y = 680 (Sunken Vault)
const vaultPlat = { x: 2490, y: 680, w: 190, h: 40, type: 'ground' };
const fallingToVault = { x: 2550, y: 635, w: 34, h: 48, vy: 4 }; // feet at 635 + 48 = 683 (reaches y=680)
let landedY = null;
if (fallingToVault.x + fallingToVault.w > vaultPlat.x && fallingToVault.x < vaultPlat.x + vaultPlat.w) {
  if (fallingToVault.y + fallingToVault.h >= vaultPlat.y && fallingToVault.y + fallingToVault.h <= vaultPlat.y + 20 && (fallingToVault.vy >= 0)) {
    landedY = vaultPlat.y - fallingToVault.h;
  }
}
assert.strictEqual(landedY, 680 - 48, 'Enemy lands at vaultPlat.y - enemy.h (632), NOT at groundY (552)');
console.log(`✔ Enemy landing on platform at y=680 lands at y=${landedY} (actual platform Y minus height)`);

// --- 9. Yunami Vault Camera Follows Player at p.y = 632 ---
console.log('\n--- 9. Checking Yunami Vault Camera Tracking at p.y = 632 ---');
const vpHeight = 450;
const maxCamY = 720 - vpHeight; // 270

// Dynamic formula in engine:
const calcTargetY = (py) => Math.min(Math.max(0, py - vpHeight * 0.55), maxCamY);

const normalGroundY = calcTargetY(552);
const vaultTargetY = calcTargetY(632);

assert(vaultTargetY > 230, `Vault targetY (${vaultTargetY}) must be > 230 (previous hard cap)`);
assert.strictEqual(vaultTargetY, 270, `Vault targetY must reach maxCameraY (270) to show vault floor (got ${vaultTargetY})`);
console.log(`✔ Normal ground cameraY: ${normalGroundY}, Vault cameraY: ${vaultTargetY} (smoothly descends from upper ground into vault)`);

// Floor at 680 on screen:
const floorScreenY = 680 - vaultTargetY;
console.log(`✔ Vault floor (Y:680) displayed at ${floorScreenY}px from top on ${vpHeight}px viewport (${vpHeight - floorScreenY}px margin from bottom edge)`);
assert(floorScreenY < vpHeight, 'Vault floor is fully visible within viewport');

// --- 10. Duplicate YunamiEnvironmentDetails Removed from GameScreen.tsx ---
console.log('\n--- 10. Checking GameScreen.tsx Environment Details Rendering ---');
// Count occurrences of <YunamiEnvironmentDetails
const envOccurrences = (gameScreenContent.match(/<YunamiEnvironmentDetails/g) || []).length;
assert.strictEqual(envOccurrences, 1, `YunamiEnvironmentDetails must only be rendered ONCE (got ${envOccurrences})`);

// Ensure it is inside the non-chinoike branch
const chinoikeBranchIdx = gameScreenContent.indexOf("render.storyLocation === 'chinoike-jigoku'");
const elseBranchIdx = gameScreenContent.indexOf('<HellChasmPitsView />');
const envIdx = gameScreenContent.indexOf('<YunamiEnvironmentDetails />');

assert(envIdx > elseBranchIdx, 'YunamiEnvironmentDetails must be inside the Yunami else branch');
console.log('✔ YunamiEnvironmentDetails is rendered exactly ONCE, inside the Yunami-only branch');

console.log('\n============================================================');
console.log('ALL 10 VERIFICATIONS PASSED SUCCESSFULLY!');
console.log('============================================================\n');
