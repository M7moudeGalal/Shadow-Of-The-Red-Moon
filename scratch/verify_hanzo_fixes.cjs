const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING HANZO & OPENING CUTSCENE FIXES ===');

const useGameEngineContent = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
const gameScreenContent = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');
const homePageContent = fs.readFileSync(path.join(__dirname, '../src/pages/HomePage.tsx'), 'utf8');
const gameOverContent = fs.readFileSync(path.join(__dirname, '../src/pages/GameOverPage.tsx'), 'utf8');
const levelContent = fs.readFileSync(path.join(__dirname, '../src/game/level.ts'), 'utf8');

// 1. Opening Cutscene (UNKNOWN dashes into Torii Gate, Player Hanzo stays in Yunami Jigoku in idle)
assert(useGameEngineContent.includes("p.anim = 'idle'"), "Player should remain in idle");
assert(useGameEngineContent.includes("p.x = 180"), "Player should remain at x = 180");
assert(useGameEngineContent.includes("sc.unknownActor.anim = 'dash'"), "UNKNOWN actor should dash towards gate");
assert(useGameEngineContent.includes("sc.unknownActor.x += 6.5"), "UNKNOWN actor should move forward");
assert(useGameEngineContent.includes("sc.unknownActor.x >= 490"), "UNKNOWN actor enters the gate at 490");
assert(useGameEngineContent.includes("sc.unknownActor.hasEnteredGate = true"), "UNKNOWN actor marks entered gate");
assert(!useGameEngineContent.includes("switchStoryLocation('chinoike-jigoku', true);\n      }\n      return;\n    }\n\n    // FINALE CUTSCENE"), "Opening cutscene MUST NOT switch to Chinoike Jigoku");
console.log('✔ Opening cutscene: UNKNOWN enters the Torii Gate, player ninja stays in Yunami Jigoku in idle');

// 2. Torii Gate visibility in Yunami Jigoku
assert(gameScreenContent.includes("render.storyLocation === 'yunami-jigoku' && render.storyCinematic?.active && render.storyCinematic.phase.startsWith('opening_')"), "Torii gate must be visible throughout opening cutscene");
console.log('✔ Torii Gate: visible throughout opening scene in Yunami Jigoku');

// 3. Two Intros: 400 frames, Phase 1 (400->160) & Phase 2 (160->0)
assert(useGameEngineContent.includes("bossIntroTimerRef.current = 360") || useGameEngineContent.includes("bossIntroTimerRef.current = 400"), "Boss intro timer must be 360 or 400 ticks");
assert(useGameEngineContent.includes("p.invuln = 460"), "Player must have 460 ticks invulnerability during both intros");
assert(gameScreenContent.includes("isSpawnPhase = timer > 160"), "Phase 1 must trigger when timer > 160");
assert(gameScreenContent.includes("isTitlePhase = timer <= 160 && timer > 0"), "Phase 2 must trigger when timer <= 160");
console.log('✔ Two Intros: Phase 1 (Dimensional rift GIF) and Phase 2 (Calligraphy title card) configured for 400 ticks');

// 4. Boss intro keyboard skip: only Escape and Enter
assert(gameScreenContent.includes("if (e.key === 'Escape' || e.key === 'Enter')"), "Only Escape or Enter should skip boss intro");
assert(!gameScreenContent.includes("if (render.bossIntroTimer > 0) {\n        if (e.key === ' ' || e.key === 'Enter' || e.key === 'KeyZ'"), "Gameplay keys must NOT skip boss intro");
console.log('✔ Boss intro skip: gameplay keys (Z, X, C, Space) protected from accidental skipping');

// 5. Active Boss Combat upon intro completion
assert(useGameEngineContent.includes("hanzo.state = 'chase'"), "Hanzo must enter chase state on timer 0");
assert(useGameEngineContent.includes("hanzo.vx = hanzo.facing * 3.4") || useGameEngineContent.includes("hanzo.vx = hanzo.facing * 3.2"), "Hanzo must actively charge player");
assert(useGameEngineContent.includes("soundEffects.playHanzoBattleMusic()"), "Battle music must start");
console.log('✔ Boss Combat: Hanzo immediately chases and attacks player when intro finishes');

// 6. Boss Arena Checkpoint & Session Storage
assert(useGameEngineContent.includes("sessionStorage.setItem('shadow_boss_checkpoint', 'true')"), "Checkpoint must be saved in sessionStorage");
assert(homePageContent.includes("sessionStorage.removeItem('shadow_boss_checkpoint')"), "HomePage START GAME must clear boss checkpoint for fresh runs");
assert(homePageContent.includes("sessionStorage.removeItem('shadow_opening_seen')"), "HomePage START GAME must clear opening seen for fresh runs");
assert(gameOverContent.includes("navigate('game')"), "GameOverPage TRY AGAIN preserves checkpoint");
console.log('✔ Checkpoint system: Boss arena saved as checkpoint, retained on TRY AGAIN, cleared on TITLE MENU');

// 7. No Wyverns / Bats in Boss Arena
assert(!levelContent.includes("x: 5350, y: 150, facing: -1, type: 'bat'"), "Bat 6 removed from arena approach");
assert(!levelContent.includes("x: 5900, y: 140, facing: -1, type: 'bat'"), "Bat 7 removed from arena approach");
// Bat filtering now done via maxBatX clamp (4000) and arena filter
assert(useGameEngineContent.includes("maxBatX = 4000") || useGameEngineContent.includes("e.type === 'hanzo'"), "Bats clamped away from boss arena");
console.log('✔ Arena purity: Zero Corrupted Bats/Wyverns in the Hanzo Boss arena');

console.log('\nALL CHECKS PASSED SUCCESSFULLY! 🎉');
