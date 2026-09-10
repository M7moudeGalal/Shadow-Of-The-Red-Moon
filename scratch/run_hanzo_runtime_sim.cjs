// Simulate Hanzo fight for 600 frames
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

let bossIntroTriggered = true;
let bossIntroTimer = 0;

console.log('Simulating 1200 frames (~20 seconds) of Hanzo combat...');
let errors = [];

for (let tick = 0; tick < 1200; tick++) {
  // Cooldowns
  if (hanzo.dashCooldown > 0) hanzo.dashCooldown--;
  if (hanzo.spinCooldown > 0) hanzo.spinCooldown--;
  if (hanzo.risingCooldown > 0) hanzo.risingCooldown--;
  if (hanzo.teleportCooldown > 0) hanzo.teleportCooldown--;
  if (hanzo.comboCooldown > 0) hanzo.comboCooldown--;
  if (hanzo.jumpCooldown > 0) hanzo.jumpCooldown--;
  if (hanzo.hurtCooldown > 0) hanzo.hurtCooldown--;
  if (hanzo.attackCooldown > 0) hanzo.attackCooldown--;

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
    const dist = Math.abs(player.x - hanzo.x);
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
    errors.push(`Tick ${tick}: Hanzo fell through floor! y=${hanzo.y}, onGround=${hanzo.onGround}, vy=${hanzo.vy}, state=${hanzo.state}, jumpPhase=${hanzo.jumpPhase}`);
    break;
  }
}

if (errors.length > 0) {
  console.error('FAILURES DETECTED:');
  errors.forEach(e => console.error(e));
} else {
  console.log('SUCCESS! Hanzo simulated 1200 frames cleanly without falling through floor or NaN!');
}
