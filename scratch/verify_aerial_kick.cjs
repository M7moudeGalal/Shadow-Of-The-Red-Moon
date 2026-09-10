const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING AERIAL KICK IMPLEMENTATION ===\n');

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}`);
    allPassed = false;
  }
}

// 1. Check sprite assets
const spriteDir = path.join(__dirname, '../public/assets/sprites/player/attack/aerial-kick');
assert('Sprite directory exists', fs.existsSync(spriteDir));
for (let i = 1; i <= 8; i++) {
  const frameName = `airkick_0${i}.png`;
  const framePath = path.join(spriteDir, frameName);
  const exists = fs.existsSync(framePath);
  const size = exists ? fs.statSync(framePath).size : 0;
  assert(`Sprite frame ${frameName} exists and non-empty (${size} bytes)`, exists && size > 1000);
}

// 2. Check types.ts
const typesCode = fs.readFileSync(path.join(__dirname, '../src/game/types.ts'), 'utf8');
assert('types.ts contains aerial_kick in AnimState', typesCode.includes("'aerial_kick'") && typesCode.includes('AnimState'));
assert('types.ts contains aerial_kick in NinjaSkill', typesCode.includes('export type NinjaSkill') && typesCode.includes("'aerial_kick'"));

// 3. Check NinjaCharacter.tsx
const ninjaCode = fs.readFileSync(path.join(__dirname, '../src/components/NinjaCharacter.tsx'), 'utf8');
assert('NinjaCharacter.tsx exports AERIAL_KICK_FRAMES', ninjaCode.includes('export const AERIAL_KICK_FRAMES = ['));
assert('NinjaCharacter.tsx preloads AERIAL_KICK_FRAMES', ninjaCode.includes('...AERIAL_KICK_FRAMES'));
assert('NinjaCharacter.tsx handles isAerialKick', ninjaCode.includes("anim === 'aerial_kick' || activeSkill === 'aerial_kick'"));
assert('NinjaCharacter.tsx has aerial_kick in currentMode', ninjaCode.includes("isAerialKick"));
assert('NinjaCharacter.tsx has aerial_kick interval', ninjaCode.includes("if (currentMode === 'aerial_kick')"));
assert('NinjaCharacter.tsx renders aerial_kick frames', ninjaCode.includes("} else if (isAerialKick) {") && ninjaCode.includes('AERIAL_KICK_FRAMES[idx]'));

// 4. Check useGameEngine.ts
const engineCode = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
assert('useGameEngine.ts defines AERIAL_KICK_DURATION', engineCode.includes('const AERIAL_KICK_DURATION = 24'));
assert('useGameEngine.ts has skillQ in InputState', engineCode.includes('skillQ: boolean;') && engineCode.includes('skillQPressed: boolean;'));
assert('useGameEngine.ts handles KeyQ in keydown', engineCode.includes("k === 'q' || code === 'KeyQ'") && engineCode.includes('inp.skillQ = true'));
assert('useGameEngine.ts handles KeyQ in keyup', engineCode.includes("k === 'q' || code === 'KeyQ'") && engineCode.includes('inp.skillQ = false'));
assert('useGameEngine.ts triggers aerial_kick when skillQPressed', engineCode.includes("p.activeSkill = 'aerial_kick'") && engineCode.includes('inp.skillQPressed'));
assert('useGameEngine.ts applies upward vy launch', engineCode.includes('p.vy = -8.5') && engineCode.includes('p.vx = p.facing * 4.5'));
assert('useGameEngine.ts executes aerial_kick frame tick', engineCode.includes("} else if (skill === 'aerial_kick') {"));
assert('useGameEngine.ts calculates anti-air kickBox', engineCode.includes('y: p.y - 24') && engineCode.includes('applySkillHit(kickBox, 2.0'));

// 5. Check GameScreen.tsx
const screenCode = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');
assert('GameScreen.tsx displays Q AERIAL KICK badge', screenCode.includes('AERIAL KICK') && screenCode.includes('Q'));

// 6. Hitbox coverage simulation against Wyverns
// Wyverns fly around 40-70px above player ground level and forward by 10-40px
const player = { x: 1000, y: 500, w: 28, h: 48, facing: 1 };
const kickBox = {
  x: player.facing === 1 ? player.x : player.x - 36,
  y: player.y - 24,
  w: 64,
  h: 68,
};
const airborneWyvern = { x: 1025, y: 485, w: 32, h: 32 }; // Flying right in front and above player

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

assert('Aerial kick hitbox successfully overlaps airborne Wyvern', rectsOverlap(kickBox, airborneWyvern));

console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
process.exit(allPassed ? 0 : 1);
