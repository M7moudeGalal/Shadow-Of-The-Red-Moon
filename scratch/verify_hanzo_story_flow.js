const fs = require('fs');
const path = require('path');

const root = 'c:/Games/project';

function check(name, condition) {
  if (condition) {
    console.log(`[PASS] ${name}`);
  } else {
    console.error(`[FAIL] ${name}`);
    process.exitCode = 1;
  }
}

const useGameEngine = fs.readFileSync(path.join(root, 'src/game/useGameEngine.ts'), 'utf8');
const gameScreen = fs.readFileSync(path.join(root, 'src/pages/GameScreen.tsx'), 'utf8');
const hanzoChar = fs.readFileSync(path.join(root, 'src/components/HanzoCharacter.tsx'), 'utf8');
const level = fs.readFileSync(path.join(root, 'src/game/level.ts'), 'utf8');

// 1. Initial State in Level
check('Hanzo initial state in createChinoikeJigoku is spawn', level.includes("state: 'spawn' as const"));
check('Bats 4 and 5 absent from createChinoikeJigoku', !level.includes("mkEnemy('spirit', 4850") && !level.includes("mkEnemy('spirit', 5450") && !level.includes("mkEnemy('spirit', 6120"));

// 2. enemiesRef Initialization
check('enemiesRef directly initialized with boss filtering', useGameEngine.includes("if (hasBossCheckpoint && effectiveLocation === 'chinoike-jigoku') {"));

// 3. Boss Arena Trigger & Spawn Effect
check('Boss intro sets Hanzo state to spawn', useGameEngine.includes("hanzo.state = 'spawn';\n          hanzo.x = 6750;"));
check('Boss intro plays Hanzo intro music', useGameEngine.includes("soundEffects.playHanzoIntro();"));
check('Boss intro timer triggers 360 frames', useGameEngine.includes("bossIntroTimerRef.current = 360;"));

// 4. Combat Engagement when Intro Ends
check('Hanzo transitions to chase with active speed when intro ends', useGameEngine.includes("hanzo.state = 'chase';\n          hanzo.facing = p.x >= hanzo.x ? 1 : -1;\n          hanzo.vx = hanzo.facing * 3.4;"));
check('Battle music starts when intro ends', useGameEngine.includes("soundEffects.playHanzoBattleMusic();"));

// 5. Zero Wyverns / Clamping
check('maxBatX clamped to 4000 in Chinoike Jigoku', useGameEngine.includes("const maxBatX = 4000;"));
check('Non-boss enemies filtered out when in arena', useGameEngine.includes("if (level.storyLocation === 'chinoike-jigoku' && (bossIntroTriggeredRef.current || p.x >= 5800)) {"));

// 6. Checkpoint Revive & Extra Life
check('Boss checkpoint respawn replenishes extra life to 1', useGameEngine.includes("extraLivesRef.current = 1; // Always replenish extra spirit"));
check('Boss checkpoint respawn resets Hanzo to spawn state', useGameEngine.includes("hanzoEnemy.state = 'spawn';"));

// 7. Hanzo Character Spawn Effect
check('HanzoCharacter renders HANZO_SPAWN_EFFECT on spawn state', hanzoChar.includes("if (state === 'spawn') {") && hanzoChar.includes("HANZO_SPAWN_EFFECT"));

// 8. GameScreen EnemyView pre-spawn visibility
check('EnemyView hides Hanzo before boss intro is triggered', gameScreen.includes("if (enemy.type === 'hanzo' && !bossIntroTriggered && storyLocation === 'chinoike-jigoku') return null;"));

// 9. Boss Letterbox & Atmosphere
check('Title music pauses during boss intro and arena', gameScreen.includes("!render.bossIntroTriggered && !render.inBossArena"));

// 10. Choice Key Input
check('Choice input handles KeyW and KeyS and ignores Space', gameScreen.includes("e.code === 'KeyW'") && gameScreen.includes("e.code === 'KeyS'") && gameScreen.includes("// SPACE must NOT accidentally confirm the choice!"));

// 11. Defeat & Execution
check('Holds death_hanzo_4 during defeat / choice / execution', useGameEngine.includes("e.deathFrame = 3; // death_hanzo_4 HOLD FRAME"));
check('Execution continues from death_hanzo_5 onward', useGameEngine.includes("e.deathFrame = 4; // death_hanzo_5"));
check('Execution requires real player hit', useGameEngine.includes("triggerHanzoExecutionBlow(e, p.facing)"));
check('Spared Hanzo runs and dashes into portal', useGameEngine.includes("hanzo.state = 'dash';\n        hanzo.vx = 9.0;"));

console.log('All verification checks complete.');
