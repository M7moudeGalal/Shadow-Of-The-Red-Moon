import fs from 'fs';
import path from 'path';

const ROOT = 'c:/Games/project';

function assert(condition, message) {
  if (!condition) {
    console.error('FAIL:', message);
    process.exit(1);
  }
  console.log('PASS:', message);
}

console.log('=== Checking Cross Attack Asset Files ===');

const bodyFrames = [
  'cross_attack_1.png',
  'cross_attack_2.png',
  'cross_attack_3.png',
  'cross_attack_4.png',
  'cross_attack_5.png',
  'cross_attack_6.png',
  'cross_attack_7.png',
  'cross_attack_9.png',
  'cross_attack_10.png',
  'cross_attack_11.png',
  'cross_attack_12.png',
  'cross_attack_13.png',
  'cross_attack_14.png',
  'cross_attack_16.png',
];

const effectFrames = Array.from({ length: 16 }, (_, i) => `cross_effect_${i + 1}.png`);

const baseDir = path.join(ROOT, 'public/assets/sprites/player/cross-attack');
assert(fs.existsSync(baseDir), 'Cross attack asset directory exists');

for (const f of bodyFrames) {
  const p = path.join(baseDir, f);
  assert(fs.existsSync(p) && fs.statSync(p).size > 0, `Body frame exists and non-empty: ${f}`);
}

for (const f of effectFrames) {
  const p = path.join(baseDir, f);
  assert(fs.existsSync(p) && fs.statSync(p).size > 0, `Effect frame exists and non-empty: ${f}`);
}

console.log('=== Checking Component & Engine Integrations ===');

const typesContent = fs.readFileSync(path.join(ROOT, 'src/game/types.ts'), 'utf8');
assert(typesContent.includes("'cross_attacking'"), "AnimState includes 'cross_attacking'");
assert(typesContent.includes('isCrossAttacking?: boolean'), 'PlayerState includes isCrossAttacking');
assert(typesContent.includes('crossAttackTimer?: number'), 'PlayerState includes crossAttackTimer');
assert(typesContent.includes('crossAttackEffectFrame?: number'), 'PlayerState includes crossAttackEffectFrame');

const ninjaContent = fs.readFileSync(path.join(ROOT, 'src/components/NinjaCharacter.tsx'), 'utf8');
assert(ninjaContent.includes('CROSS_ATTACK_BODY_FRAMES'), 'NinjaCharacter exports CROSS_ATTACK_BODY_FRAMES');
assert(ninjaContent.includes('CROSS_EFFECT_FRAMES'), 'NinjaCharacter exports CROSS_EFFECT_FRAMES');
assert(ninjaContent.includes('Separate Independent Transparent Cross Attack Slash Effect Layer'), 'NinjaCharacter renders independent slash effect layer');
assert(ninjaContent.includes("isCrossAttack = anim === 'cross_attacking'"), 'NinjaCharacter activates cross attack mode');

const engineContent = fs.readFileSync(path.join(ROOT, 'src/game/useGameEngine.ts'), 'utf8');
assert(engineContent.includes('CROSS_ATTACK_DURATION = 28'), 'CROSS_ATTACK_DURATION is defined');
assert(engineContent.includes('crossHit1Ref'), 'crossHit1Ref is declared');
assert(engineContent.includes('crossHit2Ref'), 'crossHit2Ref is declared');
assert(engineContent.includes("k === 'shift' || code === 'ShiftLeft' || code === 'ShiftRight' || k === 'k' || code === 'KeyK'"), 'Shift and K dash input handling present');
assert(engineContent.includes("k === 'c' || code === 'KeyC'"), 'C Cross Attack input handling present');
assert(engineContent.includes('checkCrossAttackHit(strike1Box, 1)'), 'Strike 1 Hitbox checked');
assert(engineContent.includes('checkCrossAttackHit(strike2Box, 2)'), 'Strike 2 Hitbox checked');
assert(engineContent.includes("p.anim = 'cross_attacking'"), "Anim state set to 'cross_attacking'");
assert(engineContent.includes('normalAttackComboCountRef'), 'Normal attack combo chaining tracked');

const gameScreenContent = fs.readFileSync(path.join(ROOT, 'src/pages/GameScreen.tsx'), 'utf8');
assert(gameScreenContent.includes('isCrossAttacking={player.isCrossAttacking}'), 'GameScreen forwards isCrossAttacking');
assert(gameScreenContent.includes('crossAttackTimer={player.crossAttackTimer}'), 'GameScreen forwards crossAttackTimer');
assert(gameScreenContent.includes('crossAttackFrame={player.crossAttackFrame}'), 'GameScreen forwards crossAttackFrame');
assert(gameScreenContent.includes('crossAttackEffectFrame={player.crossAttackEffectFrame}'), 'GameScreen forwards crossAttackEffectFrame');

const howToPlayContent = fs.readFileSync(path.join(ROOT, 'src/pages/HowToPlayPage.tsx'), 'utf8');
assert(howToPlayContent.includes('Cross Attack (十文字斬り)'), 'HowToPlayPage lists Cross Attack');
assert(howToPlayContent.includes("primaryKey: 'SHIFT'"), 'HowToPlayPage sets Dash to SHIFT');

console.log('=== All Cross Attack System verification checks passed successfully! ===');
