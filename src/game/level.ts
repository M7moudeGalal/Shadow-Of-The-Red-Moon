import type { LevelData, Enemy, StoryLocation } from './types';

let enemyIdCounter = 0;
const mkEnemy = (
  type: 'samurai' | 'spirit' | 'hanzo',
  x: number,
  y: number,
  patrolRange: number
): Enemy => ({
  id: ++enemyIdCounter,
  type,
  x,
  y,
  w: type === 'hanzo' ? 36 : type === 'samurai' ? 34 : 32,
  h: type === 'hanzo' ? 58 : type === 'samurai' ? 48 : 34,
  vx: type === 'hanzo' ? 0 : type === 'samurai' ? 0.6 : 0.4,
  vy: 0,
  onGround: true,
  hp: type === 'hanzo' ? 70 : type === 'samurai' ? 5 : 6,
  maxHp: type === 'hanzo' ? 70 : type === 'samurai' ? 5 : 6,
  patrolMin: x - patrolRange / 2,
  patrolMax: x + patrolRange / 2,
  facing: -1,
  state: type === 'hanzo' ? 'idle' : 'patrol',
  attackCooldown: 0,
  attackTimer: 0,
  jumpCooldown: 0,
  hurtCooldown: 0,
  deadTimer: 0,
  spawnTimer: 0,
  respawnTimer: 0,
  spawnX: x,
  spawnY: y,
  alive: true,
  dashCooldown: 0,
  spinCooldown: 0,
  risingCooldown: 0,
  teleportCooldown: 120, // 2s initial grace before signature teleport opportunity
  teleportTimer: 0,
  hitConnected: false,
  telegraph: 'none',
  telegraphTimer: 0,
  telegraphMaxTimer: 0,
  turnCooldown: 0,
  guardCooldown: 0,
  guardTimer: 0,
  lungeCooldown: 0,
  divePhase: 'hover',
  diveTimer: 0,
});

export const LEVEL_WIDTH = 6600;
export const LEVEL_HEIGHT = 720;
export const GROUND_Y = 600;

