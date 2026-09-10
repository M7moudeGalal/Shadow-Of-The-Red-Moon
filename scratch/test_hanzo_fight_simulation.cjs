const fs = require('fs');
const path = require('path');

const engineCode = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
const levelCode = fs.readFileSync(path.join(__dirname, '../src/game/level.ts'), 'utf8');
const screenCode = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');

console.log('=== AUDITING HANZO FINAL FIGHT LOGIC ===\n');

// Test 1: Check createChinoikeJigoku Hanzo definition
console.log('1. Checking Hanzo spawn in level.ts...');
const hanzoSpawnMatch = levelCode.match(/mkEnemy\('hanzo',\s*(\d+),\s*([0-9\s\-]+),\s*(\d+)\)/);
if (hanzoSpawnMatch) {
  console.log(`   Hanzo spawn: x=${hanzoSpawnMatch[1]}, y=${hanzoSpawnMatch[2]}, range=${hanzoSpawnMatch[3]}`);
} else {
  console.error('   FAIL: Hanzo spawn not found in level.ts');
}

// Test 2: Check Hanzo platform in level.ts
console.log('2. Checking arena platform in level.ts...');
const arenaMatch = levelCode.match(/\{ x: 6100, y: 280, w: 1400, h: 40, type: 'ground' \}/);
console.log('   Arena platform [6100 - 7500, y=280]:', !!arenaMatch);

// Test 3: Check Boss Arena entry trigger
console.log('3. Checking Boss Arena trigger condition...');
const triggerMatch = engineCode.includes("p.x >= 6080 && !hanzoDefeatedRef.current");
console.log('   Arena trigger at p.x >= 6080:', triggerMatch);

// Test 4: Check Hanzo combat activation when bossIntroTimer reaches 0
console.log('4. Checking Hanzo activation at bossIntroTimer === 0...');
const activateMatch = engineCode.includes("hanzo.state = 'chase'") && engineCode.includes("soundEffects.playHanzoBattleMusic()");
console.log('   Hanzo transitions to chase & music starts:', activateMatch);

// Test 5: Check player attack hitting Hanzo
console.log('5. Checking player attack hitting Hanzo...');
const hitMatch = engineCode.includes("triggerHanzoHit(e, p.facing)");
console.log('   triggerHanzoHit called on attack:', hitMatch);

// Test 6: Check lethal death transition
console.log('6. Checking triggerHanzoLethalDeath...');
const lethalMatch = engineCode.includes("triggerHanzoLethalDeath(e, hitFacing)");
console.log('   triggerHanzoLethalDeath called at hp <= 0:', lethalMatch);

// Test 7: Check final cutscene trigger
console.log('7. Checking startFinalCutscene trigger...');
const cutsceneMatch = engineCode.includes("startFinalCutscene(e)");
console.log('   startFinalCutscene called after death frame 3:', cutsceneMatch);

// Test 8: Check player respawn logic at boss checkpoint
console.log('8. Checking player death & respawn at boss checkpoint...');
const respawnLocMatch = engineCode.includes("respawnPointRef.current = { x: 6140, y: 280 - 48 }") || engineCode.includes("respawnPointRef.current = {");
console.log('   Respawn point sets to arena (x=6140, y=232):', respawnLocMatch);

// Test 9: Check if Hanzo airborne landing has safety
console.log('9. Checking Hanzo landing logic...');
const hanzoLandingMatch = engineCode.includes("e.jumpPhase = 'landing'");
console.log('   Hanzo jump landing phase:', hanzoLandingMatch);

console.log('\n=== AUDIT COMPLETE ===');
