const GRAVITY = 0.7;
const MOVE_SPEED = 4.2;
const JUMP_VELOCITY = -14.5;
const DOUBLE_JUMP_VY = -10.5;
const DASH_SPEED = 10.5;
const DASH_DURATION = 12;

function simulateJump(x1, w1, y1, x2, w2, y2, useDash, useDoubleJump) {
  let startX = x1 + w1;
  let targetX = x2;
  let targetW = w2;
  let targetY = y2;
  let gap = x2 - (x1 + w1);

  let px = 0;
  let py = 0;
  let vx = MOVE_SPEED;
  let vy = JUMP_VELOCITY;
  let dashed = false;
  let doubleJumped = false;
  let dashTimer = 0;

  for (let t = 0; t < 120; t++) {
    if (useDoubleJump && !doubleJumped && t === 20) {
      doubleJumped = true;
      vy = DOUBLE_JUMP_VY;
    }
    if (useDash && !dashed && ((useDoubleJump && t === 25) || (!useDoubleJump && t === 16))) {
      dashed = true;
      dashTimer = DASH_DURATION;
    }

    if (dashTimer > 0) {
      dashTimer--;
      vx = DASH_SPEED;
      vy = 0;
    } else {
      vx = MOVE_SPEED;
      vy += GRAVITY;
    }

    px += vx;
    py += vy;

    let playerLeft = startX + px;
    let playerRight = playerLeft + 28;
    let playerFoot = y1 + py + 48;

    if (playerRight >= targetX && playerLeft <= targetX + targetW) {
      if (Math.abs(playerFoot - targetY) <= 16 && vy >= 0) {
        return { success: true, dist: px, gap };
      }
      if (playerFoot >= targetY && (playerFoot - vy) <= targetY && vy > 0) {
        return { success: true, dist: px, gap };
      }
    }
    if (py > (targetY - y1) + 60 && vy > 0) break;
  }
  return { success: false, dist: px, gap };
}

const yunamiMastabaPairs = [
  // Courtyard Mastabas
  { name: 'Yunami Courtyard M1 -> M2', p1: [2060, 110, 470], p2: [2365, 110, 470] },
  // Section 5 Elevated Temple
  { name: 'Yunami Temple M1 -> M2', p1: [2740, 120, 440], p2: [3050, 140, 330], needDoubleJump: true },
  { name: 'Yunami Temple M2 -> M3', p1: [3050, 140, 330], p2: [3430, 120, 440] },
  // Section 6 Bat Air
  { name: 'Yunami Bat M1 -> M2', p1: [3700, 120, 430], p2: [4020, 120, 430] },
  // Section 7 Volcanic Sanctum
  { name: 'Yunami Sanctum M1 -> M2', p1: [4400, 120, 460], p2: [4715, 120, 390], needDoubleJump: true },
  { name: 'Yunami Sanctum M2 -> M3', p1: [4715, 120, 390], p2: [5060, 110, 460] },
  // Section 8 Deeper Infernal
  { name: 'Yunami Deeper Temple M1 -> M2', p1: [5320, 140, 390], p2: [5660, 120, 420] },
];

const chinoikeMastabaPairs = [
  // Section 1 Entrance -> Section 2
  { name: 'Chinoike Entrance M1 -> S2 M1', p1: [560, 140, 340], p2: [930, 160, 410] },
  // Section 2 Descending Ruins
  { name: 'Chinoike S2 M1 -> M2', p1: [930, 160, 410], p2: [1320, 150, 490] },
  { name: 'Chinoike S2 M2 -> Ground', p1: [1320, 150, 490], p2: [1690, 260, 580] },
  // Section 3 Deep Blood Chasm
  { name: 'Chinoike Chasm M1 -> M2', p1: [1940, 130, 550], p2: [2290, 120, 620] },
  // Sections 4-5 Blood Sea Islands
  { name: 'Chinoike West Island -> Central Island (Blood Sea)', p1: [3076, 200, 660], p2: [3470, 370, 600], needDoubleJump: true },
  { name: 'Chinoike Central Island -> East Terrace (Blood Sea)', p1: [3470, 370, 600], p2: [4080, 280, 680] },
  // Section 6 Long Ascent out of Abyss
  { name: 'Chinoike Ascent M1 -> M2', p1: [4420, 140, 620], p2: [4755, 140, 490], needDoubleJump: true },
  { name: 'Chinoike Ascent M2 -> M3', p1: [4755, 140, 490], p2: [5090, 140, 380], needDoubleJump: true },
];

console.log('=== VERIFYING YUNAMI JIGOKU MASTABA DASH CHALLENGES ===');
let yunamiAllPass = true;
for (const pair of yunamiMastabaPairs) {
  const [x1, w1, y1] = pair.p1;
  const [x2, w2, y2] = pair.p2;
  const normal = simulateJump(x1, w1, y1, x2, w2, y2, false, false);
  const dashOnly = simulateJump(x1, w1, y1, x2, w2, y2, true, false);
  const doubleJumpDash = simulateJump(x1, w1, y1, x2, w2, y2, true, true);

  const dashSuccess = pair.needDoubleJump ? doubleJumpDash.success : dashOnly.success;
  const gap = x2 - (x1 + w1);
  console.log(`\n[${pair.name}] (Gap: ${gap}px, Δy: ${y2 - y1}px)`);
  console.log(`  Normal Single Jump (no dash): ${normal.success ? 'CAN CLEAR (Warning)' : 'BLOCKED (Must use Dash!)'}`);
  console.log(`  Dash Traversal:               ${dashSuccess ? 'CLEARED SUCCESSFULLY!' : 'FAILED'}`);
  if (normal.success || !dashSuccess) yunamiAllPass = false;
}

console.log('\n=== VERIFYING CHINOIKE JIGOKU MASTABA DASH CHALLENGES ===');
let chinoikeAllPass = true;
for (const pair of chinoikeMastabaPairs) {
  const [x1, w1, y1] = pair.p1;
  const [x2, w2, y2] = pair.p2;
  const normal = simulateJump(x1, w1, y1, x2, w2, y2, false, false);
  const dashOnly = simulateJump(x1, w1, y1, x2, w2, y2, true, false);
  const doubleJumpDash = simulateJump(x1, w1, y1, x2, w2, y2, true, true);

  const dashSuccess = pair.needDoubleJump ? doubleJumpDash.success : dashOnly.success;
  const gap = x2 - (x1 + w1);
  console.log(`\n[${pair.name}] (Gap: ${gap}px, Δy: ${y2 - y1}px)`);
  console.log(`  Normal Single Jump (no dash): ${normal.success ? 'CAN CLEAR (Warning)' : 'BLOCKED (Must use Dash!)'}`);
  console.log(`  Dash Traversal:               ${dashSuccess ? 'CLEARED SUCCESSFULLY!' : 'FAILED'}`);
  if (normal.success || !dashSuccess) chinoikeAllPass = false;
}

console.log('\n=== FINAL VERIFICATION SUMMARY ===');
console.log(`Yunami Jigoku All Blocked Without Dash & Cleared With Dash: ${yunamiAllPass ? 'YES (100% PASS)' : 'NO'}`);
console.log(`Chinoike Jigoku All Blocked Without Dash & Cleared With Dash: ${chinoikeAllPass ? 'YES (100% PASS)' : 'NO'}`);
