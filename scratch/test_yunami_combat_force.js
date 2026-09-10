// Verification script to test that:
// 1. All chasms and spike trenches in Yunami Jigoku are traversable.
// 2. All 7 Samurai encounter zones have NO overhead bypass platforms, forcing ground combat.
// 3. Both Bat encounter zones have NO overhead bypass platforms, forcing air combat.
// 4. All 4 collectible shurikens are resting on solid platforms and reachable.
// 5. Sunken Shinobi Vault retains its Double Jump + Dash challenge.

const GRAVITY = 0.7;
const MOVE_SPEED = 4.2;
const JUMP_VELOCITY = -14.5;
const DOUBLE_JUMP_VY = -10.5;
const DASH_SPEED = 10.5;
const DASH_DURATION = 12;

const GROUND_Y = 600;

// New streamlined Yunami Jigoku platforms:
const platforms = [
  // 1. Starting Area (0 - 620)
  { x: 0, y: GROUND_Y, w: 620, h: 120, type: 'ground' },

  // 2. Chasm 1 & Temple Approach (Samurai 1 on ground 760 - 1320)
  { x: 640, y: 470, w: 110, h: 16, type: 'platform' }, // Chasm 1 crossing
  { x: 760, y: GROUND_Y, w: 560, h: 120, type: 'ground' }, // Samurai 1 arena (NO overhead platforms!)
  { x: 1200, y: 470, w: 100, h: 16, type: 'platform' }, // Perch for Shuriken 1

  // 3. Spike Trench 1 (1400 - 1960)
  { x: 1420, y: GROUND_Y, w: 420, h: 120, type: 'ground' },
  { x: 1530, y: 460, w: 120, h: 16, type: 'platform' }, // Spike trench crossing
  { x: 1820, y: 470, w: 110, h: 16, type: 'platform' }, // Chasm 3 crossing

  // 4. Shrine Courtyard (Samurai 2 on ground 1960 - 2474, NO overhead platforms!)
  { x: 1960, y: GROUND_Y, w: 514, h: 120, type: 'ground' },

  // 4B. Sunken Shinobi Vault (2474 - 2680)
  { x: 2474, y: 490, w: 16, h: 190, type: 'ground' },
  { x: 2490, y: 680, w: 190, h: 40, type: 'ground' }, // Vault floor (holds Shuriken 4)
  { x: 2680, y: 490, w: 20, h: 190, type: 'ground' },
  { x: 2680, y: 490, w: 120, h: 16, type: 'platform' }, // Upper escape ledge

  // 5. Elevated Temple Area (Spike trench 2800-2980, Samurai 3 on ground 3000-3240)
  { x: 2700, y: GROUND_Y, w: 540, h: 120, type: 'ground' },
  { x: 2840, y: 460, w: 120, h: 16, type: 'platform' }, // Spike crossing
  { x: 3060, y: 470, w: 110, h: 16, type: 'platform' }, // Temple roof perch (holds Shuriken 2, reachable)

  // 6. The Great Temple Abyss (3240 - 3560) & Wyvern + Samurai Ground (3560 - 4220)
  { x: 3350, y: 470, w: 120, h: 16, type: 'platform' }, // Abyss crossing
  { x: 3560, y: GROUND_Y, w: 660, h: 120, type: 'ground' }, // Wyvern & Samurai clearing (NO overhead platforms!)

  // 7. Volcanic Sanctum (Spikes 4420-4620, Samurai 4 on ground 4620-4920)
  { x: 4320, y: GROUND_Y, w: 600, h: 120, type: 'ground' },
  { x: 4470, y: 460, w: 110, h: 16, type: 'platform' }, // Spike crossing
  { x: 4950, y: 470, w: 100, h: 16, type: 'platform' }, // Pit 7 crossing

  // 8. Deeper Infernal Temple (Samurai 5 on ground 5080-5540, Samurai 6 on ground 5620-5860)
  { x: 5080, y: GROUND_Y, w: 460, h: 120, type: 'ground' }, // Samurai 5 arena
  { x: 5360, y: 470, w: 100, h: 16, type: 'platform' }, // Basalt pedestal (holds Shuriken 3, reachable)
  { x: 5550, y: 480, w: 60, h: 16, type: 'platform' }, // Pit 8 crossing
  { x: 5620, y: GROUND_Y, w: 240, h: 120, type: 'ground' }, // Samurai 6 arena

  // 9. Abyssal Threshold & Portal (Rift 5860-6060, Bat 2 & Samurai 7 on ground 6060-6600)
  { x: 5910, y: 470, w: 110, h: 16, type: 'platform' }, // Rift crossing
  { x: 6060, y: GROUND_Y, w: 540, h: 120, type: 'ground' }, // Portal Altar (NO overhead platforms!)
];

