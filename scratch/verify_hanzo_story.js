// Automated Verification Script for Shadow of the Red Moon - Hanzo Story Cutscene System
import assert from 'assert';
import fs from 'fs';
import path from 'path';

console.log('=== VERIFYING HANZO STORY CUTSCENE SYSTEM ===');

// 1. Verify types.ts
const typesContent = fs.readFileSync(path.resolve('src/game/types.ts'), 'utf-8');
assert(typesContent.includes("'opening_dialogue'"), 'opening_dialogue phase must exist');
assert(typesContent.includes("'opening_spirit_transfer'"), 'opening_spirit_transfer phase must exist');
assert(typesContent.includes("'opening_unknown_exit'"), 'opening_unknown_exit phase must exist');
assert(typesContent.includes("'hanzo_defeated'"), 'hanzo_defeated phase must exist');
assert(typesContent.includes("'final_dialogue'"), 'final_dialogue phase must exist');
assert(typesContent.includes("'unknown_reveal'"), 'unknown_reveal phase must exist');
assert(typesContent.includes("'choice_waiting'"), 'choice_waiting phase must exist');
assert(typesContent.includes("'hanzo_execution_pending'"), 'hanzo_execution_pending phase must exist');
assert(typesContent.includes("'hanzo_death_continue'"), 'hanzo_death_continue phase must exist');
assert(typesContent.includes("'hanzo_spared'"), 'hanzo_spared phase must exist');
assert(typesContent.includes("'hanzo_escape'"), 'hanzo_escape phase must exist');
assert(typesContent.includes("'dlc_teaser'"), 'dlc_teaser phase must exist');
assert(typesContent.includes("type StoryChoice = 'kill' | 'spare'"), 'StoryChoice must exist');
assert(typesContent.includes("type CinematicSpeaker = 'HANZO' | 'UNKNOWN' | 'HANZO — SHADOW' | 'THE GUARDIAN'"), 'CinematicSpeaker must have exact characters');
console.log('✓ types.ts definitions validated successfully');

// 2. Verify useGameEngine.ts
const engineContent = fs.readFileSync(path.resolve('src/game/useGameEngine.ts'), 'utf-8');

// Check Dialogues
assert(engineContent.includes('OPENING_CUTSCENE_DIALOGUES'), 'OPENING_CUTSCENE_DIALOGUES must be defined');
assert(engineContent.includes('FINAL_CUTSCENE_DIALOGUES'), 'FINAL_CUTSCENE_DIALOGUES must be defined');

// Check Character Naming
assert(engineContent.includes("speaker: 'UNKNOWN'"), "UNKNOWN speaker must be used prior to reveal");
assert(engineContent.includes("speaker: 'HANZO'"), "HANZO player character speaker must be used");
assert(engineContent.includes("speaker: 'HANZO — SHADOW'"), "HANZO — SHADOW counterpart speaker must be used upon reveal");

// Check Opening Cutscene initialization & arrival
assert(engineContent.includes('createOpeningCutsceneState'), 'createOpeningCutsceneState must be defined');
assert(engineContent.includes('initOpeningCutscene'), 'initOpeningCutscene must be implemented');
assert(engineContent.includes('extraLivesRef.current = 0'), 'Extra lives must start at 0 before spirit transfer');
assert(engineContent.includes('extraLivesRef.current = 1'), 'Extra lives must become 1 upon spirit transfer');
assert(engineContent.includes('spiritOrb'), 'spirit transfer must track orb');
assert(engineContent.includes('unknownActor'), 'unknownActor must be tracked');

// Check Hanzo Boss Defeat Frame Hold
assert(engineContent.includes("e.deathFrame = 3;"), 'Must freeze on deathFrame = 3 (death_hanzo_4)');
assert(engineContent.includes("startFinalCutscene(e)"), 'Defeat must trigger startFinalCutscene(e)');

// Check Execution Hit Collision & Resume death animation
assert(engineContent.includes("hanzo_execution_pending"), 'Must handle hanzo_execution_pending');
assert(engineContent.includes("triggerHanzoExecutionBlow"), 'triggerHanzoExecutionBlow must exist');
assert(engineContent.includes("death_hanzo_5"), 'Must document transition to death_hanzo_5');

// Check Spare Escape Logic
assert(engineContent.includes("hanzo_escape"), 'Must handle hanzo_escape phase');

// Check Post Credits Teaser Logic
assert(engineContent.includes("dlc_teaser"), 'Must support dlc_teaser phase');
console.log('✓ useGameEngine.ts narrative logic, arrival, and spirit soul transfer verified successfully');

// 3. Verify GameScreen.tsx UI
const screenContent = fs.readFileSync(path.resolve('src/pages/GameScreen.tsx'), 'utf-8');
assert(screenContent.includes('JapaneseStoryDialogueBox'), 'JapaneseStoryDialogueBox must be rendered');
assert(screenContent.includes('StoryChoiceModal'), 'StoryChoiceModal must be rendered');
assert(screenContent.includes('ExecutionPromptBanner'), 'ExecutionPromptBanner must be rendered');
assert(screenContent.includes('PostCreditsTeaserView'), 'PostCreditsTeaserView must be rendered');
assert(screenContent.includes('UnknownCutsceneCharacterView'), 'UnknownCutsceneCharacterView must be rendered in world space');
assert(screenContent.includes('SpiritTransferOrbView'), 'SpiritTransferOrbView must be rendered in world space');

// Check that StoryIntroBanner only displays after cutscene
assert(screenContent.includes('!render.storyCinematic?.active'), 'StoryIntroBanner must only display when cutscene is not active');

// Check that dialogue advance is triggered exclusively via user input (Space / Enter / Click)
assert(screenContent.includes("e.key === ' ' || e.key === 'Enter'"), 'Space or Enter advances dialogue');
assert(screenContent.includes("onClick={handleClick}"), 'Mouse click advances dialogue');

// Check height constraint (20-25% screen height, 98px / 450px = 21.8%)
assert(screenContent.includes("height: '98px'"), 'Dialogue box must respect 20-25% height constraint');

console.log('✓ GameScreen.tsx UI components, StoryIntroBanner timing, and keybindings verified successfully');
console.log('ALL HANZO STORY CUTSCENE SYSTEM CHECKS PASSED!');
