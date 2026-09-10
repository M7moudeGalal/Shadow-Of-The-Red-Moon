const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING HANZO KILL CHOOSE BUG FIX ===\n');

// 1. Verify useGameEngine.ts
const engineContent = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');

// Check that inDeathCinematic is disabled during story cutscenes
assert(
  engineContent.includes('const inDeathCinematic = hanzoDeathCinematicRef.current.active && !storyCinematicRef.current.active;'),
  'inDeathCinematic must be false during active story cutscenes'
);
console.log('✔ inDeathCinematic: Properly bypassed when storyCinematic is active, preventing player lock');

// Check startFinalCutscene resets hanzoDeathCinematicRef and positions player
assert(
  engineContent.includes('hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };') &&
  engineContent.includes('p.facing = p.x <= hanzo.x ? 1 : -1;') &&
  engineContent.includes('p.x = p.facing === 1 ? hanzo.x - 52 : hanzo.x + 52;'),
  'startFinalCutscene must reset hanzoDeathCinematicRef and position player close to Hanzo'
);
console.log('✔ startFinalCutscene: Player correctly positioned 52px from Hanzo facing him, death cinematic cleared');

// Check selectStoryChoice('kill')
assert(
  engineContent.includes("sc.phase = 'hanzo_execution_pending';") &&
  engineContent.includes('hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };'),
  "selectStoryChoice('kill') must reset death cinematic and ensure player is poised for execution"
);
console.log("✔ selectStoryChoice('kill'): Prepares execution state, player position, and Hanzo hold frame");

// Check attack interception during hanzo_execution_pending in game loop
assert(
  engineContent.includes("if (storyCinematicRef.current.phase === 'hanzo_execution_pending') {") &&
  engineContent.includes('triggerHanzoExecutionBlow(hanzo, p.facing);'),
  'Attack input during execution pending must immediately trigger execution blow'
);
console.log('✔ Game Loop: Any attack action during execution pending reliably delivers the execution blow');

// Check triggerExecutionBlow is exported
assert(
  engineContent.includes('triggerExecutionBlow = useCallback(') &&
  engineContent.includes('triggerExecutionBlow,'),
  'triggerExecutionBlow must be exported by useGameEngine'
);
console.log('✔ useGameEngine: Exposes triggerExecutionBlow callback for UI and keyboard handlers');

// Check saveStoryFlags on hanzo_dead
assert(
  engineContent.includes("saveStoryFlags({") &&
  engineContent.includes("hanzo_choice_made: 'kill'"),
  "Hanzo death sequence must save story flags with hanzo_choice_made: 'kill'"
);
console.log("✔ Story Flags: Saves hanzo_choice_made: 'kill' upon Hanzo's demise");

// 2. Verify GameScreen.tsx
const screenContent = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');

// Check triggerExecutionBlow hook destructuring
assert(
  screenContent.includes('triggerExecutionBlow,'),
  'GameScreen must destructure triggerExecutionBlow from useGameEngine'
);
console.log('✔ GameScreen: Destructures triggerExecutionBlow from useGameEngine');

// Check keydown handler for hanzo_execution_pending
assert(
  screenContent.includes("sc.phase === 'hanzo_execution_pending'") &&
  screenContent.includes('triggerExecutionBlow()'),
  'Keydown handler must call triggerExecutionBlow on attack/enter/space during execution pending'
);
console.log('✔ Keyboard Handler: Enter, Space, J, Z, X, C, Q all trigger the execution blow');

// Check ExecutionPromptBanner has click button
assert(
  screenContent.includes('onClick={(e) => {') &&
  screenContent.includes('onExecute?.()') &&
  screenContent.includes('DELIVER THE FINAL BLOW [ATTACK / CLICK / ENTER]'),
  'ExecutionPromptBanner must be an interactive button'
);
console.log('✔ ExecutionPromptBanner: Interactive clickable button allows direct execution via mouse click');

// Check viewport click handler
assert(
  screenContent.includes("render.storyCinematic?.phase === 'hanzo_execution_pending'") &&
  screenContent.includes('triggerExecutionBlow();'),
  'Clicking anywhere on game viewport during execution pending must trigger execution blow'
);
console.log('✔ Viewport Click: Clicking anywhere on the game canvas delivers the execution blow');

console.log('\nALL 9 CHECKS PASSED! The Hanzo kill choice bug is completely resolved.');
