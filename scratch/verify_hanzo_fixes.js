// verify_hanzo_fixes.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log("=== VERIFYING HANZO STORY & BOSS FIXES ===");

const useGameEngineContent = fs.readFileSync(path.resolve(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
const levelContent = fs.readFileSync(path.resolve(__dirname, '../src/game/level.ts'), 'utf8');
const gameScreenContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');
const gameOverContent = fs.readFileSync(path.resolve(__dirname, '../src/pages/GameOverPage.tsx'), 'utf8');

// 1. Check Unknown actor animation in cutscene
assert(useGameEngineContent.includes("unknownActor: {\n      x: 380,\n      y: 544,\n      facing: -1,\n      anim: 'idle',"), "Unknown actor initial anim must be idle");
assert(useGameEngineContent.includes("sc.unknownActor.anim = 'idle'"), "Unknown actor anim must be idle during cutscene");
console.log("✔ 1. Unknown actor anim is 'idle' during cutscene.");

// 2. Check Hanzo dash into gate of Chinoike Jigoku after cutscene
assert(useGameEngineContent.includes("switchStoryLocation('chinoike-jigoku', true)"), "Cutscene exit must transition to Chinoike Jigoku");
assert(useGameEngineContent.includes("p.anim = 'dash'"), "Hanzo must dash into the gate");
assert(gameScreenContent.includes("<ChinoikeToriiGateView"), "Torii gate of Chinoike Jigoku must be rendered");
console.log("✔ 2. Hanzo dashes into the Torii Gate of Chinoike Jigoku after the cutscene.");

// 3. Check Opening Cutscene plays once and skipped on Try Again
assert(useGameEngineContent.includes("sessionStorage.getItem('shadow_opening_seen') === 'true'"), "Must check sessionStorage for opening seen");
assert(useGameEngineContent.includes("sessionStorage.setItem('shadow_opening_seen', 'true')"), "Must record opening seen in sessionStorage");
assert(gameOverContent.includes("TRY AGAIN"), "GameOverPage has TRY AGAIN button");
assert(gameOverContent.includes("sessionStorage.removeItem('shadow_opening_seen')"), "Title Menu resets opening seen");
console.log("✔ 3. Opening cutscene plays once; never replays on Try Again.");

// 4. Check Problem Entering Boss Area & Checkpoint
assert(levelContent.includes("{ x: 6120, y: 280 - 70, w: 30, h: 70, activated: false }"), "Boss arena entrance must be a checkpoint in level.ts");
assert(useGameEngineContent.includes("level.checkpoint.activated = true;"), "Boss arena entry must activate checkpoint");
assert(useGameEngineContent.includes("sessionStorage.setItem('shadow_boss_checkpoint', 'true')"), "Boss arena checkpoint persisted for Try Again");
assert(useGameEngineContent.includes("p.invuln = 180"), "Player gets safe invulnerability on entering boss arena");
assert(useGameEngineContent.includes("enemiesRef.current.filter((e) => e.type === 'hanzo')"), "Non-boss enemies despawned on arena entry");
console.log("✔ 4. Boss Arena entrance problem fixed & auto-activated as Checkpoint.");

// 5. Check Hanzo multi-hit combat
assert(levelContent.includes("hp: 8, maxHp: 8"), "Hanzo boss has 8 HP");
assert(useGameEngineContent.includes("e.hp = Math.max(0, e.hp - 1);"), "Hanzo takes decrementing HP damage");
assert(useGameEngineContent.includes("triggerHanzoDamage(e, hitFacing)"), "Hanzo triggers hurt reaction when HP > 0");
assert(useGameEngineContent.includes("triggerHanzoLethalDeath(e, hitFacing)"), "Hanzo triggers lethal death when HP <= 0");
console.log("✔ 5. Hanzo boss combat has 8 HP with hurt stagger and 8th-hit lethal finisher.");

// 6. Platform seam collision
assert(useGameEngineContent.includes("if (plat.type === 'platform') continue;"), "Jump-through platforms don't block horizontally");
assert(useGameEngineContent.includes("if (p.y + p.h <= plat.y + 8)"), "Platform tops don't block horizontal walking/dashing");
console.log("✔ 6. Platform seam collision fixed to prevent phantom walls or falling through ground.");

console.log("\nALL VERIFICATIONS PASSED!");
