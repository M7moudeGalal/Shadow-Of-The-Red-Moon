const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING TITLE MENU & FIRE BLAZE EXCLUSIVITY ===\n');

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`[PASS] ${desc}`);
  } else {
    console.error(`[FAIL] ${desc}`);
    allPassed = false;
  }
}

// 1. Check assets
assert('title_menu.gif exists in public/assets/title/', fs.existsSync(path.join(__dirname, '../public/assets/title/title_menu.gif')));
assert('fire_blaze.mp3 exists in public/audio/', fs.existsSync(path.join(__dirname, '../public/audio/fire_blaze.mp3')));
assert('shuriken_01.png exists in public/assets/effects/shuriken/', fs.existsSync(path.join(__dirname, '../public/assets/effects/shuriken/shuriken_01.png')));

// 2. Check HomePage.tsx
const homeCode = fs.readFileSync(path.join(__dirname, '../src/pages/HomePage.tsx'), 'utf8');

// (1) Mastaba, Ninja & old AtmosphericBackground removed
assert('AtmosphericBackground removed from HomePage', !homeCode.includes('AtmosphericBackground'));
assert('MasterNinjaIllustration removed from HomePage', !homeCode.includes('MasterNinjaIllustration'));
assert('Mastaba platform removed from HomePage', !homeCode.includes('Mastaba'));

// (2) GIF background included
assert('GIF background image included in HomePage', homeCode.includes('/assets/title/title_menu.gif'));

// (3) Shadow of the Red Moon title kept
assert('SHADOW OF THE RED MOON title preserved', homeCode.includes('SHADOW') && homeCode.includes('OF THE RED MOON') && homeCode.includes('影の赤月'));

// (4) Fire Blaze SFX exclusively handled via soundEffects on Title Menu
const titleMusicCode = fs.readFileSync(path.join(__dirname, '../src/game/titleMusic.ts'), 'utf8');
assert('titleMusic.ts loads oldest soundtrack', titleMusicCode.includes('/audio/title_menu_track.mp3'));
assert('titleMusic.ts does NOT play fire_blaze (fire blaze is decoupled from general titleMusic)', !titleMusicCode.includes('fire_blaze.mp3'));

const sfxCode = fs.readFileSync(path.join(__dirname, '../src/game/soundEffects.ts'), 'utf8');
assert('soundEffects.ts manages /audio/fire_blaze.mp3', sfxCode.includes('/audio/fire_blaze.mp3'));
assert('soundEffects.ts exports playTitleFireBlaze', sfxCode.includes('playTitleFireBlaze'));
assert('soundEffects.ts exports stopTitleFireBlaze', sfxCode.includes('stopTitleFireBlaze'));

// Check HomePage calls play and stop
assert('HomePage starts playTitleFireBlaze on mount', homeCode.includes('soundEffects.playTitleFireBlaze'));
assert('HomePage stops stopTitleFireBlaze on unmount', homeCode.includes('soundEffects.stopTitleFireBlaze'));
assert('HomePage stops stopTitleFireBlaze when START GAME clicked', homeCode.includes('action: () => {\n        soundEffects.playMenuSelect();\n        soundEffects.stopTitleFireBlaze();'));

// Check GameScreen and useGameEngine stop fire blaze
const gameScreenCode = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');
assert('GameScreen.tsx stops fire blaze on mount/unmount', gameScreenCode.includes('soundEffects.stopTitleFireBlaze()'));

const engineCode = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
assert('useGameEngine.ts stops fire blaze during level initialization', engineCode.includes('soundEffects.stopTitleFireBlaze()'));

// (5) Shuriken between menuItems
assert('Shuriken divider rendered between menu items', homeCode.includes('/assets/effects/shuriken/shuriken_01.png') && homeCode.includes('idx > 0'));

console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL TESTS PASSED (100%)' : 'SOME TESTS FAILED'}`);
process.exit(allPassed ? 0 : 1);
