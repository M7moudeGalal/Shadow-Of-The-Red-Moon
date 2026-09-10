const fs = require('fs');
const path = require('path');

const engineCode = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');

console.log('=== VERIFYING HANZO DEFEATED BUG ===');

// Check line where flags.hanzo_guardian_reveal_complete sets hanzoDefeatedRef
const bugPattern = /if\s*\(\s*flags\.hanzo_guardian_reveal_complete\s*\)\s*\{\s*hanzoDefeatedRef\.current\s*=\s*true;\s*\}/;
const hasBug = bugPattern.test(engineCode);

console.log('Bug present (pre-setting hanzoDefeatedRef to true from story flags):', hasBug);

// Check GameScreen pre-intro hiding
const screenCode = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');
const hidePattern = /if\s*\(enemy\.type === 'hanzo' && !bossIntroTriggered && storyLocation === 'chinoike-jigoku'\)\s*return null;/;
const hasHideBug = hidePattern.test(screenCode);

console.log('Hide bug present (hiding Hanzo completely when !bossIntroTriggered):', hasHideBug);
