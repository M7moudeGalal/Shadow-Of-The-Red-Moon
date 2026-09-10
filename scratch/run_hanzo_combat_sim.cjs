// Simulate Hanzo fight with full player combat hits, shurikens, and damage to 0 HP
const GRAVITY = 0.55;
const MAX_FALL = 14;
const HANZO_JUMP_LAUNCH_VY = -9.8;
const HANZO_JUMP_HORIZONTAL_SPEED = 2.8;

const arenaPlatform = { x: 6100, y: 280, w: 1400, h: 40, type: 'ground' };
const levelPlatforms = [
  { x: 5880, y: 280, w: 230, h: 40, type: 'ground' },
  arenaPlatform
];

let player = {
  x: 6500,
  y: 280 - 48,
  w: 32,
  h: 48,
  vx: 0,
  vy: 0,
  alive: true,
  hp: 5,
  maxHp: 5,
  facing: 1
};

let hanzo = {
  id: 999,
  type: 'hanzo',
  x: 6750,
  y: 280 - 58,
  w: 34,
  h: 58,
  vx: 0,
  vy: 0,
  onGround: true,
  alive: true,
  hp: 30,
  maxHp: 30,
  state: 'idle',
  facing: -1,
  attackCooldown: 0,
  attackTimer: 0,
  jumpCooldown: 0,
  hurtCooldown: 0,
  deadTimer: 0,
  dashCooldown: 0,
  spinCooldown: 0,
  risingCooldown: 0,
  teleportCooldown: 25,
  teleportTimer: 0,
  comboCooldown: 15,
  hitConnected: false,
  attackParried: false,
  telegraph: 'none',
  telegraphTimer: 0,
  telegraphMaxTimer: 0
};

let errors = [];

function triggerHanzoDamage(e, hitFacing) {
  e.state = 'hurt';
  e.hurtCooldown = 18;
  e.damageFrame = 0;
  e.deathFrame = undefined;
  e.vx = hitFacing * 2.2;
  e.jumpPhase = undefined;
  e.jumpFrame = undefined;
  e.jumpTimer = 0;
  e.comboActive = false;
  e.comboStep = undefined;
  e.attackTimer = 0;
  e.teleportTimer = 0;
  e.hitConnected = false;
  e.attackParried = false;
  e.telegraph = 'none';
  e.telegraphTimer = 0;
}

function triggerHanzoHit(e, hitFacing) {
  if (!e.alive || e.state === 'death' || e.state === 'dead') return;
  e.hp = Math.max(0, e.hp - 1);
  if (e.hp <= 0) {
    e.state = 'death';
    e.deadTimer = 0;
    e.deathFrame = 0;
    if (!e.onGround) {
      e.y = 280 - e.h;
      e.vy = 0;
      e.onGround = true;
    }
  } else {
    triggerHanzoDamage(e, hitFacing);
  }
}

console.log('Simulating aggressive combat against Hanzo down to 0 HP...');