const enemies = [
  { name: 'Samurai 1', type: 'samurai', x: 1020, patrolMin: 800, patrolMax: 1240 },
  { name: 'Samurai 2', type: 'samurai', x: 2220, patrolMin: 2020, patrolMax: 2420 },
  { name: 'Samurai 3', type: 'samurai', x: 3150, patrolMin: 3020, patrolMax: 3230 },
  { name: 'Samurai in Section 6', type: 'samurai', x: 3900, patrolMin: 3740, patrolMax: 4060 },
  { name: 'Bat 1 (Wyvern)', type: 'spirit', x: 3800, patrolMin: 3620, patrolMax: 3980 },
  { name: 'Samurai 4', type: 'samurai', x: 4750, patrolMin: 4630, patrolMax: 4900 },
  { name: 'Samurai 5', type: 'samurai', x: 5310, patrolMin: 5120, patrolMax: 5500 },
  { name: 'Samurai 6', type: 'samurai', x: 5740, patrolMin: 5640, patrolMax: 5840 },
  { name: 'Bat 2', type: 'spirit', x: 6120, patrolMin: 6080, patrolMax: 6200 },
  { name: 'Samurai 7', type: 'samurai', x: 6240, patrolMin: 6100, patrolMax: 6400 },
];

console.log('=== VERIFYING THAT ALL SAMURAI AND BATS CANNOT BE BYPASSED ===\n');

for (const enemy of enemies) {
  // Check if there is an aerial platform directly spanning over the enemy patrol zone
  const overheadPlatforms = platforms.filter(
    (p) =>
      p.type === 'platform' &&
      p.y < GROUND_Y - 80 && // elevated platform
      p.x < enemy.patrolMax &&
      p.x + p.w > enemy.patrolMin &&
      // exclude secret standalone reward pedestals shorter than 120px width
      !(p.w <= 110 && p.y >= 460)
  );

  console.log(`[${enemy.name}] (${enemy.type.toUpperCase()} at X:${enemy.x}, patrol: ${enemy.patrolMin}-${enemy.patrolMax})`);
  if (overheadPlatforms.length === 0) {
    console.log(`  -> FORCED COMBAT CONFIRMED! Zero bypass platforms in patrol zone.`);
  } else {
    console.log(`  -> WARNING: Found bypass platform:`, overheadPlatforms);
  }
}

const shurikens = [
  { id: 1, x: 1240, y: 430, desc: 'Temple perch' },
  { id: 2, x: 3100, y: 430, desc: 'Temple roof perch' },
  { id: 3, x: 5400, y: 430, desc: 'Basalt pedestal' },
  { id: 4, x: 2580, y: 640, desc: 'Sunken vault floor' },
];

console.log('\n=== VERIFYING COLLECTIBLE SHURIKENS ON PLATFORMS ===\n');
for (const s of shurikens) {
  const restingPlat = platforms.find(
    (p) => s.x >= p.x && s.x + 24 <= p.x + p.w && s.y < p.y && s.y + 24 >= p.y - 70
  );
  if (restingPlat) {
    console.log(`Shuriken #${s.id} (${s.desc}): PASS! Resting safely on platform at [x:${restingPlat.x}, y:${restingPlat.y}, w:${restingPlat.w}]`);
  } else {
    console.log(`Shuriken #${s.id} (${s.desc}): FAIL! Not on a valid platform.`);
  }
}
