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

// 1. Initial State in Level (now idle, spawn effect removed)
check('Hanzo initial state in createChinoikeJigoku is idle', level.includes("state: 'idle' as const"));

// 2. enemiesRef Initialization
check('enemiesRef directly initialized with boss filtering', useGameEngine.includes("if (hasBossCheckpoint && effectiveLocation === 'chinoike-jigoku') {"));

// 3. Boss Arena Trigger — title card only, no spawn effect, no intro sound
check('Boss intro sets Hanzo state to idle', useGameEngine.includes("hanzo.state = 'idle';") && useGameEngine.includes("hanzo.x = 6750;"));
check('Boss intro does NOT play Hanzo intro sound', !useGameEngine.includes("soundEffects.playHanzoIntro();"));
check('Boss intro timer triggers 160 frames (title card only)', useGameEngine.includes("bossIntroTimerRef.current = 160;"));

// 4. Combat Engagement when Intro Ends
check('Hanzo transitions to chase with active speed when intro ends', useGameEngine.includes("hanzo.state = 'chase';") && useGameEngine.includes("hanzo.vx = hanzo.facing * 3.4;"));
check('Battle music starts when intro ends', useGameEngine.includes("soundEffects.playHanzoBattleMusic();"));

// 5. Zero Wyverns / Clamping
check('maxBatX clamped to 4000 in Chinoike Jigoku', useGameEngine.includes("const maxBatX = 4000;"));
check('Non-boss enemies filtered out when in arena', useGameEngine.includes("if (level.storyLocation === 'chinoike-jigoku' && (bossIntroTriggeredRef.current || p.x >= 5800)) {"));

// 6. Checkpoint Revive & Extra Life
check('Boss checkpoint respawn replenishes extra life to 1', useGameEngine.includes("extraLivesRef.current = 1; // Always replenish extra spirit"));
check('Boss checkpoint respawn resets Hanzo to idle state', useGameEngine.includes("hanzoEnemy.state = 'idle';"));

// 7. Hanzo Character — spawn effect removed
check('HanzoCharacter spawn effect GIF removed', !hanzoChar.includes("if (state === 'spawn') {") && hanzoChar.includes("spawn effect removed"));

// 8. GameScreen — spawn effect import removed
check('HANZO_SPAWN_EFFECT not imported in GameScreen', !gameScreen.includes("HANZO_SPAWN_EFFECT"));

// 9. GameScreen EnemyView pre-intro visibility
check('EnemyView hides Hanzo before boss intro is triggered', gameScreen.includes("if (enemy.type === 'hanzo' && !bossIntroTriggered && storyLocation === 'chinoike-jigoku') return null;"));

// 10. Boss Letterbox & Atmosphere
check('Title music pauses during boss intro and arena', gameScreen.includes("!render.bossIntroTriggered && !render.inBossArena"));

// 11. Choice Key Input
check('Choice input handles KeyW and KeyS and ignores Space', gameScreen.includes("e.code === 'KeyW'") && gameScreen.includes("e.code === 'KeyS'") && gameScreen.includes("// SPACE must NOT accidentally confirm the choice!"));

// 12. Defeat & Execution
check('Holds death_hanzo_4 during defeat / choice / execution', useGameEngine.includes("e.deathFrame = 3; // death_hanzo_4 HOLD FRAME"));
check('Execution continues from death_hanzo_5 onward', useGameEngine.includes("e.deathFrame = 4; // death_hanzo_5"));
check('Execution requires real player hit', useGameEngine.includes("triggerHanzoExecutionBlow(e, p.facing)"));
check('Spared Hanzo runs and dashes into portal', useGameEngine.includes("hanzo.state = 'dash';") && useGameEngine.includes("hanzo.vx = 9.0;"));

console.log('ALL VERIFICATION CHECKS COMPLETE.');