export function createYunamiJigoku(): LevelData {
  enemyIdCounter = 0;
  return {
    name: 'YUNAMI JIGOKU',
    jpName: '湯波地獄',
    storyLocation: 'yunami-jigoku',
    width: LEVEL_WIDTH,
    height: LEVEL_HEIGHT,
    groundY: GROUND_Y,
    spawn: { x: 80, y: GROUND_Y - 48 }, // Preserved original starting spawn
    platforms: [
      // ========================================================
      // 1. STARTING AREA (0 - 620)
      // ========================================================
      { x: 0, y: GROUND_Y, w: 620, h: 120, type: 'ground' },

      // ========================================================
      // 2. TEMPLE APPROACH & SAMURAI 1 COMBAT ARENA (620 - 1400)
      // Chasm crossing mastaba leading onto ground; ZERO bypass platforms
      // Ninja is strictly FORCED to fight Samurai 1 on the temple grounds!
      // ========================================================
      { x: 640, y: 470, w: 110, h: 16, type: 'platform' }, // Chasm 1 crossing mastaba
      { x: 760, y: GROUND_Y, w: 560, h: 120, type: 'ground' }, // Samurai 1 Battle Ground (760 - 1320)
      { x: 1200, y: 470, w: 100, h: 16, type: 'platform' }, // Secret perch for Shuriken 1 (easily reachable)

      // ========================================================
      // 3. SPIKE TRENCH & CHASM CROSSING (1400 - 1960)
      // Lethal floor spikes (1440 - 1780) necessitate crossing mastaba
      // ========================================================
      { x: 1420, y: GROUND_Y, w: 420, h: 120, type: 'ground' },
      { x: 1530, y: 460, w: 120, h: 16, type: 'platform' }, // Flying Mastaba crossing spike trench
      { x: 1820, y: 470, w: 110, h: 16, type: 'platform' }, // Mastaba crossing Chasm 3

      // ========================================================
      // 4. SHRINE COURTYARD & SAMURAI 2 COMBAT ARENA (1960 - 2474)
      // ZERO overhead platforms! Ninja is FORCED to fight Samurai 2 on the ground!
      // ========================================================
      { x: 1960, y: GROUND_Y, w: 514, h: 120, type: 'ground' }, // Courtyard floor (1960 - 2474)

      // ========================================================
      // 4B. SUNKEN SHINOBI VAULT (2474 - 2680, Y: 680)
      // Precision Challenge: Δy = 190px (NO fire!).
      // Must combine Double Jump + Dash to climb back out!
      // ========================================================
      { x: 2474, y: 490, w: 16, h: 190, type: 'ground' },   // Left sheer basalt wall
      { x: 2490, y: 680, w: 190, h: 40, type: 'ground' },   // Sunken vault floor (peaceful, fire-free)
      { x: 2680, y: 490, w: 20, h: 190, type: 'ground' },   // Right sheer basalt wall
      { x: 2680, y: 490, w: 120, h: 16, type: 'platform' }, // Upper escape ledge

      // ========================================================
      // 5. ELEVATED TEMPLE RUINS & SAMURAI 3 ARENA (2700 - 3240)
      // Spike trench crossing mastaba; ZERO bypass platforms over Samurai 3!
      // ========================================================
      { x: 2700, y: GROUND_Y, w: 540, h: 120, type: 'ground' },
      { x: 2840, y: 460, w: 120, h: 16, type: 'platform' }, // Mastaba crossing spikes (2800 - 2980)
      { x: 3060, y: 470, w: 110, h: 16, type: 'platform' }, // Ruined temple roof perch (holds Shuriken 2, reachable)

      // ========================================================
      // 6. THE GREAT TEMPLE ABYSS & WYVERN / SAMURAI BATTLE (3240 - 4300)
      // Single abyss mastaba into open-air battle ground (3560 - 4220)
      // ZERO overhead platforms! Ninja fights both Wyvern and Samurai!
      // ========================================================
      { x: 3350, y: 470, w: 120, h: 16, type: 'platform' }, // Mastaba crossing Great Temple Abyss
      { x: 3560, y: GROUND_Y, w: 660, h: 120, type: 'ground' }, // Open-air clearing where Wyvern & Samurai attack

      // ========================================================
      // 7. VOLCANIC SANCTUM & SAMURAI 4 ARENA (4300 - 5100)
      // Mastaba crossing spikes; ZERO overhead platforms over Samurai 4!
      // ========================================================
      { x: 4320, y: GROUND_Y, w: 600, h: 120, type: 'ground' },
      { x: 4470, y: 460, w: 110, h: 16, type: 'platform' }, // Mastaba crossing volcanic spikes
      { x: 4950, y: 470, w: 100, h: 16, type: 'platform' }, // Mastaba crossing Volcanic Hell Pit

      // ========================================================
      // 8. DEEPER INFERNAL TEMPLE & SAMURAI 5 & 6 ARENAS (5100 - 5860)
      // Ground combat forced for both Samurai 5 and Samurai 6!
      // ========================================================
      { x: 5080, y: GROUND_Y, w: 460, h: 120, type: 'ground' }, // Samurai 5 Arena (5080 - 5540)
      { x: 5360, y: 470, w: 100, h: 16, type: 'platform' }, // Basalt pedestal (holds Shuriken 3, reachable)
      { x: 5550, y: 480, w: 60, h: 16, type: 'platform' }, // Stepping stone crossing Pit 8
      { x: 5620, y: GROUND_Y, w: 240, h: 120, type: 'ground' }, // Samurai 6 Arena (5620 - 5860)

      // ========================================================
      // 9. ABYSSAL THRESHOLD & PORTAL GUARDIANS (5860 - 6600)
      // Mastaba crossing Abyssal Rift into Sacred Portal Altar
      // ZERO overhead platforms! Ninja is FORCED to fight Bat 2 and Samurai 7!
      // ========================================================
      { x: 5910, y: 470, w: 110, h: 16, type: 'platform' }, // Mastaba crossing Abyssal Rift
      { x: 6060, y: GROUND_Y, w: 540, h: 120, type: 'ground' }, // Sacred Portal Altar (holds Portal & Guardians)

      // Boundary Walls
      { x: -20, y: 0, w: 20, h: LEVEL_HEIGHT, type: 'wall' },
      { x: LEVEL_WIDTH, y: 0, w: 20, h: LEVEL_HEIGHT, type: 'wall' },
    ],
    coins: [],
    collectibleShurikens: [
      // Shuriken 1: Perch in Section 2 (earned after defeating Samurai 1)
      { id: 1, x: 1240, y: 430, w: 24, h: 24, collected: false },
      // Shuriken 2: Rooftop of the grand temple in Section 5 (reachable by jump/landing)
      { id: 2, x: 3100, y: 430, w: 24, h: 24, collected: false },
      // Shuriken 3: Basalt pedestal in Section 8 (reachable by jump/landing)
      { id: 3, x: 5400, y: 430, w: 24, h: 24, collected: false },
      // Shuriken 4: Sunken Shinobi Vault bonus (requires Double Jump + Dash to escape!)
      { id: 4, x: 2580, y: 640, w: 24, h: 24, collected: false },
    ],
    spikes: [
      // Spike trench 1 in Platform Section (1440 - 1780 continuous)
      { x: 1440, y: GROUND_Y - 18, w: 340, h: 18 },
      // Spike trench 2 in Elevated Temple Area
      { x: 2800, y: GROUND_Y - 18, w: 180, h: 18 },
      // Spike trench 3 in Volcanic Sanctum
      { x: 4420, y: GROUND_Y - 18, w: 200, h: 18 },
      // Spike trench 4 in Deeper Infernal Temple Chasm
      { x: 5540, y: GROUND_Y - 18, w: 80, h: 18 },
      // Spike trench 5 in Abyssal Rift
      { x: 5860, y: GROUND_Y - 18, w: 200, h: 18 },
    ],
    enemies: [
      // 8 Corrupted Samurai Encounters (Forced Melee Combat on Ground Clearings)
      // Samurai 1: Heavy guard on Temple Approach (ground: 760 to 1320)
      mkEnemy('samurai', 1020, GROUND_Y - 48, 440),
      // Samurai 2: Guarding Shrine Courtyard (ground: 1960 to 2474)
      mkEnemy('samurai', 2220, GROUND_Y - 48, 400),
      // Samurai 3: Elevated Temple Ruins patrol (clearing: 2980 to 3240)
      mkEnemy('samurai', 3100, GROUND_Y - 48, 160),
      // Samurai in Section 6: Open-Air Great Temple clearing beneath Wyvern (ground: 3560 to 4220)
      mkEnemy('samurai', 3900, GROUND_Y - 48, 320),
      // Samurai 4: Volcanic Sanctum clearing (clearing: 4620 to 4920)
      mkEnemy('samurai', 4760, GROUND_Y - 48, 200),
      // Samurai 5: Deeper Infernal Temple clearing (ground: 5080 to 5540)
      mkEnemy('samurai', 5310, GROUND_Y - 48, 360),
      // Samurai 6: Upper Basalt Overhang patrol (clearing: 5620 to 5860)
      mkEnemy('samurai', 5730, GROUND_Y - 48, 160),
      // Samurai 7: Final Sacred Portal Guardian (ground: 6060 to 6600)
      mkEnemy('samurai', 6240, GROUND_Y - 48, 300),

      // Corrupted Bat Aerial Encounters (Exploration and Air Combat)
      // Bat 1: Sky above Ancient Torii Archway (ground: 1200 - 1650)
      mkEnemy('spirit', 1450, 260, 360),
      // Bat 2: Sky above Shrine Courtyard (ground: 2400 - 2850)
      mkEnemy('spirit', 2650, 280, 360),
      // Bat 3: Mid-level Open-Air Chasm (swooping patrol across ground 3560 - 4220)
      mkEnemy('spirit', 3800, 300, 380),
      // Bat 4: Volcanic Sanctum sky (ground: 4600 - 5000)
      mkEnemy('spirit', 4850, 260, 340),
      // Bat 5: Infernal Temple spires sky (ground: 5250 - 5650)
      mkEnemy('spirit', 5450, 280, 360),
      // Bat 6: Abyssal Sky Sentinel guarding approach to the Portal (swooping patrol 6060 - 6400)
      mkEnemy('spirit', 6120, 300, 360),
    ],
    checkpoint: { x: 2000, y: GROUND_Y - 70, w: 30, h: 70, activated: false },
    // Portal automatically tied to the end of the story location: LEVEL_WIDTH - 140
    exit: { x: LEVEL_WIDTH - 140, y: GROUND_Y - 110, w: 90, h: 110 },
  };
}

