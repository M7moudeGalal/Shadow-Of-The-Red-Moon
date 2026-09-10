const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING BLOOD RAIN & SHURIKEN THROW AUDIO CONFIGURATION ===\n');

// 1. Asset check in public/audio
const publicAudioDir = path.join(__dirname, '../public/audio');
assert(
  fs.existsSync(path.join(publicAudioDir, 'Water_Drops_In_Tunnel_mp3_1702362428.mp3')),
  'Water_Drops_In_Tunnel_mp3_1702362428.mp3 must exist in public/audio'
);
assert(
  fs.existsSync(path.join(publicAudioDir, 'Whip_SFX_Pack_mp3_1710999340.mp3')),
  'Whip_SFX_Pack_mp3_1710999340.mp3 must exist in public/audio'
);
console.log('✔ Audio files present in public/audio: Water_Drops_In_Tunnel and Whip_SFX_Pack');

// 2. soundEffects.ts check
const sfxFile = fs.readFileSync(path.join(__dirname, '../src/game/soundEffects.ts'), 'utf8');
assert(
  sfxFile.includes('/audio/Water_Drops_In_Tunnel_mp3_1702362428.mp3'),
  'soundEffects.ts must load Water_Drops_In_Tunnel_mp3_1702362428.mp3 for blood rain'
);
assert(
  sfxFile.includes('/audio/Whip_SFX_Pack_mp3_1710999340.mp3'),
  'soundEffects.ts must load Whip_SFX_Pack_mp3_1710999340.mp3 for shuriken throw'
);
assert(
  sfxFile.includes('playBloodRain(') && sfxFile.includes('stopBloodRain()'),
  'soundEffects.ts must export playBloodRain and stopBloodRain methods'
);
assert(
  sfxFile.includes("playSfx('shurikenThrow', volume)"),
  'playShurikenThrow must trigger playSfx with shurikenThrow key'
);
console.log('✔ soundEffects.ts: Blood Rain loop and Shuriken Whip SFX registered and configured');

// 3. useGameEngine.ts check
const engineFile = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
assert(
  engineFile.includes('soundEffects.playShurikenThrow()'),
  'useGameEngine must trigger playShurikenThrow upon throwing shuriken'
);
assert(
  engineFile.includes('soundEffects.stopBloodRain()'),
  'useGameEngine must stop blood rain on reset and scene change'
);
console.log('✔ useGameEngine.ts: Shuriken throw triggers audio and blood rain is managed across states');

// 4. GameScreen.tsx check
const gameScreenFile = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');
assert(
  gameScreenFile.includes("render.storyLocation === 'chinoike-jigoku'") &&
  gameScreenFile.includes('soundEffects.playBloodRain('),
  'GameScreen.tsx must activate playBloodRain when in Chinoike Jigoku'
);
assert(
  gameScreenFile.includes('soundEffects.stopBloodRain()'),
  'GameScreen.tsx must stop blood rain on cleanup'
);
console.log('✔ GameScreen.tsx: Atmospheric blood rain audio plays in Chinoike Jigoku');

console.log('\nALL BLOOD RAIN & SHURIKEN AUDIO VERIFICATIONS PASSED! (4/4)');
