const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING HANZO INTRO & TELEPORT AUDIO CONFIGURATION ===\n');

// 1. Check audio assets in public/audio
const publicAudioDir = path.join(__dirname, '../public/audio');
assert(fs.existsSync(path.join(publicAudioDir, 'Japanese_Intro_mp3.mp3')), 'Japanese_Intro_mp3.mp3 must exist in public/audio');
assert(fs.existsSync(path.join(publicAudioDir, 'japanese_intro.mp3')), 'japanese_intro.mp3 must exist in public/audio');
assert(fs.existsSync(path.join(publicAudioDir, 'teleport Hanzo.mp3')), 'teleport Hanzo.mp3 must exist in public/audio');
assert(fs.existsSync(path.join(publicAudioDir, 'teleport_hanzo.mp3')), 'teleport_hanzo.mp3 must exist in public/audio');
console.log('✔ Audio assets present in public/audio: Japanese_Intro_mp3.mp3 and teleport Hanzo.mp3');

// 2. Check soundEffects.ts
const soundEffectsSrc = fs.readFileSync(path.join(__dirname, '../src/game/soundEffects.ts'), 'utf8');
assert(soundEffectsSrc.includes('/audio/Japanese_Intro_mp3.mp3'), 'soundEffects.ts must reference Japanese_Intro_mp3.mp3');
assert(soundEffectsSrc.includes('teleport_hanzo.mp3') || soundEffectsSrc.includes('teleport Hanzo.mp3'), 'soundEffects.ts must reference teleport_hanzo.mp3');
assert(soundEffectsSrc.includes('playHanzoTeleport'), 'soundEffects must expose playHanzoTeleport');
assert(soundEffectsSrc.includes('playHanzoIntro'), 'soundEffects must expose playHanzoIntro');
assert(soundEffectsSrc.includes('stopHanzoIntro'), 'soundEffects must expose stopHanzoIntro');
console.log('✔ soundEffects.ts: Japanese Intro and Hanzo Teleport audio wired to sound system');

// 3. Check useGameEngine.ts
const engineSrc = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');
assert(engineSrc.includes('soundEffects.playHanzoIntro()'), 'useGameEngine must trigger playHanzoIntro on boss intro');
assert(engineSrc.includes('soundEffects.stopHanzoIntro()'), 'useGameEngine must stop Hanzo intro when battle begins or is skipped');
assert(engineSrc.includes('soundEffects.playHanzoTeleport()'), 'useGameEngine must trigger playHanzoTeleport on teleport actions');
assert(engineSrc.includes('bossIntroTimerRef.current = 280'), 'useGameEngine must use 280 frames (~4.66s) for the Japanese intro track duration');
console.log('✔ useGameEngine.ts: Boss intro, skip, and teleport combat events trigger the new audio');

// 4. Check GameScreen.tsx BossIntroBanner
const gameScreenSrc = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');
assert(gameScreenSrc.includes('const maxTimer = 280;'), 'BossIntroBanner must sync fade-in/fade-out timing with maxTimer 280');
console.log('✔ GameScreen.tsx: BossIntroBanner title card synchronized with 280-frame intro duration');

console.log('\nALL HANZO AUDIO CHECKS PASSED PERFECTLY! (4/4)');
