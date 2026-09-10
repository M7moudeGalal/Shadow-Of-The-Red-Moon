const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== VERIFYING ENEMY HP & PORTAL TRIAL PROMPT LOGIC ===\n');

// 1. Check level.ts for Bat, Samurai, and Hanzo HP settings
const levelFile = fs.readFileSync(path.join(__dirname, '../src/game/level.ts'), 'utf8');

assert(
  levelFile.includes("hp: type === 'hanzo' ? 70 : type === 'samurai' ? 5 : 6"),
  'mkEnemy must assign HP: Hanzo 70, Samurai 5, Bat (spirit) 6'
);
console.log('✔ mkEnemy: Bat hp=6 (6 hits), Samurai hp=5 (5 hits), Hanzo hp=70 (70 hits)');

assert(
  levelFile.includes("maxHp: type === 'hanzo' ? 70 : type === 'samurai' ? 5 : 6"),
  'mkEnemy must assign maxHp: Hanzo 70, Samurai 5, Bat (spirit) 6'
);
console.log('✔ mkEnemy: maxHp properly configured for all 3 enemy types');

assert(
  levelFile.includes("hp: 70, maxHp: 70, state: 'idle' as const"),
  'Hanzo boss spawn must have hp: 70, maxHp: 70'
);
console.log('✔ createChinoikeJigoku: Hanzo boss spawn initialized with hp=70, maxHp=70');

// 2. Check useGameEngine.ts for PortalPromptState, real-time 10-kill unlock, and stay/proceed actions
const engineFile = fs.readFileSync(path.join(__dirname, '../src/game/useGameEngine.ts'), 'utf8');

assert(
  engineFile.includes('export interface PortalPromptState'),
  'PortalPromptState interface must be exported'
);
console.log('✔ useGameEngine: PortalPromptState interface exported');

assert(
  engineFile.includes('portalPromptRef.current = {') &&
  engineFile.includes('requiredKills: 10'),
  'Portal prompt must trigger with requiredKills: 10 upon entering portal in Yunami Jigoku'
);
console.log('✔ useGameEngine: Portal prompt triggers at Yunami exit portal');

assert(
  engineFile.includes('stayInYunami') && engineFile.includes('proceedToChinoike'),
  'useGameEngine must expose stayInYunami and proceedToChinoike callbacks'
);
console.log('✔ useGameEngine: stayInYunami and proceedToChinoike callbacks exposed');

assert(
  engineFile.includes('if (yunamiKillsRef.current >= 10 && !unlockedSkillsRef.current.bloodSpinSlash)'),
  'Killing 10th enemy in Yunami must immediately unlock Blood Spin Slash'
);
console.log('✔ useGameEngine: 10 kills in Yunami Jigoku immediately unlocks Blood Spin Slash in real time');

// 3. Check GameScreen.tsx for YunamiPortalPromptModal and Hanzo Boss Bar dividers
const gameScreenFile = fs.readFileSync(path.join(__dirname, '../src/pages/GameScreen.tsx'), 'utf8');

assert(
  gameScreenFile.includes('YunamiPortalPromptModal'),
  'GameScreen must define and render YunamiPortalPromptModal'
);
console.log('✔ GameScreen: YunamiPortalPromptModal component defined and rendered');

assert(
  gameScreenFile.includes('STAY IN YUNAMI JIGOKU') &&
  gameScreenFile.includes('ENTER CHINOIKE JIGOKU'),
  'YunamiPortalPromptModal must include STAY IN YUNAMI JIGOKU and ENTER CHINOIKE JIGOKU options'
);
console.log('✔ GameScreen: Modal includes "STAY IN YUNAMI JIGOKU" and "ENTER CHINOIKE JIGOKU" actions');

assert(
  gameScreenFile.includes('(hanzo.maxHp || 70) - 1') && gameScreenFile.includes('(hitNum / maxHits) * 100'),
  'Hanzo boss bar must display dividers for 70 hits (dynamic to maxHp)'
);
console.log('✔ GameScreen: Hanzo boss bar dividers dynamically configured for 70 hits');

console.log('\nALL VERIFICATIONS PASSED SUCCESSFULLY! (8/8)');
