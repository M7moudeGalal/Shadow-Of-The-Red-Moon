// Automated logic validation test for Hanzo Teleport, Execution Final Hit, and Level Fixes
const fs = require('fs');
const path = require('path');

const engineSource = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
const screenSource = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log('--- TEST SUITE: HANZO TELEPORT, KILL FINAL HIT & LEVEL FIXES ---');

// 1. UnknownCutsceneCharacterView maps teleport to teleport_attack
assert(
  screenSource.includes("actor.anim === 'teleport'") &&
  screenSource.includes("'teleport_attack'"),
  "UnknownCutsceneCharacterView properly maps actor.anim === 'teleport' to 'teleport_attack'"
);

// 2. Opening cutscene exit uses Hanzo teleport and Hanzo ghosts
assert(
  engineSource.includes("sc.unknownActor.anim = 'teleport'") &&
  engineSource.includes("state: 'teleport_attack'") &&
  engineSource.includes("state: 'dash'"),
  "opening_unknown_exit performs teleport animation and uses Hanzo ghosts"
);

// Verify dashGhostsRef is NOT used for Unknown in opening cutscene
const openingExitMatch = engineSource.match(/if \(sc\.phase === 'opening_unknown_exit'\) \{([\s\S]*?)(?=\/\/ FINALE CUTSCENE)/);
assert(
  openingExitMatch && !openingExitMatch[1].includes('dashGhostsRef.current.push'),
  "opening_unknown_exit uses hanzoGhostsRef and does NOT spawn ninja dash ghosts"
);

// 3. Game loop does NOT bypass hanzo_execution_pending and hanzo_death_continue
assert(
  engineSource.includes("storyCinematicRef.current.phase !== 'hanzo_execution_pending'") &&
  engineSource.includes("storyCinematicRef.current.phase !== 'hanzo_death_continue'"),
  "step() allows game loop to execute during hanzo_execution_pending and hanzo_death_continue"
);

// 4. Hanzo execution blow trigger sets deadTimer = 24
assert(
  engineSource.includes('e.deadTimer = 24;'),
  "triggerHanzoExecutionBlow sets deadTimer = 24 for full death animation"
);

// 5. hanzoDefeatedRef is set to true on Hanzo death in kill path
assert(
  engineSource.includes("hanzoDefeatedRef.current = true;"),
  "hanzoDefeatedRef.current is explicitly set to true when Hanzo's death animation finishes"
);

// 6. Teleport destination in player's path
assert(
  engineSource.includes("const heading = p.vx !== 0 ? (p.vx > 0 ? 1 : -1) : p.facing;") &&
  engineSource.includes("let destX = p.x + (heading === 1 ? 56 : -56);"),
  "Hanzo teleport destination places Hanzo directly in front of the ninja's heading path"
);

// 7. Teleport timer is extended to 34 ticks for full 12-frame display
assert(
  engineSource.includes("e.teleportTimer = 34;"),
  "Hanzo teleport timer is set to 34 ticks so all 12 frames of teleport strike play clearly"
);

// 8. Chinoike bat limit increased to 6000
assert(
  engineSource.includes("const maxBatX = 6000;"),
  "Chinoike maxBatX is increased to 6000"
);

console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY!');