export const CHINOIKE_WIDTH = 7500;
export const CHINOIKE_HEIGHT = 900;
export const CHINOIKE_GROUND_Y = 820;

export function createChinoikeJigoku(hanzoDefeated: boolean = false): LevelData {
  enemyIdCounter = 0;
  return {
    name: 'CHINOIKE JIGOKU',
    jpName: '血の池地獄',
    storyLocation: 'chinoike-jigoku',
    width: CHINOIKE_WIDTH,
    height: CHINOIKE_HEIGHT,
    groundY: CHINOIKE_GROUND_Y,
    spawn: { x: 80, y: 280 - 48 }, // Safe entrance plateau
    platforms: [
      // ========================================================
      // 1. CHINOIKE ENTRANCE (0 - 850, Y: around 280)
      // ========================================================
      // 1. CHINOIKE ENTRANCE (0 - 850, Y: around 280)
      // High blood-soaked entrance plaza arriving from Yunami Portal
      // ========================================================
      { x: 0, y: 280, w: 480, h: 50, type: 'ground' },
      { x: 560, y: 340, w: 140, h: 20, type: 'platform' }, // Single Entrance Mastaba
      // Dash Separation Gap = 230px to Descending Ruins (requires Dash!)

      // ========================================================
      // 2. DESCENDING RUINS (850 - 1900, Y: 280 -> 580)
      // Streamlined to 2 Grand Terraces with 220px - 230px Dash gaps
      // ========================================================
      { x: 930, y: 410, w: 160, h: 20, type: 'platform' }, // Ruined Eaves Terrace (holds Shuriken 101)
      // Dash Separation Gap = 230px (requires Dash!)
      { x: 1320, y: 490, w: 150, h: 20, type: 'platform' }, // Shattered Bridge Mastaba
      // Dash Separation Gap = 220px (requires Dash!)
      { x: 1690, y: 580, w: 220, h: 24, type: 'ground' }, // Mid-way basalt terrace

      // ========================================================
      // 3. DEEP BLOOD CHASM & LONG DESCENT (1900 - 2900, Y: 580 -> 700)
      // Streamlined to 2 Descent Mastabas with 220px Dash gap
      // ========================================================
      { x: 1940, y: 550, w: 130, h: 20, type: 'platform' }, // Descent Ledge 1
      // Dash Separation Gap = 220px (requires Dash to reach Ledge 2!)
      { x: 2290, y: 620, w: 120, h: 20, type: 'platform' }, // Descent Ledge 2
      // Samurai 1 Arena: Solid, spacious combat ledge
      { x: 2360, y: 660, w: 400, h: 30, type: 'ground' },

      // ========================================================
      // 3B. SUNKEN BLOOD ALTAR ALCOVE (2750 - 2960, Y: 760)
      // Precision Challenge: Δy = 190px over the Blood Sea (NO fire!).
      // Requires Double Jump + Dash to reach the upper escape ledge!
      // ========================================================
      { x: 2750, y: 570, w: 16, h: 190, type: 'ground' },   // Left basalt cavern wall
      { x: 2766, y: 760, w: 180, h: 25, type: 'ground' },   // Safe blood altar floor (safely above Blood Sea)
      { x: 2946, y: 570, w: 20, h: 190, type: 'ground' },   // Right basalt cavern wall
      { x: 2946, y: 570, w: 130, h: 20, type: 'platform' }, // Upper escape platform leading to West Island

      // ========================================================
      // 4-5. THE BLOOD SEA & EXPANDED BOTTOM BATTLE GROUNDS (2880 - 4320, Y: 600 -> 750)
      // Lethal Blood Sea stretches underneath across the abyss floor (Y: 790 - 920)
      // Strategic Battle Islands separated by 194px - 240px Dash gaps over the Blood Sea!
      // ========================================================
      // West Abyssal Combat Island
      { x: 3076, y: 660, w: 200, h: 30, type: 'ground' },
      // Dash Separation Gap = 194px over lethal Blood Sea (requires Double Jump + Dash!)
      // Central Sanctuary Island: wide fortified sanctuary over the boiling blood sea
      { x: 3470, y: 600, w: 370, h: 35, type: 'ground' },
      // Dash Separation Gap = 240px over lethal Blood Sea (requires Dash!)
      // East Blood Falls Combat Terrace
      { x: 4080, y: 680, w: 280, h: 30, type: 'ground' },

      // ========================================================
      // 6. LONG ASCENT (4300 - 5300, Y: 720 -> 350)
      // Streamlined to 3 Grand Climbing Mastabas with 195px Dash gaps
      // ========================================================
      { x: 4420, y: 620, w: 140, h: 20, type: 'platform' }, // Ascent Mastaba 1
      // Dash Separation Gap = 195px (requires Double Jump + Dash!)
      { x: 4755, y: 490, w: 140, h: 20, type: 'platform' }, // Ascent Mastaba 2
      // Dash Separation Gap = 195px (requires Double Jump + Dash!)
      { x: 5090, y: 380, w: 140, h: 22, type: 'platform' }, // Ascent Mastaba 3

      // ========================================================
      // 7. UPPER BLOOD TEMPLE (5300 - 6200, Y: 340 -> 250)
      // Corrupted Japanese temple architecture, roofs, Samurai 5
      // ========================================================
      // Samurai 5 Courtyard Arena
      { x: 5320, y: 340, w: 460, h: 30, type: 'ground' },
      // Grand Temple Rooftop Bridge connecting directly to Boss Arena (no gap to fall through!)
      { x: 5880, y: 280, w: 230, h: 40, type: 'ground' },

      // ========================================================
      // 8. EXIT SANCTUARY & EXPANDED GRAND BOSS ARENA (6100 - 7500, Y: around 280)
      // Sacrificial terrace overlooking abyss, Hanzo arena & Ancient Torii Portal
      // 1400px wide cinematic dueling ground for multi-hit combos!
      // ========================================================
      { x: 6100, y: 280, w: 1400, h: 40, type: 'ground' },

      // World Boundary Walls
      { x: -20, y: 0, w: 20, h: CHINOIKE_HEIGHT, type: 'wall' },
      { x: CHINOIKE_WIDTH, y: 0, w: 20, h: CHINOIKE_HEIGHT, type: 'wall' },
    ],
    // Lethal Blood Sea stretching along the ENTIRE bottom of Chinoike Jigoku (Instant death on contact)
    bloodPonds: [
      { x: 0, y: 790, w: CHINOIKE_WIDTH, h: 130 },
    ],
    coins: [],
    // 3 Optional Collectibles (using existing Shuriken Collectible format)
    collectibleShurikens: [
      // Shuriken 1: Section 2 high ruined eaves
      { id: 101, x: 1000, y: 340, w: 24, h: 24, collected: false },
      // Shuriken 2: Section 4-5 Central Sanctuary Island perch
      { id: 102, x: 3560, y: 530, w: 24, h: 24, collected: false },
      // Shuriken 3: Section 7 Upper Blood Temple rooftop pinnacle
      { id: 103, x: 5960, y: 200, w: 24, h: 24, collected: false },
      // Shuriken 104: Sunken Blood Altar Alcove bonus (requires Double Jump + Dash to escape!)
      { id: 104, x: 2855, y: 720, w: 24, h: 24, collected: false },
    ],
    spikes: [],
    enemies: [
      // Corrupted Samurai Guardians (5 Total):
      // Samurai 1: Mid-descent arena (Section 3: X 2360 - 2780)
      mkEnemy('samurai', 2560, 660 - 48, 280),
      // Samurai 2: West Abyssal Combat Island (Section 4: X 3076 - 3276, 200px platform)
      mkEnemy('samurai', 3160, 660 - 48, 130),
      // Samurai 3: Central Sanctuary Island (Section 4-5: X 3460 - 3840)
      mkEnemy('samurai', 3660, 600 - 48, 260),
      // Samurai 4: East Blood Falls Terrace (Section 5: X 4080 - 4360, 280px platform)
      mkEnemy('samurai', 4200, 680 - 48, 200),
      // Samurai 5: Upper Blood Temple courtyard (Section 7: X 5320 - 5780)
      mkEnemy('samurai', 5540, 340 - 48, 320),

      // Corrupted Bats (Free 2D flight & aerial ambush in western/central caverns):
      // Bat 1: Mid-chasm vertical descent (Section 3)
      mkEnemy('spirit', 2200, 460, 380),
      // Bat 2: Blood Sea West Grotto (Section 4)
      mkEnemy('spirit', 2850, 420, 360),
      // Bat 3: Open-air cavern over the Blood Sea (Section 4-5)
      mkEnemy('spirit', 3600, 480, 380),

      // Story Guardian Boss: Hanzo (Guarding the Portal to Tamashi no Shinden)
      // When defeated, Hanzo remains visible in the courtyard as a peaceful sentinel
      ...(!hanzoDefeated
        ? [{ ...mkEnemy('hanzo', 6750, 280 - 58, 600), hp: 70, maxHp: 70, state: 'idle' as const }]
        : [{ ...mkEnemy('hanzo', 6750, 280 - 58, 600), hp: 0, maxHp: 70, state: 'defeated' as const, alive: true, attackCooldown: 999999 }]),
    ],
    // Hanzo Boss Arena Entrance Checkpoint (Section 8 Entrance at X = 6120)
    checkpoint: { x: 6120, y: 280 - 70, w: 30, h: 70, activated: false },
    // Ancient Cursed Portal at the end of Chinoike Jigoku (Locked until Hanzo is defeated)
    exit: { x: 7380, y: 280 - 110, w: 90, h: 110, locked: !hanzoDefeated },
    hanzoDefeated,
  };
}

export function createLevel(location: StoryLocation = 'yunami-jigoku', hanzoDefeated: boolean = false): LevelData {
  if (location === 'chinoike-jigoku') {
    return createChinoikeJigoku(hanzoDefeated);
  }
  return createYunamiJigoku();
}
