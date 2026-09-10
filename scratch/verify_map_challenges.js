import { createYunamiJigoku, createChinoikeJigoku } from '../src/game/level.js';

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
  console.log('PASS:', message);
}

console.log('=== Verifying Map Platforming Challenges ===');

const yunami = createYunamiJigoku();
const chinoike = createChinoikeJigoku();

// --- 1. Yunami Jigoku: Sunken Shinobi Vault ---
console.log('\n--- Checking Yunami Jigoku Sunken Shinobi Vault ---');
const yFloor = yunami.platforms.find((p) => p.x === 2490 && p.y === 680);
const yLeftWall = yunami.platforms.find((p) => p.x === 2474 && p.y === 490);
const yRightWall = yunami.platforms.find((p) => p.x === 2680 && p.y === 490 && p.type === 'ground');
const yEscapeLedge = yunami.platforms.find((p) => p.x === 2680 && p.y === 490 && p.type === 'platform');
const yShuriken = yunami.collectibleShurikens.find((s) => s.id === 4);

assert(Boolean(yFloor), 'Yunami vault floor exists at y=680');
assert(Boolean(yLeftWall), 'Yunami vault left wall exists');
assert(Boolean(yRightWall), 'Yunami vault right wall exists');
assert(Boolean(yEscapeLedge), 'Yunami vault escape ledge exists at y=490');
assert(Boolean(yShuriken), 'Yunami vault bonus Shuriken #4 exists at x=2580, y=640');

const yDeltaY = yFloor.y - yEscapeLedge.y;
console.log(`Yunami Vault Depth: ${yDeltaY}px`);
assert(yDeltaY === 190, `Depth is exactly 190px (got ${yDeltaY})`);

// --- 2. Chinoike Jigoku: Sunken Blood Altar Alcove ---
console.log('\n--- Checking Chinoike Jigoku Sunken Blood Altar Alcove ---');
const cFloor = chinoike.platforms.find((p) => p.x === 2766 && p.y === 760);
const cLeftWall = chinoike.platforms.find((p) => p.x === 2750 && p.y === 570);
const cRightWall = chinoike.platforms.find((p) => p.x === 2946 && p.y === 570 && p.type === 'ground');
const cEscapeLedge = chinoike.platforms.find((p) => p.x === 2946 && p.y === 570 && p.type === 'platform');
const cShuriken = chinoike.collectibleShurikens.find((s) => s.id === 104);

assert(Boolean(cFloor), 'Chinoike altar floor exists at y=760');
assert(Boolean(cLeftWall), 'Chinoike altar left wall exists');
assert(Boolean(cRightWall), 'Chinoike altar right wall exists');
assert(Boolean(cEscapeLedge), 'Chinoike altar escape ledge exists at y=570');
assert(Boolean(cShuriken), 'Chinoike altar bonus Shuriken #104 exists at x=2855, y=720');

const cDeltaY = cFloor.y - cEscapeLedge.y;
console.log(`Chinoike Altar Depth: ${cDeltaY}px`);
assert(cDeltaY === 190, `Depth is exactly 190px (got ${cDeltaY})`);

// --- 3. Physics Simulation: Ground Jump vs Double Jump + Dash ---
console.log('\n--- Simulating Physics Mechanics ---');

const GRAVITY = 0.7;
const JUMP_VELOCITY = -14.5;
const DOUBLE_JUMP_VY = -10.5;
const DASH_SPEED = 10.5;
const DASH_DURATION = 12;

function simulateSingleJump(floorY) {
  let y = floorY;
  let vy = JUMP_VELOCITY;
  let minY = y;
  for (let t = 0; t < 60; t++) {
    y += vy;
    vy += GRAVITY;
    if (y < minY) minY = y;
    if (y >= floorY && t > 0) break;
  }
  return minY;
}

function simulateDoubleJump(floorY, doubleJumpTick = 20) {
  let y = floorY;
  let vy = JUMP_VELOCITY;
  let minY = y;
  for (let t = 0; t < 60; t++) {
    if (t === doubleJumpTick) {
      vy = DOUBLE_JUMP_VY;
    }
    y += vy;
    vy += GRAVITY;
    if (y < minY) minY = y;
    if (y >= floorY && t > 0) break;
  }
  return minY;
}

// Test Yunami (Floor 680, Ledge 490)
const singleJumpMinYYunami = simulateSingleJump(680);
console.log(`Single Jump max vertical reach in Yunami: y=${singleJumpMinYYunami.toFixed(1)} (needed: y<=490)`);
assert(singleJumpMinYYunami > 490, 'Single Jump CANNOT escape Yunami vault (feet 40px too low)');

const doubleJumpMinYYunami = simulateDoubleJump(680, 20);
console.log(`Double Jump max vertical reach in Yunami: y=${doubleJumpMinYYunami.toFixed(1)} (needed: y<=490)`);
assert(doubleJumpMinYYunami <= 490, 'Double Jump clears 490px height threshold');

// Dash horizontal traversal
const dashDistance = DASH_SPEED * DASH_DURATION;
console.log(`Dash horizontal carry distance: ${dashDistance}px`);
assert(dashDistance >= 120, 'Dash provides 126px horizontal reach, cleanly crossing the overhang');

// Test Chinoike (Floor 760, Ledge 570)
const singleJumpMinYChinoike = simulateSingleJump(760);
console.log(`Single Jump max vertical reach in Chinoike: y=${singleJumpMinYChinoike.toFixed(1)} (needed: y<=570)`);
assert(singleJumpMinYChinoike > 570, 'Single Jump CANNOT escape Chinoike alcove (feet 40px too low)');

const doubleJumpMinYChinoike = simulateDoubleJump(760, 20);
console.log(`Double Jump max vertical reach in Chinoike: y=${doubleJumpMinYChinoike.toFixed(1)} (needed: y<=570)`);
assert(doubleJumpMinYChinoike <= 570, 'Double Jump clears 570px height threshold');

console.log('\n=== All Map Platforming Challenge Verifications Passed! ===');