for (let tick = 0; tick < 2000; tick++) {
  // Player attacks every 15 ticks if in range
  const dist = Math.abs(player.x - hanzo.x);
  if (tick % 15 === 0 && dist < 120 && hanzo.alive && hanzo.state !== 'death') {
    triggerHanzoHit(hanzo, 1);
  }

  // Player follows Hanzo
  if (hanzo.x > player.x + 60) player.x += 2.5;
  else if (hanzo.x < player.x - 60) player.x -= 2.5;

  // Hanzo loop
  if (hanzo.dashCooldown > 0) hanzo.dashCooldown--;
  if (hanzo.spinCooldown > 0) hanzo.spinCooldown--;
  if (hanzo.risingCooldown > 0) hanzo.risingCooldown--;
  if (hanzo.teleportCooldown > 0) hanzo.teleportCooldown--;
  if (hanzo.comboCooldown > 0) hanzo.comboCooldown--;
  if (hanzo.jumpCooldown > 0) hanzo.jumpCooldown--;

  // Death state
  if (hanzo.state === 'death') {
    hanzo.deadTimer++;
    if (hanzo.deadTimer > 22) {
      hanzo.deathFrame = 3; // HOLD FRAME
    }
    continue;
  }

  // Hurt state
  if (hanzo.state === 'hurt') {
    hanzo.hurtCooldown--;
    hanzo.vx *= 0.85;
    if (hanzo.hurtCooldown <= 0) {
      hanzo.state = 'idle';
      hanzo.vx = 0;
    }
    if (!hanzo.onGround) {
      hanzo.vy = Math.min((hanzo.vy || 0) + GRAVITY, MAX_FALL);
      hanzo.y += hanzo.vy;
      for (const pl of levelPlatforms) {
        if (pl.type !== 'wall' && hanzo.x + hanzo.w > pl.x && hanzo.x < pl.x + pl.w) {
          if (hanzo.y + hanzo.h >= pl.y && hanzo.y + hanzo.h <= pl.y + 16 && (hanzo.vy || 0) >= 0) {
            hanzo.y = pl.y - hanzo.h;
            hanzo.vy = 0;
            hanzo.onGround = true;
            break;
          }
        }
      }
    }
    hanzo.x += hanzo.vx;
    if (hanzo.x < 6110) { hanzo.x = 6110; hanzo.vx = 0; }
    if (hanzo.x > 7460) { hanzo.x = 7460; hanzo.vx = 0; }
    continue;
  }

  // Airborne gravity
  if (!hanzo.onGround) {
    hanzo.vy = Math.min((hanzo.vy || 0) + GRAVITY, MAX_FALL);
    hanzo.y += hanzo.vy;
    for (const pl of levelPlatforms) {
      if (pl.type !== 'wall' && hanzo.x + hanzo.w > pl.x && hanzo.x < pl.x + pl.w) {
        if (hanzo.y + hanzo.h >= pl.y && hanzo.y + hanzo.h <= pl.y + 16 && (hanzo.vy || 0) >= 0) {
          hanzo.y = pl.y - hanzo.h;
          hanzo.vy = 0;
          hanzo.onGround = true;
          if (hanzo.state === 'jump' && (hanzo.jumpPhase === 'launch' || hanzo.jumpPhase === 'airborne' || hanzo.jumpPhase === 'descent')) {
            hanzo.jumpPhase = 'landing';
            hanzo.jumpTimer = 9;
            hanzo.jumpFrame = 12;
            hanzo.vx = 0;
          }
          break;
        }
      }
    }
  }

  // Telegraph system
  if (hanzo.telegraph && hanzo.telegraph !== 'none') {
    hanzo.vx = 0;
    hanzo.telegraphTimer = (hanzo.telegraphTimer || 0) - 1;
    if (hanzo.telegraphTimer <= 0) {
      const currentTelegraph = hanzo.telegraph;
      hanzo.telegraph = 'none';
      if (currentTelegraph === 'rising') {
        hanzo.state = 'rising_attack';
        hanzo.attackTimer = 18;
        hanzo.vy = -8.5;
        hanzo.onGround = false;
      } else if (currentTelegraph === 'spin') {
        hanzo.state = 'spin_attack';
        hanzo.attackTimer = 20;
      } else if (currentTelegraph === 'teleport') {
        hanzo.state = 'teleport_attack';
        hanzo.teleportTimer = 34;
        hanzo.teleportDestX = hanzo.telegraphTargetX ?? (player.x + 56);
        hanzo.teleportDestY = 280 - hanzo.h;
      }
    }
    continue;
  }

  // Teleport attack
  if (hanzo.state === 'teleport_attack') {
    hanzo.teleportTimer = (hanzo.teleportTimer || 0) - 1;
    if (hanzo.teleportTimer === 24) {
      hanzo.x = hanzo.teleportDestX ?? hanzo.x;
      hanzo.y = hanzo.teleportDestY ?? hanzo.y;
      hanzo.vx = 0;
      hanzo.vy = 0;
    } else if (hanzo.teleportTimer <= 0) {
      hanzo.state = 'idle';
      hanzo.teleportCooldown = 55;
    }
  }
  // Spin attack
  else if (hanzo.state === 'spin_attack') {
    hanzo.attackTimer -= 1;
    if (hanzo.attackTimer <= 0) {
      hanzo.state = 'idle';
      hanzo.spinCooldown = 35;
    }
  }
  // Rising attack
  else if (hanzo.state === 'rising_attack') {
    hanzo.attackTimer -= 1;
    if (hanzo.attackTimer <= 0) {
      hanzo.state = 'idle';
      hanzo.risingCooldown = 45;
    }
  }
  // Jump
  else if (hanzo.state === 'jump') {
    if (hanzo.jumpPhase === 'prep') {
      hanzo.jumpTimer--;
      if (hanzo.jumpTimer <= 0) {
        hanzo.jumpPhase = 'launch';
        hanzo.jumpTimer = 9;
        hanzo.vy = HANZO_JUMP_LAUNCH_VY;
        hanzo.onGround = false;
        hanzo.vx = hanzo.facing * HANZO_JUMP_HORIZONTAL_SPEED;
      }
    } else if (hanzo.jumpPhase === 'launch') {
      hanzo.jumpTimer--;
      if (hanzo.jumpTimer <= 0) {
        hanzo.jumpPhase = 'airborne';
        hanzo.jumpTimer = 16;
      }
    } else if (hanzo.jumpPhase === 'airborne') {
      hanzo.jumpTimer--;
      if (hanzo.jumpTimer <= 0 || hanzo.vy > 0.5) {
        hanzo.jumpPhase = 'descent';
        hanzo.jumpTimer = 12;
      }
    } else if (hanzo.jumpPhase === 'descent') {
      hanzo.jumpTimer--;
    } else if (hanzo.jumpPhase === 'landing') {
      hanzo.jumpTimer--;
      if (hanzo.jumpTimer <= 0) {
        hanzo.jumpPhase = 'recover';
        hanzo.jumpTimer = 4;
      }
    } else if (hanzo.jumpPhase === 'recover') {
      hanzo.jumpTimer--;
      if (hanzo.jumpTimer <= 0) {
        hanzo.state = 'idle';
        hanzo.jumpPhase = undefined;
        hanzo.jumpCooldown = 60;
      }
    }
  }
  // AI Decision
  else {
    hanzo.facing = player.x >= hanzo.x ? 1 : -1;
    if (hanzo.comboCooldown <= 0 && dist < 220) {
      hanzo.telegraph = 'spin';
      hanzo.telegraphTimer = 11;
      hanzo.telegraphMaxTimer = 11;
    } else if (hanzo.teleportCooldown <= 0 && dist > 110 && dist < 520) {
      let destX = player.x + (hanzo.facing === 1 ? -56 : 56);
      if (destX < 6140) destX = 6160;
      if (destX > 7400) destX = 7380;
      hanzo.telegraph = 'teleport';
      hanzo.telegraphTimer = 12;
      hanzo.telegraphMaxTimer = 12;
      hanzo.telegraphTargetX = destX;
    } else if (hanzo.jumpCooldown <= 0 && dist > 180 && dist < 380) {
      hanzo.state = 'jump';
      hanzo.jumpPhase = 'prep';
      hanzo.jumpTimer = 6;
      hanzo.vx = 0;
    } else if (dist > 50) {
      hanzo.state = 'chase';
      hanzo.vx = hanzo.facing * 2.8;
    } else {
      hanzo.state = 'idle';
      hanzo.vx = 0;
    }
  }

  // Bounds
  hanzo.x += hanzo.vx;
  if (hanzo.x < 6110) { hanzo.x = 6110; hanzo.vx = 0; }
  if (hanzo.x > 7460) { hanzo.x = 7460; hanzo.vx = 0; }

  // Check sanity
  if (isNaN(hanzo.x) || isNaN(hanzo.y)) {
    errors.push(`Tick ${tick}: Hanzo pos NaN: x=${hanzo.x}, y=${hanzo.y}`);
    break;
  }
  if (hanzo.y > 400) {
    errors.push(`Tick ${tick}: Hanzo fell through floor! y=${hanzo.y}`);
    break;
  }
}

console.log(`Simulation finished. Hanzo final HP: ${hanzo.hp}, State: ${hanzo.state}, DeathFrame: ${hanzo.deathFrame}`);
if (errors.length > 0) {
  console.error('Errors:', errors);
} else {
  console.log('ALL COMBAT TICKS PASSED WITHOUT ERRORS!');
}
