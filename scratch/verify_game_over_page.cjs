const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING GAME OVER PAGE REDESIGN ===\n');

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}`);
    allPassed = false;
  }
}

// 1. Asset check
const gifPath = path.join(__dirname, '../public/assets/gameover/game_over.gif');
assert('game_over.gif exists in public/assets/gameover/', fs.existsSync(gifPath));
assert('game_over.gif is non-empty', fs.existsSync(gifPath) && fs.statSync(gifPath).size > 1000);

// 2. GameOverPage content check
const pageContent = fs.readFileSync(path.join(__dirname, '../src/pages/GameOverPage.tsx'), 'utf8');

assert('GameOverPage references /assets/gameover/game_over.gif', pageContent.includes('/assets/gameover/game_over.gif'));
assert('AtmosphericBackground removed from GameOverPage', !pageContent.includes('AtmosphericBackground'));
assert('Score removed from GameOverPage', !pageContent.includes('SCORE') && !pageContent.includes('score'));
assert('Coins removed from GameOverPage', !pageContent.includes('COINS') && !pageContent.includes('coins'));
assert('Time removed from GameOverPage', !pageContent.includes('TIME') && !pageContent.includes('formatTime'));
assert('Title THE SHADOW preserved', pageContent.includes('THE SHADOW'));
assert('Title FALLS preserved', pageContent.includes('FALLS'));
assert('Curse quote included verbatim', pageContent.includes('You have to get up; the curse is still going on.'));
assert('TRY AGAIN button present', pageContent.includes('TRY AGAIN'));
assert('TITLE MENU button present', pageContent.includes('TITLE MENU'));

console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
process.exit(allPassed ? 0 : 1);
