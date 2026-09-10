import { useRef, useState, useEffect, useCallback } from 'react';
import type {
  PlayerState,
  Enemy,
  LevelData,
  AnimState,
  Rect,
  VisualEffect,
  ShurikenProjectile,
  ShurikenHitEffect,
  RespawnEffect,
  DashGhost,
  ParryHitEffect,
  CollectibleShuriken,
  StoryLocation,
  HanzoHitEffect,
  HanzoGhost,
  BladeWaveProjectile,
  NinjaSkill,
  TrophyNotification,
  UnlockedSkills,
  StoryCinematicState,
  StoryCinematicShot,
  CinematicDialogueLine,
  StoryCutscenePhase,
  StoryChoice,
} from './types';
import { createLevel, LEVEL_WIDTH, GROUND_Y } from './level';
import { soundEffects } from './soundEffects';
import { titleMusic } from './titleMusic';
import { preloadAllGameAssets } from './assetCache';
import { loadStoryFlags, saveStoryFlags, resetStoryFlags } from './storyFlags';

export const OPENING_CUTSCENE_DIALOGUES: CinematicDialogueLine[] = [
  { speaker: 'HANZO', text: 'Who are you?', jpSubtitle: 'お前は何者だ…？' },
  { speaker: 'UNKNOWN', text: 'Someone who knows what waits beyond the gate.', jpSubtitle: '門の向こうで待ち受けるものを知る者だ。' },
  { speaker: 'HANZO', text: 'What do you want from me?', jpSubtitle: '私に何を望む？' },
  { speaker: 'UNKNOWN', text: 'Nothing.', jpSubtitle: '何も。' },
  { speaker: 'UNKNOWN', text: 'Take this.', jpSubtitle: 'これを受け取れ。' },
  { speaker: 'HANZO', text: 'What is it?', jpSubtitle: 'これは…？' },
  { speaker: 'UNKNOWN', text: 'A spirit that was never meant to be yours.', jpSubtitle: '本来、お前のものではなかった魂魄だ。' },
];

export const FINAL_CUTSCENE_DIALOGUES: CinematicDialogueLine[] = [
  { speaker: 'HANZO', text: 'Who are you?', jpSubtitle: 'お前は何者だ…？' },
  { speaker: 'UNKNOWN', text: "You still don't remember.", jpSubtitle: 'まだ思い出せぬか。' },
  { speaker: 'HANZO', text: 'Remember what?', jpSubtitle: '何を覚えているというのだ？' },
  { speaker: 'UNKNOWN', text: 'The spirit.', jpSubtitle: 'あの時の魂魄を。' },
  { speaker: 'HANZO', text: 'What did you give me?', jpSubtitle: '私に何を与えた…？' },
  { speaker: 'UNKNOWN', text: 'Part of yourself.', jpSubtitle: 'お前自身の、一片だ。' },
  {
    speaker: 'HANZO — SHADOW',
    text: 'I was forged from the curse that bound your soul to Hell. Strike me down or spare me... we are of one blood.',
    jpSubtitle: '我は汝の魂を繋ぎ止めし呪詛より生まれし者。斬るも生かすも…我らは同じ血の器。',
  },
];

export function createOpeningCutsceneState(): StoryCinematicState {
  return {
    active: true,
    phase: 'opening_fade_in',
    shot: 'shot1_silence',
    shotIndex: 1,
    dialogueIndex: 0,
    currentLine: OPENING_CUTSCENE_DIALOGUES[0],
    timer: 60,
    cameraFocusX: 260,
    cameraFocusY: 530,
    cameraZoom: 1.15,
    flashbackActive: false,
    energyTetherActive: false,
    fadeOpacity: 1.0,
    isComplete: false,
    canAdvance: false,
    unknownActor: {
      x: 380,
      y: 544,
      facing: -1,
      anim: 'idle',
      opacity: 0,
    },
    spiritOrb: {
      active: false,
      x: 330,
      y: 535,
      targetX: 194,
      targetY: 550,
      progress: 0,
    },
    selectedChoiceIndex: 0,
    revealedIdentity: false,
    executionHitConnected: false,
  };
}

const CINEMATIC_DIALOGUES: Record<StoryCinematicShot, CinematicDialogueLine[]> = {
  shot1_silence: [],
  shot2_approach: [],
  shot3_dialogue1: FINAL_CUTSCENE_DIALOGUES,
  shot4_guardian_move: [
    { speaker: 'HANZO', text: 'That stance...', jpSubtitle: 'その構え…！', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'You remember.', jpSubtitle: '覚えているはずだ。', pauseAfterTicks: 95 },
  ],
  shot5_memory_reveal: [
    { speaker: 'THE GUARDIAN', text: 'Quan Chi sent you.', jpSubtitle: 'クァン・チーがお前を放った。', pauseAfterTicks: 90 },
    { speaker: 'THE GUARDIAN', text: 'You believed it was a mission.', jpSubtitle: '己の使命だと信じ込んでな。', pauseAfterTicks: 90 },
    { speaker: 'THE GUARDIAN', text: 'You died.', jpSubtitle: 'そして…死んだ。', pauseAfterTicks: 95 },
    { speaker: 'HANZO', text: 'How do you know that?', jpSubtitle: 'なぜそれを知っている…？！', pauseAfterTicks: 90 },
    { speaker: 'THE GUARDIAN', text: 'Because I was there.', jpSubtitle: '私がその場にいたからだ。', pauseAfterTicks: 105 },
    { speaker: 'HANZO', text: 'Who are you?', jpSubtitle: 'お前は…何者なのだ？', pauseAfterTicks: 90 },
    { speaker: 'THE GUARDIAN', text: 'The part of you that never left.', jpSubtitle: '奈落に取り残された、お前自身だ。', pauseAfterTicks: 120 },
  ],
  shot6_purple_soul: [
    { speaker: 'HANZO', text: 'You...', jpSubtitle: 'お前が…あの時の…！', pauseAfterTicks: 75 },
    { speaker: 'THE GUARDIAN', text: 'Yes.', jpSubtitle: 'そうだ。', pauseAfterTicks: 75 },
    { speaker: 'HANZO', text: 'The soul.', jpSubtitle: 'あの魂は…', pauseAfterTicks: 75 },
    { speaker: 'THE GUARDIAN', text: 'Not a gift.', jpSubtitle: '恩寵ではない。', pauseAfterTicks: 75 },
    { speaker: 'THE GUARDIAN', text: 'A chain.', jpSubtitle: '呪縛の鎖だ。', pauseAfterTicks: 105 },
  ],
  shot7_curse_lore: [
    { speaker: 'THE GUARDIAN', text: "Quan Chi's sorcery did not end when Sub-Zero took your breath. He wove an infernal curse around your soul—binding you to this abyss.", jpSubtitle: 'クァン・チーの呪縛は死で解かれはしなかった。魂そのものに刻まれ、この地獄へと繋ぎ止められたのだ。', pauseAfterTicks: 120 },
    { speaker: 'THE GUARDIAN', text: 'I was forged from that curse. A second existence cast into the boiling blood of Hell.', jpSubtitle: '私はその呪いより生じた。地獄の業火が産み落とした、もう一人の半蔵。', pauseAfterTicks: 120 },
    { speaker: 'HANZO', text: 'Then cutting you down breaks the curse.', jpSubtitle: 'ならば貴様を断ち切れば、呪縛も消え失せるはずだ。', pauseAfterTicks: 95 },
    { speaker: 'THE GUARDIAN', text: 'Strike me down a thousand times. The curse feeds upon your wrath.', jpSubtitle: '千度斬り伏せようと無駄だ。憎悪こそが呪いの糧なのだから。', pauseAfterTicks: 110 },
  ],
  shot8_cannot_destroy: [
    { speaker: 'HANZO', text: 'Then I will destroy you.', jpSubtitle: 'ならば跡形もなく消滅させるまで。', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'You cannot.', jpSubtitle: 'それは叶わぬ。', pauseAfterTicks: 85 },
    { speaker: 'HANZO', text: 'I just did.', jpSubtitle: '現に討ち倒したぞ。', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'No.', jpSubtitle: '否。', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'You defeated me.', jpSubtitle: '敗れはしたが…', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'You did not destroy me.', jpSubtitle: '滅びてはいない。', pauseAfterTicks: 95 },
    { speaker: 'THE GUARDIAN', text: 'You cannot destroy what you are.', jpSubtitle: '己自身を、滅ぼすことなどできはしない。', pauseAfterTicks: 130 },
  ],
  shot9_cycle_reveal: [
    { speaker: 'THE GUARDIAN', text: 'If you sever my flesh, the curse tightens around your heart. You leave Chinoike Jigoku hollowed, a pawn stumbling into his hands.', jpSubtitle: '私を滅ぼせば、呪縛はお前の心を蝕む。弱り果てた抜け殻のまま、奴の掌へと歩み出ることになる。', pauseAfterTicks: 130 },
    { speaker: 'THE GUARDIAN', text: 'Without your true strength, you will fall before him again. And Quan Chi will forge the chains anew.', jpSubtitle: '力を欠いたままでは再び奴に敗れ、幾度でも鎖を繋がれる。', pauseAfterTicks: 120 },
    { speaker: 'THE GUARDIAN', text: 'The Hellbound Cycle will never end.', jpSubtitle: '輪廻の業火は…永遠に巡り続けるのだ。', pauseAfterTicks: 130 },
  ],
  shot10_guardian_req: [
    { speaker: 'THE GUARDIAN', text: 'Leave me.', jpSubtitle: 'ここを去れ。', pauseAfterTicks: 85 },
    { speaker: 'HANZO', text: 'Why?', jpSubtitle: '何故だ…？', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'Because you cannot defeat him while I remain inside you.', jpSubtitle: '私が宿ったままでは、奴を討ち破ることなどできぬ。', pauseAfterTicks: 115 },
    { speaker: 'HANZO', text: 'Then what happens to you?', jpSubtitle: 'ならば…お前はどうなる？', pauseAfterTicks: 95 },
    { speaker: 'THE GUARDIAN', text: 'I remain here.', jpSubtitle: '私はここに留まる。', pauseAfterTicks: 95 },
    { speaker: 'HANZO', text: 'Alone?', jpSubtitle: '一人、孤独に…？', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'Not alone.', jpSubtitle: '孤独ではない。', pauseAfterTicks: 95 },
    { speaker: 'THE GUARDIAN', text: 'I am the gate.', jpSubtitle: '私は…この門そのものなのだから。', pauseAfterTicks: 120 },
  ],
  shot11_choice: [
    { speaker: 'HANZO', text: 'Then stay.', jpSubtitle: 'ならば…眠れ。', pauseAfterTicks: 95 },
    { speaker: 'THE GUARDIAN', text: 'I have no choice.', jpSubtitle: '選ぶ道など、初めからない。', pauseAfterTicks: 95 },
    { speaker: 'HANZO', text: 'Neither do I.', jpSubtitle: '…私も同じだ。', pauseAfterTicks: 110 },
  ],
  shot12_final_words: [
    { speaker: 'THE GUARDIAN', text: 'Hanzo.', jpSubtitle: '半蔵。', pauseAfterTicks: 85 },
    { speaker: 'THE GUARDIAN', text: 'When you meet him...', jpSubtitle: '奴と相見えた時…', pauseAfterTicks: 95 },
    { speaker: 'THE GUARDIAN', text: 'Do not fight him as the man you were.', jpSubtitle: '過去の己として戦うな。', pauseAfterTicks: 110 },
    { speaker: 'THE GUARDIAN', text: 'Fight him as the man you became.', jpSubtitle: '地獄を越え、成るべき姿となった己として戦え。', pauseAfterTicks: 130 },
  ],
  shot13_resumption: [],
};

// ============================================================
// GAMEPLAY & FEEL TUNING CONSTANTS (Professional Polish Pass)
// ============================================================
// Physics & Movement
const GRAVITY = 0.7;
const MOVE_SPEED = 4.2;
const GROUND_ACCEL = 0.85;
const GROUND_FRICTION = 0.68;
const AIR_ACCEL = 0.70;
const AIR_FRICTION = 0.86;
const TURN_BOOST = 0.40; // Snappy instant turnaround when reversing direction

// Jump & Air Control
const JUMP_VELOCITY = -14.5;
const DOUBLE_JUMP_VY = -10.5;
const DOUBLE_JUMP_HORIZONTAL_IMPULSE = 1.5;
const DOUBLE_JUMP_DURATION = 72; // 24 frames @ ~50ms (3 ticks/frame @ 60fps)
const MAX_FALL = 16;
const COYOTE_TIME = 7; // ~116ms grace period after walking off edges
const JUMP_BUFFER_TIME = 8; // ~133ms jump buffer window before landing
const VARIABLE_JUMP_CUTOFF = -3.5; // Upward velocity threshold where releasing Jump cuts ascent
const VARIABLE_JUMP_DAMPING = 0.65; // Upward velocity multiplier on early jump release

// Dash
const DASH_SPEED = 10.5;
const DASH_DURATION = 12;
const DASH_COOLDOWN = 36;
const DASH_STAMINA_COST = 50; // Each dash consumes 50 stamina (2 dashes on full bar)
const STAMINA_RECHARGE_RATE = 100 / (5 * 60); // Fully recharges from 0 to 100 in 5.0 seconds (0.333/frame @ 60fps)

// Combat Timings & Hitboxes
const ATTACK_DURATION = 14;
const ATTACK_COOLDOWN = 18;
const ATTACK_BUFFER_TIME = 9; // ~150ms attack buffer window for fluid combo chaining
const ATTACK_RECOVERY_CANCEL_WINDOW = 5; // Frames remaining in attack where dash/parry/jump can cancel recovery
const ATTACK_RANGE = 48;
const HIT_STOP_NORMAL = 2; // ~33ms freeze frame on normal hit
const HIT_STOP_COMBO_FINISHER = 3; // ~50ms freeze frame on 3rd combo strike
const HIT_STOP_SKILL = 4; // ~66ms freeze frame on skills (Blood Spin, Kick, Wave)
const HIT_STOP_BOSS_HIT = 5; // ~83ms freeze frame on Hanzo boss hits

// Camera
const CAMERA_LOOKAHEAD_MAX = 44; // Subtle horizontal look-ahead based on movement

// --- Ninja Skill Durations & Cooldowns (per frame @ 60fps, 3 ticks per sprite frame) ---
const SKILL_COOLDOWN = 12;
const SHADOW_DASH_STRIKE_DURATION = 24; // 8 frames * 3 ticks (~400ms)
const SLASH_COMBO_DURATION = 30; // 10 frames * 3 ticks (~500ms)
const BLADE_WAVE_DURATION = 30; // 10 frames * 3 ticks (~500ms)
const BLOOD_SPIN_DURATION = 24; // 8 frames * 3 ticks (~400ms)
const AERIAL_KICK_DURATION = 24; // 8 frames * 3 ticks (~400ms) - Anti-Air Wyvern Kick
const ATTACK_HOLD_THRESHOLD = 18; // ~300ms hold to charge Blood Spin Slash

const PARRY_DURATION = 24; // 24 frames total (~400ms: startup 5, active window 8, recovery 11)
const PARRY_COOLDOWN = 32; // Prevents parry spamming
const SHURIKEN_SPEED = 8.0;
const SHURIKEN_DAMAGE = 1;
const SHURIKEN_COOLDOWN = 36;
const MAX_SHURIKEN_DISTANCE = 560;
const INVULN_DURATION = 70;
const ENEMY_DETECT_RANGE = 180;
const ENEMY_ATTACK_RANGE = 40;
const ENEMY_ATTACK_COOLDOWN = 70;
const SPIKE_DAMAGE = 2;
const ENEMY_CONTACT_DAMAGE = 1;

// --- Hanzo Boss Jump Configuration (Unified Physics & Collision-Driven Animation) ---
const HANZO_JUMP_COOLDOWN = 180; // 3.0s normal cooldown
const HANZO_JUMP_ENRAGED_COOLDOWN = 130; // ~2.1s enraged cooldown
const HANZO_JUMP_LAUNCH_VY = -9.8; // Upward vertical launch velocity
const HANZO_JUMP_HORIZONTAL_SPEED = 2.8; // Controlled horizontal forward leap speed

// --- Hanzo Boss Attack Telegraph Configuration ---
const HANZO_TELEGRAPH_RISING_TICKS = 12; // 200ms @ 60fps (Target: 180-220ms)
const HANZO_TELEGRAPH_SPIN_TICKS = 11; // 183ms @ 60fps (Target: 160-220ms)
const HANZO_TELEGRAPH_TELEPORT_TICKS = 12; // 200ms @ 60fps (Target: 150-250ms)

export type GameStatus = 'playing' | 'paused' | 'dead' | 'won' | 'mission_complete';

export interface RenderState {
  player: PlayerState;
  enemies: Enemy[];
  coins: { x: number; y: number; w: number; h: number; collected: boolean }[];
  collectibleShurikens: CollectibleShuriken[];
  checkpoint: { x: number; y: number; w: number; h: number; activated: boolean };
  exit: Rect & { locked?: boolean };
  platforms: Rect[];
  spikes: Rect[];
  bloodPonds: Rect[];
  effects: VisualEffect[];
  shurikens: ShurikenProjectile[];
  bladeWaves: BladeWaveProjectile[];
  shurikenHits: ShurikenHitEffect[];
  respawnEffect: RespawnEffect | null;
  hanzoHitEffect: HanzoHitEffect | null;
  dashGhosts: DashGhost[];
  parryHits: ParryHitEffect[];
  cameraX: number;
  cameraY: number;
  time: number;
  score: number;
  coinsCollected: number;
  totalCoins: number;
  shake: number;
  damageFlash: number;
  status: GameStatus;
  storyLocation: StoryLocation;
  levelName: string;
  levelJpName: string;
  levelWidth: number;
  levelHeight: number;
  extraLives: number;
  hanzoDefeated: boolean;
  hanzoGhosts: HanzoGhost[];
  inBossArena: boolean;
  bossIntroTimer: number;
  bossIntroTriggered: boolean;
  hanzoDeathCinematic: boolean;
  combo: {
    count: number;
    timer: number;
    maxTimer: number;
    rank: string;
    finisherReady: boolean;
  };
  slowMotion: {
    active: boolean;
    factor: number;
    timer: number;
  };
  trophyNotification: TrophyNotification | null;
  unlockedSkills: UnlockedSkills;
  yunamiKills: number;
  batKills: number;
  cameraZoom: number;
  storyCinematic: StoryCinematicState | null;
  portalPrompt: PortalPromptState | null;
}

export interface PortalPromptState {
  open: boolean;
  kills: number;
  requiredKills: number;
  hasBonusSkill: boolean;
}

interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  attack: boolean;
  dash: boolean;
  throw: boolean;
  parry: boolean;
  skillC: boolean;
  skillQ: boolean;
  shift: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  dashPressed: boolean;
  throwPressed: boolean;
  parryPressed: boolean;
  skillCPressed: boolean;
  skillQPressed: boolean;
  upPressed: boolean;
  downPressed: boolean;
  shiftPressed: boolean;
}

function createPlayer(spawn: { x: number; y: number }): PlayerState {
  return {
    x: spawn.x,
    y: spawn.y,
    w: 28,
    h: 48,
    vx: 0,
    vy: 0,
    facing: 1,
    onGround: false,
    anim: 'idle',
    hp: 5,
    maxHp: 5,
    shurikenCount: 3, // Ninja starts with 3 shurikens as requested
    stamina: 100, // Starts fully charged with 2 dashes
    maxStamina: 100,
    energy: 100, // Starts fully charged so player can cast immediately
    maxEnergy: 100,
    invuln: 0,
    attackCooldown: 0,
    attackTimer: 0,
    dashCooldown: 0,
    dashTimer: 0,
    throwCooldown: 0,
    throwTimer: 0,
    shurikenSpawned: false,
    parryCooldown: 0,
    parryTimer: 0,
    parryAnimTimer: 0,
    parrySuccess: false,
    isDefending: false,
    alive: true,
    deathTimer: 0,
    extraLives: 1,
    canDoubleJump: true,
    isDoubleJumping: false,
    doubleJumpFrame: 0,
    doubleJumpTimer: 0,
    activeSkill: undefined,
    skillTimer: 0,
    skillFrame: 0,
    attackHoldTimer: 0,
  };
}

function rectsOverlap(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function checkNearGround(player: PlayerState, platforms: Rect[], maxDist: number): boolean {
  const feetY = player.y + player.h;
  for (const plat of platforms) {
    if (plat.x < player.x + player.w && plat.x + plat.w > player.x) {
      if (plat.y >= feetY - 4 && plat.y <= feetY + maxDist) {
        return true;
      }
    }
  }
  return false;
}

export function useGameEngine(
  viewportWidth: number = 800,
  viewportHeight: number = 450,
  initialLocation: StoryLocation = 'yunami-jigoku'
) {
  const viewportWidthRef = useRef(viewportWidth);
  const viewportHeightRef = useRef(viewportHeight);
  useEffect(() => {
    viewportWidthRef.current = viewportWidth;
    viewportHeightRef.current = viewportHeight;
  }, [viewportWidth, viewportHeight]);

  const hanzoDefeatedRef = useRef(false);
  const hanzoHitEffectRef = useRef<HanzoHitEffect | null>(null);
  const nextHanzoHitEffectIdRef = useRef(1);
  const hanzoGhostsRef = useRef<HanzoGhost[]>([]);
  const nextHanzoGhostIdRef = useRef(1);
  const bossIntroTimerRef = useRef(0);
  const bossIntroTriggeredRef = useRef(false);
  const hanzoDeathCinematicRef = useRef<{
    active: boolean;
    timer: number;
    endingTimer: number;
  }>({
    active: false,
    timer: 0,
    endingTimer: 0,
  });
  const hasSeenOpening = (() => {
    try {
      return sessionStorage.getItem('shadow_opening_seen') === 'true';
    } catch (_) {
      return false;
    }
  })();
  const hasBossCheckpoint = (() => {
    try {
      return sessionStorage.getItem('shadow_boss_checkpoint') === 'true';
    } catch (_) {
      return false;
    }
  })();

  const effectiveLocation: StoryLocation = hasBossCheckpoint ? 'chinoike-jigoku' : initialLocation;
  const storyLocationRef = useRef<StoryLocation>(effectiveLocation);
  const levelRef = useRef<LevelData>(
    (() => {
      const lvl = createLevel(effectiveLocation, hanzoDefeatedRef.current);
      if (hasBossCheckpoint && lvl.storyLocation === 'chinoike-jigoku') {
        lvl.checkpoint.activated = true;
      }
      return lvl;
    })()
  );
  const playerRef = useRef<PlayerState>(
    (() => {
      if (hasBossCheckpoint && effectiveLocation === 'chinoike-jigoku') {
        const p = createPlayer({ x: 6140, y: 280 - 48 });
        p.invuln = 120;
        return p;
      }
      const p = createPlayer(levelRef.current.spawn);
      if (initialLocation === 'yunami-jigoku' && !hasSeenOpening) {
        p.x = 180;
        p.y = 552;
        p.facing = 1;
        p.anim = 'idle';
        p.invuln = 999999;
      }
      return p;
    })()
  );
  const enemiesRef = useRef<Enemy[]>(
    (() => {
      const list = levelRef.current.enemies.map((e) => ({ ...e }));
      if (hasBossCheckpoint && effectiveLocation === 'chinoike-jigoku') {
        return list.filter((e) => e.type === 'hanzo');
      }
      return list;
    })()
  );
  const effectsRef = useRef<VisualEffect[]>([]);
  const nextEffectIdRef = useRef(1);
  const shurikensRef = useRef<ShurikenProjectile[]>([]);
  const shurikenHitsRef = useRef<ShurikenHitEffect[]>([]);
  const nextShurikenIdRef = useRef(1);
  const nextHitEffectIdRef = useRef(1);
  const respawnEffectRef = useRef<RespawnEffect | null>(null);
  const nextRespawnEffectIdRef = useRef(1);
  const dashGhostsRef = useRef<DashGhost[]>([]);
  const nextDashGhostIdRef = useRef(1);
  const parryHitsRef = useRef<ParryHitEffect[]>([]);
  const nextParryHitIdRef = useRef(1);
  const skillHit1Ref = useRef<Set<number>>(new Set());
  const skillHit2Ref = useRef<Set<number>>(new Set());
  const skillCooldownRef = useRef(0);
  const bladeWavesRef = useRef<BladeWaveProjectile[]>([]);
  const nextBladeWaveIdRef = useRef(1);
  const downBufferTimerRef = useRef(0);
  const upBufferTimerRef = useRef(0);
  const shiftBufferTimerRef = useRef(0);
  const attackHoldTimerRef = useRef(0);
  const bladeWaveSpawnedRef = useRef(false);
  const normalAttackComboCountRef = useRef(0);
  const normalAttackComboTimerRef = useRef(0);
  const runStepTimerRef = useRef(0);
  const inputRef = useRef<InputState>({
    left: false, right: false, up: false, down: false, jump: false, attack: false, dash: false, throw: false, parry: false, skillC: false, skillQ: false, shift: false,
    jumpPressed: false, attackPressed: false, dashPressed: false, throwPressed: false, parryPressed: false, skillCPressed: false, skillQPressed: false, upPressed: false, downPressed: false, shiftPressed: false,
  });

  const calcInitialCameraY = (lvl: LevelData, vpHeight: number) => {
    const maxCamY = Math.max(0, lvl.height - vpHeight);
    if (lvl.storyLocation === 'chinoike-jigoku') {
      return Math.min(Math.max(0, lvl.spawn.y - vpHeight * 0.48), maxCamY);
    }
    return Math.min(Math.max(0, lvl.spawn.y - vpHeight * 0.55), maxCamY);
  };

  const cameraXRef = useRef(hasBossCheckpoint ? Math.max(0, 6100 - (viewportWidth || 800) * 0.35) : 0);
  const cameraYRef = useRef(calcInitialCameraY(levelRef.current, viewportHeight));
  const timeRef = useRef(0);
  const scoreRef = useRef(0);
  const coinsCollectedRef = useRef(0);
  const shakeRef = useRef(0);
  const damageFlashRef = useRef(0);
  const statusRef = useRef<GameStatus>('playing');
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const checkpointActivatedRef = useRef(hasBossCheckpoint);
  const respawnPointRef = useRef(hasBossCheckpoint && effectiveLocation === 'chinoike-jigoku' ? { x: 6140, y: 280 - 48 } : levelRef.current.spawn);
  const extraLivesRef = useRef(initialLocation === 'yunami-jigoku' && !hasSeenOpening && !hasBossCheckpoint ? 0 : 1);
  const landingTimerRef = useRef(0);
  const wasAirborneRef = useRef(false);
  const jumpBufferTimerRef = useRef(0);
  const coyoteTimerRef = useRef(0);
  const attackBufferTimerRef = useRef(0);
  const hitStopTimerRef = useRef(0);

  // --- Ninja Combat Expansion: Combo, Finisher, Trophies & Slow-Motion Refs ---
  const hitComboCountRef = useRef(0);
  const hitComboTimerRef = useRef(0); // 300 ticks = 5.0s @ 60fps
  const highestComboRef = useRef(0);
  const finisherReadyRef = useRef(false);
  const slowMotionRef = useRef({ active: false, factor: 1.0, timer: 0 });
  const slowMotionAccumulatorRef = useRef(0);
  const unlockedSkillsRef = useRef<UnlockedSkills>({ bloodSpinSlash: false, crimsonBladeWave: false });
  const yunamiKillsRef = useRef(0);
  const totalBatKillsRef = useRef(0);
  const trophyNotificationRef = useRef<TrophyNotification | null>(null);
  const nextNotificationIdRef = useRef(1);
  const gameTickRef = useRef(0);
  const attackHitRegisteredRef = useRef(false);
  const attackSlashSpawnedRef = useRef(false);
  const cameraZoomRef = useRef(1.0);
  const portalPromptRef = useRef<PortalPromptState | null>(null);
  const portalCooldownRef = useRef<number>(0);
  const storyCinematicRef = useRef<StoryCinematicState>(
    initialLocation === 'yunami-jigoku' && !hasSeenOpening && !hasBossCheckpoint
      ? createOpeningCutsceneState()
      : {
          active: false,
          phase: 'none',
          shot: 'shot1_silence',
          shotIndex: 1,
          dialogueIndex: 0,
          currentLine: null,
          timer: 0,
          cameraFocusX: 6750,
          cameraFocusY: 280,
          cameraZoom: 1.0,
          flashbackActive: false,
          energyTetherActive: false,
          fadeOpacity: 0,
          isComplete: true,
          canAdvance: false,
        }
  );

  const [render, setRender] = useState<RenderState>(() => buildRender());

  function spawnEffect(type: VisualEffect['type'], x: number, y: number, facing: 1 | -1 = 1, maxFrames = 3) {
    effectsRef.current.push({
      id: nextEffectIdRef.current++,
      type,
      x,
      y,
      facing,
      frame: 0,
      maxFrames,
    });
  }

  function buildRender(): RenderState {
    const level = levelRef.current;
    const p = playerRef.current;

    const count = hitComboCountRef.current;
    let comboRank = '連撃';
    if (count >= 20) comboRank = '神速無双';
    else if (count >= 15) comboRank = '血風';
    else if (count >= 10) comboRank = '鬼斬';
    else if (count >= 5) comboRank = '影刃';

    return {
      player: {
        ...p,
        comboCount: count,
        comboTimer: hitComboTimerRef.current,
        comboMaxTimer: 300,
        highestCombo: highestComboRef.current,
        finisherReady: finisherReadyRef.current,
      },
      enemies: enemiesRef.current.map((e) => ({ ...e })),
      coins: level.coins.map((c) => ({ ...c })),
      collectibleShurikens: (level.collectibleShurikens || []).map((s) => ({ ...s })),
      checkpoint: { ...level.checkpoint },
      exit: { ...level.exit },
      platforms: level.platforms,
      spikes: level.spikes,
      bloodPonds: level.bloodPonds || [],
      effects: [...effectsRef.current],
      shurikens: shurikensRef.current.map((s) => ({ ...s })),
      bladeWaves: bladeWavesRef.current.map((bw) => ({ ...bw })),
      shurikenHits: shurikenHitsRef.current.map((h) => ({ ...h })),
      respawnEffect: respawnEffectRef.current ? { ...respawnEffectRef.current } : null,
      hanzoHitEffect: hanzoHitEffectRef.current ? { ...hanzoHitEffectRef.current } : null,
      dashGhosts: dashGhostsRef.current.map((g) => ({ ...g })),
      parryHits: parryHitsRef.current.map((h) => ({ ...h })),
      cameraX: cameraXRef.current,
      cameraY: cameraYRef.current,
      time: timeRef.current,
      score: scoreRef.current,
      coinsCollected: coinsCollectedRef.current,
      totalCoins: level.coins.length,
      shake: shakeRef.current,
      damageFlash: damageFlashRef.current,
      status: statusRef.current,
      storyLocation: storyLocationRef.current,
      levelName: level.name,
      levelJpName: level.jpName,
      levelWidth: level.width,
      levelHeight: level.height,
      extraLives: extraLivesRef.current,
      hanzoDefeated: hanzoDefeatedRef.current,
      hanzoGhosts: hanzoGhostsRef.current.map((g) => ({ ...g })),
      inBossArena: level.storyLocation === 'chinoike-jigoku' && bossIntroTriggeredRef.current && !hanzoDefeatedRef.current,
      bossIntroTimer: bossIntroTimerRef.current,
      bossIntroTriggered: bossIntroTriggeredRef.current,
      hanzoDeathCinematic: hanzoDeathCinematicRef.current.active,
      combo: {
        count,
        timer: hitComboTimerRef.current,
        maxTimer: 300,
        rank: comboRank,
        finisherReady: finisherReadyRef.current,
      },
      slowMotion: { ...slowMotionRef.current },
      trophyNotification: trophyNotificationRef.current ? { ...trophyNotificationRef.current } : null,
      unlockedSkills: { ...unlockedSkillsRef.current },
      yunamiKills: yunamiKillsRef.current,
      batKills: totalBatKillsRef.current,
      cameraZoom: cameraZoomRef.current,
      storyCinematic: storyCinematicRef.current.active ? { ...storyCinematicRef.current } : null,
      portalPrompt: portalPromptRef.current ? { ...portalPromptRef.current } : null,
    };
  }

  const switchStoryLocation = useCallback((location: StoryLocation, carryOverStats: boolean = false) => {
    const prevLocation = storyLocationRef.current;
    storyLocationRef.current = location;
    if (location === 'yunami-jigoku' && !carryOverStats) {
      hanzoDefeatedRef.current = false;
      yunamiKillsRef.current = 0;
      totalBatKillsRef.current = 0;
      unlockedSkillsRef.current = { bloodSpinSlash: false, crimsonBladeWave: false };
      trophyNotificationRef.current = null;
      portalPromptRef.current = null;
      portalCooldownRef.current = 0;
      initOpeningCutscene();
    } else if (location === 'chinoike-jigoku') {
      hanzoDefeatedRef.current = false;
      soundEffects.playBloodRain(0.48);
    } else {
      soundEffects.stopBloodRain();
    }
    const lvl = createLevel(location, false);
    levelRef.current = lvl;
    if (carryOverStats) {
      const p = playerRef.current;
      p.x = lvl.spawn.x;
      p.y = lvl.spawn.y;
      p.vx = 0;
      p.vy = 0;
      p.hp = p.maxHp;
      p.stamina = p.maxStamina;
      p.energy = p.maxEnergy;
      p.anim = 'idle';
      p.facing = 1;
      p.alive = true;
      p.deathTimer = 0;
      p.invuln = 90; // 1.5s safe invulnerability upon portal arrival
    } else {
      playerRef.current = createPlayer(lvl.spawn);
      timeRef.current = 0;
      scoreRef.current = 0;
      coinsCollectedRef.current = 0;
      extraLivesRef.current = location === 'yunami-jigoku' ? 0 : 1;
    }

    // Requirement 4: Yunami Jigoku 10+ Kills Trophy evaluation upon entering Chinoike Jigoku
    if (location === 'chinoike-jigoku' && prevLocation === 'yunami-jigoku') {
      const killsInYunami = yunamiKillsRef.current;
      if (killsInYunami >= 10) {
        unlockedSkillsRef.current.bloodSpinSlash = true;
        soundEffects.playTrophyUnlocked();
        trophyNotificationRef.current = {
          id: nextNotificationIdRef.current++,
          title: 'トロフィー獲得: 獄炎旋風斬 (TROPHY UNLOCKED: BLOOD SPIN SLASH)',
          message: `Mastery of Yunami Jigoku (${killsInYunami}/10 Kills)! You unlocked Blood Spin Slash! Hold [Attack] to execute a 360° sweeping crimson vortex!`,
          type: 'trophy',
          lifetime: 420,
        };
      }
    }

    enemiesRef.current = lvl.enemies.map((e) => ({ ...e }));
    cameraXRef.current = 0;
    const vpHeight = viewportHeightRef.current || 450;
    cameraYRef.current = calcInitialCameraY(lvl, vpHeight);
    effectsRef.current = [];
    shurikensRef.current = [];
    shurikenHitsRef.current = [];
    respawnEffectRef.current = null;
    dashGhostsRef.current = [];
    hanzoGhostsRef.current = [];
    soundEffects.stopRunning();
    soundEffects.stopHanzoIntro();
    soundEffects.stopHanzoBattleMusic();
    soundEffects.stopTitleFireBlaze();
    soundEffects.stopBloodRain();
    titleMusic.play(soundEffects.isMuted(), 0.22);
    bossIntroTimerRef.current = 0;
    bossIntroTriggeredRef.current = false;
    hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };
    parryHitsRef.current = [];
    statusRef.current = 'playing';
    checkpointActivatedRef.current = false;
    respawnPointRef.current = lvl.spawn;
    setRender(buildRender());
  }, []);

  const loadStoryLocation = useCallback((location: StoryLocation) => {
    switchStoryLocation(location, false);
  }, [switchStoryLocation]);

  const reset = useCallback(() => {
    const hasBossCp = (() => {
      try {
        return sessionStorage.getItem('shadow_boss_checkpoint') === 'true';
      } catch (_) {
        return false;
      }
    })();
    const hasSeenOp = (() => {
      try {
        return sessionStorage.getItem('shadow_opening_seen') === 'true';
      } catch (_) {
        return false;
      }
    })();

    if (hasBossCp) {
      storyLocationRef.current = 'chinoike-jigoku';
    }

    hanzoDefeatedRef.current = false;
    const lvl = createLevel(storyLocationRef.current, false);
    if (hasBossCp && storyLocationRef.current === 'chinoike-jigoku') {
      lvl.checkpoint.activated = true;
    }
    levelRef.current = lvl;

    if (hasBossCp && storyLocationRef.current === 'chinoike-jigoku') {
      const p = createPlayer({ x: 6140, y: 280 - 48 });
      p.invuln = 120;
      playerRef.current = p;
      checkpointActivatedRef.current = true;
      respawnPointRef.current = { x: 6140, y: 280 - 48 };
      extraLivesRef.current = 1;
    } else {
      playerRef.current = createPlayer(lvl.spawn);
      checkpointActivatedRef.current = false;
      respawnPointRef.current = lvl.spawn;
      extraLivesRef.current = storyLocationRef.current === 'yunami-jigoku' && !hasSeenOp ? 0 : 1;
    }

    enemiesRef.current = lvl.enemies.map((e) => ({ ...e }));
    const vpHeight = viewportHeightRef.current || 450;
    const vpWidth = viewportWidthRef.current || 800;
    cameraXRef.current = hasBossCp && storyLocationRef.current === 'chinoike-jigoku' ? Math.max(0, 6100 - vpWidth * 0.35) : 0;
    cameraYRef.current = calcInitialCameraY(lvl, vpHeight);
    effectsRef.current = [];
    shurikensRef.current = [];
    bladeWavesRef.current = [];
    shurikenHitsRef.current = [];
    respawnEffectRef.current = null;
    dashGhostsRef.current = [];
    hanzoGhostsRef.current = [];
    soundEffects.stopRunning();
    soundEffects.stopHanzoIntro();
    soundEffects.stopHanzoBattleMusic();
    soundEffects.stopTitleFireBlaze();
    soundEffects.stopBloodRain();
    titleMusic.play(soundEffects.isMuted(), 0.22);
    bossIntroTimerRef.current = 0;
    bossIntroTriggeredRef.current = false;
    hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };
    parryHitsRef.current = [];
    skillHit1Ref.current.clear();
    skillHit2Ref.current.clear();
    skillCooldownRef.current = 0;
    attackHoldTimerRef.current = 0;
    bladeWaveSpawnedRef.current = false;
    downBufferTimerRef.current = 0;
    upBufferTimerRef.current = 0;
    shiftBufferTimerRef.current = 0;
    normalAttackComboCountRef.current = 0;
    normalAttackComboTimerRef.current = 0;
    hitComboCountRef.current = 0;
    hitComboTimerRef.current = 0;
    finisherReadyRef.current = false;
    slowMotionRef.current = { active: false, factor: 1.0, timer: 0 };
    trophyNotificationRef.current = null;
    portalPromptRef.current = null;
    portalCooldownRef.current = 0;

    if (storyLocationRef.current === 'yunami-jigoku' && !hasSeenOp && !hasBossCp) {
      yunamiKillsRef.current = 0;
      totalBatKillsRef.current = 0;
      unlockedSkillsRef.current = { bloodSpinSlash: false, crimsonBladeWave: false };
      initOpeningCutscene();
    } else {
      storyCinematicRef.current = {
        active: false,
        phase: 'none',
        shot: 'shot1_silence',
        shotIndex: 1,
        dialogueIndex: 0,
        currentLine: null,
        timer: 0,
        cameraFocusX: 0,
        cameraFocusY: 0,
        cameraZoom: 1.0,
        flashbackActive: false,
        energyTetherActive: false,
        fadeOpacity: 0,
        isComplete: true,
        canAdvance: false,
      };
    }
    timeRef.current = 0;
    scoreRef.current = 0;
    coinsCollectedRef.current = 0;
    shakeRef.current = 0;
    damageFlashRef.current = 0;
    statusRef.current = 'playing';
    setRender(buildRender());
  }, []);

  // Initialize enemies (only if empty to avoid overwriting boss checkpoint filtering)
  useEffect(() => {
    if (enemiesRef.current.length === 0) {
      enemiesRef.current = levelRef.current.enemies.map((e) => ({ ...e }));
      setRender(buildRender());
    }
  }, []);

  const pause = useCallback(() => {
    if (statusRef.current === 'playing') {
      statusRef.current = 'paused';
      soundEffects.stopRunning();
      soundEffects.pauseBloodRain();
      setRender(buildRender());
    }
  }, []);

  const resume = useCallback(() => {
    if (statusRef.current === 'paused') {
      statusRef.current = 'playing';
      lastTimeRef.current = performance.now();
      if (storyLocationRef.current === 'chinoike-jigoku' && !storyCinematicRef.current.active) {
        soundEffects.playBloodRain(0.48);
      }
      setRender(buildRender());
    }
  }, []);

  // Keyboard input
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const code = e.code;
      const inp = inputRef.current;

      // A / Left Arrow: Move Left
      if (k === 'a' || k === 'arrowleft' || code === 'KeyA' || code === 'ArrowLeft') {
        inp.left = true;
        e.preventDefault();
      }
      // D / Right Arrow: Move Right
      if (k === 'd' || k === 'arrowright' || code === 'KeyD' || code === 'ArrowRight') {
        inp.right = true;
        e.preventDefault();
      }
      // S / Down Arrow: Down (Ground Breaker combo)
      if (k === 's' || k === 'arrowdown' || code === 'KeyS' || code === 'ArrowDown') {
        if (!inp.down) inp.downPressed = true;
        inp.down = true;
        downBufferTimerRef.current = 10;
        e.preventDefault();
      }
      // W / Up Arrow: Up & Jump (Crimson Slash Combo modifier)
      if (k === 'w' || k === 'arrowup' || code === 'KeyW' || code === 'ArrowUp') {
        if (!inp.up) inp.upPressed = true;
        inp.up = true;
        upBufferTimerRef.current = 10;
        if (!inp.jump) {
          inp.jumpPressed = true;
          jumpBufferTimerRef.current = JUMP_BUFFER_TIME;
        }
        inp.jump = true;
        e.preventDefault();
      }
      // Space: Jump
      if (k === ' ' || code === 'Space') {
        if (!inp.jump) {
          inp.jumpPressed = true;
          jumpBufferTimerRef.current = JUMP_BUFFER_TIME;
        }
        inp.jump = true;
        e.preventDefault();
      }
      // J: Attack
      if (k === 'j' || code === 'KeyJ') {
        if (!inp.attack) {
          inp.attackPressed = true;
          attackBufferTimerRef.current = ATTACK_BUFFER_TIME;
        }
        inp.attack = true;
      }
      // Shift: Dash & Shift modifier (Shadow Dash Strike combo)
      if (k === 'shift' || code === 'ShiftLeft' || code === 'ShiftRight') {
        if (!inp.shift) inp.shiftPressed = true;
        inp.shift = true;
        shiftBufferTimerRef.current = 10;
        if (!inp.dash) inp.dashPressed = true;
        inp.dash = true;
        e.preventDefault();
      }
      // K: Dash
      if (k === 'k' || code === 'KeyK') {
        if (!inp.dash) inp.dashPressed = true;
        inp.dash = true;
        e.preventDefault();
      }
      // C: Blood Spin Slash (360 whirlwind)
      if (k === 'c' || code === 'KeyC') {
        if (!inp.skillC) inp.skillCPressed = true;
        inp.skillC = true;
        e.preventDefault();
      }
      // Q: Aerial Kick skill attack (Anti-air attack designed to strike Wyverns)
      if (k === 'q' || code === 'KeyQ') {
        if (!inp.skillQ) inp.skillQPressed = true;
        inp.skillQ = true;
        e.preventDefault();
      }
      // X: Shuriken Throw (exclusive ability key)
      if (k === 'x' || code === 'KeyX') {
        if (!inp.throw) inp.throwPressed = true;
        inp.throw = true;
        e.preventDefault();
      }
      // CTRL: Hold down to defend with stationary sword guard
      if (k === 'control' || code === 'ControlLeft' || code === 'ControlRight') {
        inp.parry = true;
      }
      // Escape / P: Pause
      if (k === 'escape' || k === 'p' || code === 'Escape' || code === 'KeyP') {
        if (statusRef.current === 'playing') pause();
        else if (statusRef.current === 'paused') resume();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const code = e.code;
      const inp = inputRef.current;

      if (k === 'a' || k === 'arrowleft' || code === 'KeyA' || code === 'ArrowLeft') {
        inp.left = false;
      }
      if (k === 'd' || k === 'arrowright' || code === 'KeyD' || code === 'ArrowRight') {
        inp.right = false;
      }
      if (k === 's' || k === 'arrowdown' || code === 'KeyS' || code === 'ArrowDown') {
        inp.down = false;
      }
      if (k === 'w' || k === 'arrowup' || code === 'KeyW' || code === 'ArrowUp') {
        inp.up = false;
        inp.jump = false;
      }
      if (k === ' ' || code === 'Space') {
        inp.jump = false;
      }
      if (k === 'j' || code === 'KeyJ') {
        inp.attack = false;
      }
      if (k === 'shift' || code === 'ShiftLeft' || code === 'ShiftRight') {
        inp.shift = false;
        inp.dash = false;
      }
      if (k === 'k' || code === 'KeyK') {
        inp.dash = false;
      }
      if (k === 'c' || code === 'KeyC') {
        inp.skillC = false;
      }
      if (k === 'q' || code === 'KeyQ') {
        inp.skillQ = false;
      }
      if (k === 'x' || code === 'KeyX') {
        inp.throw = false;
      }
      if (k === 'control' || code === 'ControlLeft' || code === 'ControlRight') {
        inp.parry = false;
      }
    };
    const mouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.closest('button') || target.closest('nav') || target.closest('a') || target.closest('input'))) return;

      if (e.button === 0) {
        // Left click: Katana Attack
        const inp = inputRef.current;
        if (!inp.attack) {
          inp.attackPressed = true;
          attackBufferTimerRef.current = ATTACK_BUFFER_TIME;
        }
        inp.attack = true;
      } else if (e.button === 2) {
        // Right click: Shuriken Throw
        e.preventDefault();
        const inp = inputRef.current;
        if (!inp.throw) inp.throwPressed = true;
        inp.throw = true;
      }
    };
    const mouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        inputRef.current.attack = false;
      } else if (e.button === 2) {
        inputRef.current.throw = false;
      }
    };
    const contextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest('input') && !target?.closest('textarea')) {
        e.preventDefault();
      }
    };

    (window as any).__gameEngine = {
      loadStoryLocation: (loc: StoryLocation) => loadStoryLocation(loc),
      teleport: (x: number, y: number) => {
        playerRef.current.x = x;
        playerRef.current.y = y;
        playerRef.current.vx = 0;
        playerRef.current.vy = 0;
      },
      triggerBossIntro: () => {
        bossIntroTriggeredRef.current = true;
        bossIntroTimerRef.current = 280;
        titleMusic.pause();
        soundEffects.playHanzoIntro();
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
        if (hanzo) {
          hanzo.state = 'idle';
          hanzo.vx = 0;
          hanzo.vy = 0;
          hanzo.attackTimer = 0;
          hanzo.comboActive = false;
          hanzo.comboStep = undefined;
          hanzo.jumpPhase = undefined;
          hanzo.jumpFrame = undefined;
          hanzo.jumpTimer = 0;
          hanzo.jumpCooldown = 60;
          hanzo.facing = -1;
        }
      },
      getState: () => ({
        location: storyLocationRef.current,
        player: playerRef.current,
        enemies: enemiesRef.current,
      }),
      getHanzo: () => {
        return enemiesRef.current.find((e) => e.type === 'hanzo');
      },
      damageHanzo: (amount: number = 1) => {
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
        if (hanzo) {
          for (let i = 0; i < amount; i++) {
            triggerHanzoHit(hanzo, playerRef.current.facing);
          }
        }
      },
      killHanzo: () => {
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
        if (hanzo) {
          hanzo.hp = 1;
          triggerHanzoHit(hanzo, playerRef.current.facing);
        }
      },
      startStoryCinematic: () => {
        startStoryCinematic();
      },
      advanceStoryCinematic: () => {
        advanceStoryCinematic();
      },
      skipStoryCinematic: () => {
        skipStoryCinematic();
      },
      skipBossIntro: () => {
        if (bossIntroTimerRef.current > 0) {
          bossIntroTimerRef.current = 1;
        }
      },
      selectStoryChoice: (choice: StoryChoice) => {
        selectStoryChoice(choice);
      },
      navigateStoryChoice: (dir: 1 | -1) => {
        navigateStoryChoice(dir);
      },
      resetStoryFlags: () => {
        resetStoryFlags();
      },
      getCinematicState: () => ({
        deathCinematic: hanzoDeathCinematicRef.current.active,
        endingTimer: hanzoDeathCinematicRef.current.endingTimer,
        hanzoDefeated: hanzoDefeatedRef.current,
      }),
      triggerSkill: (skill: NinjaSkill) => {
        const p = playerRef.current;
        p.activeSkill = skill;
        p.skillTimer = 30;
        p.skillFrame = 0;
        p.anim = skill;
        p.attackTimer = 0;
        p.isDoubleJumping = false;
        p.doubleJumpTimer = 0;
        skillHit1Ref.current.clear();
        skillHit2Ref.current.clear();
      },
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('mousedown', mouseDown);
    window.addEventListener('mouseup', mouseUp);
    window.addEventListener('contextmenu', contextMenu);
    return () => {
      delete (window as any).__gameEngine;
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('mousedown', mouseDown);
      window.removeEventListener('mouseup', mouseUp);
      window.removeEventListener('contextmenu', contextMenu);
    };
  }, [pause, resume, loadStoryLocation]);

  // Touch input setters
  const setInput = useCallback((key: keyof InputState, val: boolean) => {
    const inp = inputRef.current;
    if (key === 'jump' && val && !inp.jump) {
      inp.jumpPressed = true;
      jumpBufferTimerRef.current = JUMP_BUFFER_TIME;
    }
    if (key === 'attack' && val && !inp.attack) {
      inp.attackPressed = true;
      attackBufferTimerRef.current = ATTACK_BUFFER_TIME;
    }
    if (key === 'dash' && val && !inp.dash) inp.dashPressed = true;
    if (key === 'throw' && val && !inp.throw) inp.throwPressed = true;
    if (key === 'parry' && val && !inp.parry) inp.parryPressed = true;
    if (key === 'skillC' && val && !inp.skillC) inp.skillCPressed = true;
    if (key === 'skillQ' && val && !inp.skillQ) inp.skillQPressed = true;
    if (key === 'up' && val && !inp.up) { inp.upPressed = true; upBufferTimerRef.current = 10; }
    if (key === 'down' && val && !inp.down) { inp.downPressed = true; downBufferTimerRef.current = 10; }
    if (key === 'shift' && val && !inp.shift) { inp.shiftPressed = true; shiftBufferTimerRef.current = 10; }
    (inp[key] as unknown as boolean) = val;
  }, []);

  // Game loop with rock-solid fixed-timestep accumulator for silky smooth 60fps
  useEffect(() => {
    preloadAllGameAssets();
    if (storyLocationRef.current === 'yunami-jigoku' && !storyCinematicRef.current.isComplete) {
      initOpeningCutscene();
    }

    let accumulator = 0;
    const TIME_STEP = 1000 / 60; // Exact 16.6667ms per physics frame

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);
      if (statusRef.current !== 'playing' || portalPromptRef.current?.open) {
        lastTimeRef.current = now;
        accumulator = 0;
        return;
      }
      let delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Prevent spiral of death on background tab or performance hitch (max 100ms)
      if (delta > 100) delta = 100;
      if (slowMotionRef.current.active) {
        delta *= slowMotionRef.current.factor;
      }
      accumulator += delta;

      let stepsRan = 0;
      while (accumulator >= TIME_STEP && stepsRan < 4) {
        step();
        accumulator -= TIME_STEP;
        stepsRan++;
      }

      if (stepsRan > 0) {
        setRender(buildRender());
      }
    };
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function initOpeningCutscene() {
    try {
      if (sessionStorage.getItem('shadow_opening_seen') === 'true') {
        extraLivesRef.current = 1;
        return;
      }
    } catch (_) {}

    const p = playerRef.current;
    p.x = 180;
    p.y = 552;
    p.vx = 0;
    p.vy = 0;
    p.facing = 1;
    p.anim = 'idle';
    p.invuln = 999999;

    extraLivesRef.current = 0;
    cameraXRef.current = 0;
    const vpHeight = viewportHeightRef.current || 450;
    cameraYRef.current = calcInitialCameraY(levelRef.current, vpHeight);

    storyCinematicRef.current = createOpeningCutsceneState();
  }

  function startFinalCutscene(hanzo: Enemy) {
    soundEffects.stopHanzoBattleMusic();
    soundEffects.stopHanzoIntro();
    soundEffects.stopBloodRain();
    soundEffects.playCinematicAmbientDrone();

    const p = playerRef.current;
    p.activeSkill = undefined;
    p.skillTimer = 0;
    p.attackTimer = 0;
    p.dashTimer = 0;
    p.throwTimer = 0;
    p.isDefending = false;
    p.vx = 0;
    p.anim = 'idle';
    p.invuln = 999999;

    hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };

    hanzo.vx = 0;
    hanzo.vy = 0;
    hanzo.state = 'death';
    hanzo.deathFrame = 3; // death_hanzo_4 HOLD
    hanzo.attackCooldown = 999999;
    hanzo.telegraph = 'none';

    // Position player within cinematic combat distance (52px) facing Hanzo
    p.facing = p.x <= hanzo.x ? 1 : -1;
    p.x = p.facing === 1 ? hanzo.x - 52 : hanzo.x + 52;
    p.y = 280 - p.h;
    p.onGround = true;
    hanzo.facing = p.facing === 1 ? -1 : 1;

    const focusMidX = (p.x + hanzo.x) / 2;
    const focusMidY = (p.y + hanzo.y) / 2;

    storyCinematicRef.current = {
      active: true,
      phase: 'final_dialogue',
      shot: 'shot3_dialogue1',
      shotIndex: 1,
      dialogueIndex: 0,
      currentLine: FINAL_CUTSCENE_DIALOGUES[0],
      timer: 0,
      cameraFocusX: focusMidX,
      cameraFocusY: focusMidY,
      cameraZoom: 1.25,
      flashbackActive: false,
      energyTetherActive: false,
      fadeOpacity: 0,
      isComplete: false,
      canAdvance: true,
      revealedIdentity: false,
      selectedChoiceIndex: 0,
    };
  }

  function startStoryCinematic() {
    const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
    if (hanzo) {
      startFinalCutscene(hanzo);
    }
  }

  function advanceStoryCinematic() {
    const sc = storyCinematicRef.current;
    if (!sc.active || !sc.canAdvance) return;

    if (sc.phase === 'opening_dialogue') {
      if (sc.dialogueIndex + 1 < OPENING_CUTSCENE_DIALOGUES.length) {
        sc.dialogueIndex += 1;
        sc.currentLine = OPENING_CUTSCENE_DIALOGUES[sc.dialogueIndex];
      } else {
        sc.phase = 'opening_spirit_transfer';
        sc.timer = 0;
        sc.canAdvance = false;
        sc.currentLine = null;
        sc.spiritOrb = {
          active: true,
          x: (sc.unknownActor?.x || 340) - 15,
          y: 525,
          targetX: 195,
          targetY: 525,
          progress: 0,
        };
        soundEffects.playMemoryFlashbackChime();
      }
    } else if (sc.phase === 'final_dialogue') {
      if (sc.dialogueIndex + 1 < FINAL_CUTSCENE_DIALOGUES.length) {
        sc.dialogueIndex += 1;
        sc.currentLine = FINAL_CUTSCENE_DIALOGUES[sc.dialogueIndex];

        // Reveal line (index 6): UNKNOWN changes to HANZO — SHADOW!
        if (sc.dialogueIndex === 6) {
          sc.revealedIdentity = true;
          shakeRef.current = 8;
          soundEffects.playMemoryFlashbackChime();
          soundEffects.playTensionPulse();
        }
      } else {
        // Dialogue complete -> Transition to Choice!
        sc.phase = 'choice_waiting';
        sc.canAdvance = false;
        sc.selectedChoiceIndex = 0;
      }
    }
  }

  function navigateStoryChoice(dir: 1 | -1) {
    const sc = storyCinematicRef.current;
    if (sc.phase !== 'choice_waiting') return;
    const current = sc.selectedChoiceIndex ?? 0;
    sc.selectedChoiceIndex = current === 0 ? 1 : 0;
    soundEffects.playSelect();
  }

  function selectStoryChoice(choice: StoryChoice) {
    const sc = storyCinematicRef.current;
    if (sc.phase !== 'choice_waiting') return;
    sc.choice = choice;
    soundEffects.playConfirm();

    if (choice === 'kill') {
      sc.phase = 'hanzo_execution_pending';
      sc.canAdvance = false;
      hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };
      const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
      if (hanzo) {
        const p = playerRef.current;
        p.facing = p.x <= hanzo.x ? 1 : -1;
        p.x = p.facing === 1 ? hanzo.x - 52 : hanzo.x + 52;
        p.y = 280 - p.h;
        p.onGround = true;
        p.vx = 0;
        p.vy = 0;
        p.anim = 'idle';
        hanzo.facing = p.facing === 1 ? -1 : 1;
        hanzo.deathFrame = 3; // death_hanzo_4
      }
    } else {
      sc.phase = 'hanzo_spared';
      sc.timer = 0;
      sc.canAdvance = false;
      soundEffects.playVictory();
    }
  }

  function triggerHanzoExecutionBlow(e: Enemy, hitFacing: 1 | -1) {
    const sc = storyCinematicRef.current;
    if (sc.phase !== 'hanzo_execution_pending') return;

    sc.phase = 'hanzo_death_continue';
    sc.executionHitConnected = true;
    hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };

    soundEffects.playHit();
    soundEffects.playSlice();
    soundEffects.playTensionPulse();

    shakeRef.current = Math.max(shakeRef.current, 14);
    damageFlashRef.current = 0.6;
    spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, hitFacing, 4);

    // Resume death progression starting from frame 4 (death_hanzo_5)
    e.deadTimer = 24;
  }

  function skipStoryCinematic() {
    const sc = storyCinematicRef.current;
    if (!sc.active) return;

    if (sc.phase.startsWith('opening_')) {
      sc.phase = 'none';
      sc.active = false;
      sc.isComplete = true;
      extraLivesRef.current = 1;
      try {
        sessionStorage.setItem('shadow_opening_seen', 'true');
      } catch (_) {}
      const p = playerRef.current;
      p.invuln = 120;
      titleMusic.play(soundEffects.isMuted(), 0.22);
      // Stay in Yunami Jigoku! Player plays through Yunami Jigoku naturally.
    } else if (sc.phase === 'dlc_teaser') {
      sc.active = false;
      statusRef.current = 'won';
    } else {
      sc.phase = 'choice_waiting';
      sc.selectedChoiceIndex = 0;
      sc.revealedIdentity = true;
    }
  }

  function skipBossIntro() {
    if (bossIntroTimerRef.current > 0) {
      soundEffects.stopHanzoIntro();
      bossIntroTimerRef.current = 1;
    }
  }

  function updateStoryCinematic() {
    const sc = storyCinematicRef.current;
    if (!sc.active) return;

    const p = playerRef.current;

    // OPENING CUTSCENE
    if (sc.phase === 'opening_fade_in') {
      p.vx = 0;
      p.anim = 'idle';
      sc.fadeOpacity = Math.max(0, sc.fadeOpacity - 0.025);
      sc.timer = Math.max(0, sc.timer - 1);

      // UNKNOWN arrives / comes into view calmly in idle stance opposite Hanzo
      if (sc.unknownActor) {
        sc.unknownActor.anim = 'idle';
        sc.unknownActor.facing = -1;
        sc.unknownActor.opacity = Math.min(1.0, (60 - sc.timer) / 20);
        sc.unknownActor.x = Math.max(340, sc.unknownActor.x - 0.7);
      }

      if (sc.fadeOpacity <= 0 && sc.timer <= 0) {
        sc.phase = 'opening_dialogue';
        sc.canAdvance = true;
        sc.currentLine = OPENING_CUTSCENE_DIALOGUES[0];
        sc.dialogueIndex = 0;
        if (sc.unknownActor) {
          sc.unknownActor.anim = 'idle';
          sc.unknownActor.x = 340;
          sc.unknownActor.opacity = 1;
        }
      }
      return;
    }

    if (sc.phase === 'opening_dialogue') {
      p.vx = 0;
      p.anim = 'idle';
      if (sc.unknownActor) {
        sc.unknownActor.anim = 'idle';
      }
      return;
    }

    if (sc.phase === 'opening_spirit_transfer') {
      p.vx = 0;
      p.anim = 'idle';
      if (sc.unknownActor) {
        sc.unknownActor.anim = 'idle';
      }
      sc.timer += 1;
      if (sc.spiritOrb) {
        sc.spiritOrb.active = true;
        sc.spiritOrb.progress = Math.min(1.0, sc.timer / 85);
        const ease = 1 - Math.pow(1 - sc.spiritOrb.progress, 3);
        sc.spiritOrb.x = 330 + (194 - 330) * ease;
        sc.spiritOrb.y = 535 + Math.sin(sc.spiritOrb.progress * Math.PI) * -22;

        if (sc.timer === 65) {
          spawnEffect('impact', 194, 550, 1, 4);
          shakeRef.current = Math.max(shakeRef.current, 8);
          soundEffects.playTensionPulse();
          soundEffects.playSecretUnlocked();
          // Hanzo absorbs the spirit soul! Soul becomes 1!
          extraLivesRef.current = 1;
        }
      }

      if (sc.timer >= 105) {
        if (sc.spiritOrb) sc.spiritOrb.active = false;
        sc.phase = 'opening_unknown_exit';
        sc.timer = 0;
      }
      return;
    }

    if (sc.phase === 'opening_unknown_exit') {
      sc.timer += 1;

      // Player Ninja stays solemnly in IDLE stance at x = 180 in Yunami Jigoku
      p.anim = 'idle';
      p.vx = 0;
      p.vy = 0;
      p.facing = 1;
      p.x = 180;
      p.y = 552;

      // UNKNOWN ("Hanzo guard"):
      // 1. Performs signature teleport strike frames with ethereal purple glow
      // 2. Dashes into the Torii Gate of Chinoike Jigoku at x = 490 with purple Hanzo ghosts!
      if (sc.unknownActor) {
        sc.unknownActor.facing = 1;

        if (sc.timer <= 22) {
          // TELEPORT SEQUENCE: Unknown performs teleport animation with full purple frames
          sc.unknownActor.anim = 'teleport';
          if (sc.timer === 1) {
            soundEffects.playHanzoTeleport();
            spawnEffect('impact', sc.unknownActor.x + 18, sc.unknownActor.y + 28, 1, 3);
          }
          if (sc.timer % 4 === 0) {
            hanzoGhostsRef.current.push({
              id: nextHanzoGhostIdRef.current++,
              x: sc.unknownActor.x,
              y: sc.unknownActor.y,
              facing: 1,
              state: 'teleport_attack',
              alpha: 0.75,
            });
          }
        } else if (sc.timer <= 28) {
          // Brief dramatic ready pose before dash
          sc.unknownActor.anim = 'idle';
        } else {
          // DASH SEQUENCE: Hanzo dashes smoothly towards and into the Torii Gate
          sc.unknownActor.anim = 'dash';
          sc.unknownActor.x += 6.5;

          if (sc.timer === 29) {
            soundEffects.playDash();
            spawnEffect('dust', sc.unknownActor.x, 590, -1, 2);
          }

          if (sc.timer % 3 === 0) {
            hanzoGhostsRef.current.push({
              id: nextHanzoGhostIdRef.current++,
              x: sc.unknownActor.x,
              y: sc.unknownActor.y,
              facing: 1,
              state: 'dash',
              alpha: 0.75,
            });
          }

          // When UNKNOWN reaches the Torii Gate (x >= 490), enter portal and vanish!
          if (sc.unknownActor.x >= 490) {
            sc.unknownActor.opacity = Math.max(0, sc.unknownActor.opacity - 0.22);
            if (!sc.unknownActor.hasEnteredGate) {
              sc.unknownActor.hasEnteredGate = true;
              soundEffects.playEtherealTetherPulse();
              spawnEffect('impact', 500, 540, 1, 4);
              shakeRef.current = Math.max(shakeRef.current, 8);
            }
          }
        }
      }

      // Cutscene concludes: Torii Gate fades away, Player ninja remains in Yunami Jigoku with full control!
      if (sc.timer >= 85) {
        sc.phase = 'none';
        sc.active = false;
        sc.isComplete = true;
        extraLivesRef.current = 1;
        try {
          sessionStorage.setItem('shadow_opening_seen', 'true');
        } catch (_) {}
        p.invuln = 120;
        titleMusic.play(soundEffects.isMuted(), 0.22);
      }
      return;
    }

    // FINALE CUTSCENE
    const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');

    // Freeze all non-boss enemies and protect player
    if (sc.phase !== 'hanzo_execution_pending' && sc.phase !== 'hanzo_death_continue') {
      p.invuln = 999999;
      p.vx = 0;
      p.anim = 'idle';
    } else {
      p.invuln = 999999;
    }

    for (const enemy of enemiesRef.current) {
      if (enemy.type !== 'hanzo') {
        enemy.vx = 0;
        enemy.vy = 0;
        enemy.attackCooldown = 999999;
      }
    }

    if (sc.phase === 'final_dialogue' || sc.phase === 'choice_waiting' || sc.phase === 'hanzo_execution_pending') {
      return;
    }

    if (sc.phase === 'hanzo_dead') {
      sc.timer += 1;
      if (sc.timer >= 60) {
        saveStoryFlags({
          hanzo_guardian_reveal_complete: true,
          hanzo_choice_made: 'kill',
        });
        sc.phase = 'dlc_teaser';
        sc.timer = 0;
      }
      return;
    }

    if (sc.phase === 'hanzo_spared') {
      if (!hanzo) return;
      sc.timer += 1;
      hanzo.state = 'defeated';
      hanzo.deathFrame = undefined;
      if (sc.timer >= 45) {
        sc.phase = 'hanzo_escape';
        sc.timer = 0;
        hanzo.facing = 1;
      }
      return;
    }

    if (sc.phase === 'hanzo_escape') {
      if (!hanzo) return;
      sc.timer += 1;
      hanzo.facing = 1;
      if (hanzo.x < 7150) {
        hanzo.state = 'patrol';
        hanzo.vx = 4.2;
        hanzo.x += hanzo.vx;
      } else if (hanzo.x < 7350) {
        hanzo.state = 'dash';
        hanzo.vx = 9.0;
        hanzo.x += hanzo.vx;
        if (sc.timer % 8 === 0) {
          soundEffects.playDash();
        }
      } else {
        hanzo.alive = false;
        hanzo.state = 'dead';
        soundEffects.playEtherealTetherPulse();
        spawnEffect('impact', 7380, 240, 1, 5);
        if (levelRef.current.exit) {
          levelRef.current.exit.locked = true;
        }
        saveStoryFlags({
          hanzo_guardian_reveal_complete: true,
          hanzo_choice_made: 'spare',
        });
        sc.phase = 'dlc_teaser';
        sc.timer = 0;
      }
      return;
    }

    if (sc.phase === 'dlc_teaser') {
      sc.timer += 1;
      return;
    }
  }

  function step() {
    if (statusRef.current === 'mission_complete' || statusRef.current === 'won') {
      soundEffects.stopRunning();
      decayEffects();
      return;
    }
    const level = levelRef.current;
    const p = playerRef.current;
    const inp = inputRef.current;

    // Timer & Game Loop Tick Counter
    timeRef.current += 1 / 60;
    gameTickRef.current += 1;

    // Stamina automatic recharge: 0 to 100 in 5.0 seconds
    if (p.stamina < p.maxStamina) {
      p.stamina = Math.min(p.maxStamina, p.stamina + STAMINA_RECHARGE_RATE);
    }

    if (!p.alive) {
      soundEffects.stopRunning();
      p.deathTimer += 1;
      // Allow death animation to play (~50 frames), then check extra spirit/life
      if (p.deathTimer > 50) {
        if (extraLivesRef.current > 0) {
          // One more sprite (extra spirit life) available: RESPAWN AT CHECKPOINT!
          extraLivesRef.current -= 1;
          const spawnLoc = respawnPointRef.current;
          p.x = spawnLoc.x;
          p.y = spawnLoc.y;
          p.vx = 0;
          p.vy = 0;
          p.hp = p.maxHp;
          p.energy = p.maxEnergy;
          p.stamina = p.maxStamina;
          p.shurikenCount = Math.max(p.shurikenCount, 3);
          p.alive = true;
          p.deathTimer = 0;
          p.invuln = 120; // 2 seconds of safety invulnerability
          p.anim = 'idle';

          // Reset Hanzo boss encounter and restore non-boss enemies if respawning
          if (level.storyLocation === 'chinoike-jigoku') {
            const hanzoRef = enemiesRef.current.find((e) => e.type === 'hanzo') ||
              levelRef.current.enemies.find((e) => e.type === 'hanzo');
            const freshEnemies = levelRef.current.enemies
              .filter((e) => e.type !== 'hanzo')
              .map((e) => ({ ...e }));
            const baseHanzo = hanzoRef ? { ...hanzoRef } : {
              id: 999,
              type: 'hanzo' as const,
              x: 6750,
              y: 280 - 58,
              w: 36,
              h: 58,
              vx: 0,
              vy: 0,
              onGround: true,
              alive: true,
              hp: 70,
              maxHp: 70,
              patrolMin: 6450,
              patrolMax: 7050,
              facing: -1 as const,
              state: 'idle' as const,
              attackCooldown: 0,
              attackTimer: 0,
              jumpCooldown: 0,
              hurtCooldown: 0,
              deadTimer: 0,
              spawnTimer: 0,
              respawnTimer: 0,
              spawnX: 6750,
              spawnY: 280 - 58,
              dashCooldown: 0,
              spinCooldown: 0,
              risingCooldown: 0,
              teleportCooldown: 120,
              teleportTimer: 0,
              hitConnected: false,
              telegraph: 'none' as const,
              telegraphTimer: 0,
              telegraphMaxTimer: 0,
              turnCooldown: 0,
              guardCooldown: 0,
              guardTimer: 0,
              lungeCooldown: 0,
              divePhase: 'hover' as const,
              diveTimer: 0,
            };
            enemiesRef.current = [...freshEnemies, baseHanzo];
          }
          const hanzoEnemy = enemiesRef.current.find((e) => e.type === 'hanzo');
          if (hanzoEnemy) {
            hanzoEnemy.hp = hanzoEnemy.maxHp;
            hanzoEnemy.alive = true;
            hanzoEnemy.state = 'idle';
            hanzoEnemy.isEnraged = false;
            hanzoEnemy.comboActive = false;
            hanzoEnemy.comboStep = undefined;
            hanzoEnemy.jumpPhase = undefined;
            hanzoEnemy.jumpFrame = undefined;
            hanzoEnemy.jumpTimer = 0;
            hanzoEnemy.jumpCooldown = 60;
            hanzoEnemy.damageFrame = undefined;
            hanzoEnemy.deathFrame = undefined;
            hanzoEnemy.deadTimer = 0;
            hanzoEnemy.x = 6750;
            hanzoEnemy.y = 280 - 58;
            bossIntroTriggeredRef.current = false;
            bossIntroTimerRef.current = 0;
          }
          soundEffects.stopHanzoIntro();
          soundEffects.stopHanzoBattleMusic();
          titleMusic.play(soundEffects.isMuted(), 0.22);
          hanzoDeathCinematicRef.current = { active: false, timer: 0, endingTimer: 0 };

          // Snap camera to respawn point using dynamic viewport width & height
          const actualVpWidth = viewportWidthRef.current || 800;
          const actualVpHeight = viewportHeightRef.current || 450;
          const maxCameraX = Math.max(0, level.width - actualVpWidth);
          const maxCameraY = Math.max(0, level.height - actualVpHeight);
          cameraXRef.current = Math.min(Math.max(0, p.x - actualVpWidth * 0.475), maxCameraX);
          if (level.storyLocation === 'chinoike-jigoku') {
            cameraYRef.current = Math.min(Math.max(0, p.y - actualVpHeight * 0.48), maxCameraY);
          } else {
            cameraYRef.current = Math.min(Math.max(0, p.y - actualVpHeight * 0.55), maxCameraY);
          }

          damageFlashRef.current = 0.5;
          shakeRef.current = 8;
          soundEffects.playCheckpoint();
          spawnEffect('impact', p.x + p.w / 2 - 32, p.y + p.h / 2 - 32, 1, 3);

          // Trigger authentic Ninja Respawn effect after Death GIF
          respawnEffectRef.current = {
            id: nextRespawnEffectIdRef.current++,
            x: p.x + p.w / 2 - 80,
            y: p.y + p.h - 148,
            lifetime: 50, // 50 frames (~830ms duration of the 10-frame GIF)
            maxLifetime: 50,
          };
        } else {
          // No more spirits remaining: GAME OVER!
          statusRef.current = 'dead';
          titleMusic.pause();
        }
      }
      updateEnemies();
      decayEffects();
      return;
    }

    // Manage Cinematic Boss Death ending transition (smooth camera / control restoration)
    if (hanzoDeathCinematicRef.current.active && hanzoDeathCinematicRef.current.endingTimer > 0) {
      hanzoDeathCinematicRef.current.endingTimer -= 1;
      if (hanzoDeathCinematicRef.current.endingTimer <= 0) {
        hanzoDeathCinematicRef.current.active = false;
      }
    }

    // Story Chapter Cutscene Tick Bypass
    // Note: During 'hanzo_execution_pending' and 'hanzo_death_continue', the gameplay loop
    // MUST run so the player can physically walk, attack, execute Hanzo, and watch the death animation!
    if (storyCinematicRef.current.active) {
      if (
        storyCinematicRef.current.phase !== 'hanzo_execution_pending' &&
        storyCinematicRef.current.phase !== 'hanzo_death_continue'
      ) {
        updateStoryCinematic();
        decayEffects();
        updateCamera();
        setRender(buildRender());
        return;
      }
      // For execution pending & death continue: update cinematic logic (player protection, timers)
      // but let player physics, inputs, attacks, and enemy updates proceed!
      updateStoryCinematic();
    }

    const inDeathCinematic = hanzoDeathCinematicRef.current.active && !storyCinematicRef.current.active;
    const inBossIntro = bossIntroTimerRef.current > 0;
    if (inDeathCinematic || inBossIntro) {
      // Temporarily disable player attacks and abilities during cinematic sequences
      inp.attackPressed = false;
      inp.skillCPressed = false;
      inp.skillC = false;
      inp.skillQPressed = false;
      inp.skillQ = false;
      inp.throwPressed = false;
      inp.dashPressed = false;
      if (inDeathCinematic) {
        inp.jumpPressed = false;
        inp.parryPressed = false;
        inp.attack = false;
        inp.skillC = false;
        inp.skillQ = false;
        inp.jump = false;
        inp.dash = false;
        inp.throw = false;
        inp.parry = false;
        inp.left = false;
        inp.right = false;

        p.vx *= 0.8;
        if (Math.abs(p.vx) < 0.1) p.vx = 0;
        p.dashTimer = 0;
        p.attackTimer = 0;
        p.activeSkill = undefined;
        p.skillTimer = 0;
        p.skillFrame = 0;
        p.attackHoldTimer = 0;
        p.throwTimer = 0;
        p.isDefending = false;
        p.parryAnimTimer = 0;
      }
    }

    // Hit-stop / freeze-frame effect for impactful melee strike feedback
    if (hitStopTimerRef.current > 0) {
      hitStopTimerRef.current -= 1;
      decayEffects();
      updateCamera();
      return;
    }

    // --- Input Buffers & Attack Hold Tracking ---
    if (downBufferTimerRef.current > 0) downBufferTimerRef.current -= 1;
    if (upBufferTimerRef.current > 0) upBufferTimerRef.current -= 1;
    if (shiftBufferTimerRef.current > 0) shiftBufferTimerRef.current -= 1;
    if (skillCooldownRef.current > 0) skillCooldownRef.current -= 1;
    if (attackBufferTimerRef.current > 0) attackBufferTimerRef.current -= 1;
    if (jumpBufferTimerRef.current > 0) jumpBufferTimerRef.current -= 1;
    if (coyoteTimerRef.current > 0) coyoteTimerRef.current -= 1;

    if (inp.attack && !p.activeSkill && p.alive && !inDeathCinematic && !inBossIntro) {
      attackHoldTimerRef.current += 1;
      p.attackHoldTimer = attackHoldTimerRef.current;
    } else if (!inp.attack && p.activeSkill !== 'blood_spin_slash') {
      attackHoldTimerRef.current = 0;
      p.attackHoldTimer = 0;
    }

    // --- Cancel Dash into Parry if CTRL is pressed ---
    if (!inDeathCinematic && inp.parry && p.dashTimer > 0) {
      p.dashTimer = 0;
    }

    // --- Attack Recovery Cancellation into Dash / Guard / Jump / Next Combo Strike ---
    const inAttackRecovery = p.attackTimer > 0 && p.attackTimer <= ATTACK_RECOVERY_CANCEL_WINDOW;
    const inSkillRecovery = Boolean(p.activeSkill && (p.skillTimer || 0) <= 5);

    if (inAttackRecovery || inSkillRecovery) {
      if (inp.dashPressed && p.dashCooldown <= 0 && p.stamina >= DASH_STAMINA_COST) {
        p.attackTimer = 0;
        p.activeSkill = undefined;
        p.skillTimer = 0;
        p.skillFrame = 0;
      } else if (inp.parry) {
        p.attackTimer = 0;
        p.activeSkill = undefined;
        p.skillTimer = 0;
        p.skillFrame = 0;
      } else if (jumpBufferTimerRef.current > 0 && (p.onGround || coyoteTimerRef.current > 0)) {
        p.attackTimer = 0;
        p.activeSkill = undefined;
        p.skillTimer = 0;
        p.skillFrame = 0;
      } else if (inAttackRecovery && attackBufferTimerRef.current > 0) {
        p.attackTimer = 0;
        p.attackCooldown = 0;
      }
    }

    // --- Combo Window Timer Decrement (Normal Attack 1-2-3 String) ---
    if (normalAttackComboTimerRef.current > 0) {
      normalAttackComboTimerRef.current -= 1;
    } else {
      normalAttackComboCountRef.current = 0;
    }

    // --- Ninja 5-Second Hit Combo Gauge (Decays after 5 seconds without fighting) ---
    if (hitComboTimerRef.current > 0) {
      hitComboTimerRef.current -= 1;
      if (hitComboTimerRef.current <= 0) {
        hitComboCountRef.current = 0;
        finisherReadyRef.current = false;
      }
    }

    // --- Slow Motion Duration Timer ---
    if (slowMotionRef.current.active) {
      slowMotionRef.current.timer -= 1;
      if (slowMotionRef.current.timer <= 0) {
        slowMotionRef.current.active = false;
        slowMotionRef.current.factor = 1.0;
      }
    }

    // --- Trophy Notification Lifetime Timer ---
    if (trophyNotificationRef.current) {
      trophyNotificationRef.current.lifetime -= 1;
      if (trophyNotificationRef.current.lifetime <= 0) {
        trophyNotificationRef.current = null;
      }
    }

    if (portalCooldownRef.current > 0) {
      portalCooldownRef.current -= 1;
    }

    // --- Defense Check (Hold CTRL to defend with stationary sword, works on ground and air) ---
    const canDefend =
      !inDeathCinematic &&
      p.alive &&
      p.attackTimer <= 0 &&
      !p.activeSkill &&
      p.throwTimer <= 0 &&
      p.anim !== 'hurt' &&
      p.anim !== 'dead';

    p.isDefending = Boolean(inp.parry && canDefend);

    // --- Action Eligibility: Player cannot act if hurt, dead, throwing, or executing an active skill ---
    const canAct =
      !inDeathCinematic &&
      !inBossIntro &&
      p.alive &&
      !p.activeSkill &&
      p.dashTimer <= 0 &&
      p.throwTimer <= 0 &&
      p.anim !== 'hurt' &&
      p.anim !== 'dead' &&
      skillCooldownRef.current <= 0;

    // Execution pending blow interceptor: any attack action delivers execution blow immediately
    if (storyCinematicRef.current.phase === 'hanzo_execution_pending') {
      if (inp.attackPressed || inp.throwPressed || inp.skillQPressed || inp.skillCPressed || attackBufferTimerRef.current > 0) {
        inp.attackPressed = false;
        inp.throwPressed = false;
        inp.skillQPressed = false;
        inp.skillCPressed = false;
        attackBufferTimerRef.current = 0;
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
        if (hanzo) {
          p.anim = 'attacking';
          p.attackTimer = 24;
          triggerHanzoExecutionBlow(hanzo, p.facing);
          return;
        }
      }
    }

    // Priority 1: Shift + Attack -> shadow_dash_strike (Finisher Attack)
    // Requirement 3: Can only do it ONE TIME after getting 5 or more combo & triggers cinematic slow motion!
    if (
      canAct &&
      (inp.shift || shiftBufferTimerRef.current > 0) &&
      (inp.attackPressed || attackBufferTimerRef.current > 0) &&
      hitComboCountRef.current >= 5 &&
      finisherReadyRef.current
    ) {
      finisherReadyRef.current = false; // Consumed! Can only perform one time per 5+ combo!
      // Trigger cinematic slow motion for this finish attack!
      slowMotionRef.current = {
        active: true,
        factor: 0.28,
        timer: 36,
      };
      p.activeSkill = 'shadow_dash_strike';
      p.skillTimer = SHADOW_DASH_STRIKE_DURATION;
      p.skillFrame = 0;
      p.anim = 'shadow_dash_strike';
      p.vx = p.facing * 9.5;
      p.isDefending = false;
      p.parryAnimTimer = 0;
      p.isDoubleJumping = false;
      p.doubleJumpTimer = 0;
      p.doubleJumpFrame = undefined;
      p.attackTimer = 0;
      skillHit1Ref.current.clear();
      skillHit2Ref.current.clear();
      normalAttackComboCountRef.current = 0;
      normalAttackComboTimerRef.current = 0;
      inp.attackPressed = false;
      attackBufferTimerRef.current = 0;
      attackHoldTimerRef.current = 0;
      shiftBufferTimerRef.current = 0;
      soundEffects.playFinisherStrike();
      soundEffects.playDash();
    }
    // Priority 2: Attack + W (W/Up + Attack) -> crimson_slash_combo (10 frames)
    else if (canAct && p.onGround && (inp.up || upBufferTimerRef.current > 0) && (inp.attackPressed || attackBufferTimerRef.current > 0)) {
      p.activeSkill = 'crimson_slash_combo';
      p.skillTimer = SLASH_COMBO_DURATION;
      p.skillFrame = 0;
      p.anim = 'crimson_slash_combo';
      p.vx = p.facing * 1.5;
      p.isDefending = false;
      p.parryAnimTimer = 0;
      p.isDoubleJumping = false;
      p.doubleJumpTimer = 0;
      p.doubleJumpFrame = undefined;
      p.attackTimer = 0;
      skillHit1Ref.current.clear();
      skillHit2Ref.current.clear();
      normalAttackComboCountRef.current = 0;
      normalAttackComboTimerRef.current = 0;
      inp.attackPressed = false;
      attackBufferTimerRef.current = 0;
      attackHoldTimerRef.current = 0;
      upBufferTimerRef.current = 0;
      soundEffects.playSlash();
    }
    // Priority 3: Q -> aerial_kick (8 frames) - Anti-Air Wyvern Kick
    else if (canAct && inp.skillQPressed) {
      p.activeSkill = 'aerial_kick';
      p.skillTimer = AERIAL_KICK_DURATION;
      p.skillFrame = 0;
      p.anim = 'aerial_kick';
      p.onGround = false;
      p.vy = -8.5; // High anti-air leap into the air
      p.vx = p.facing * 4.5; // Forward momentum
      p.isDefending = false;
      p.parryAnimTimer = 0;
      p.isDoubleJumping = false;
      p.doubleJumpTimer = 0;
      p.doubleJumpFrame = undefined;
      p.attackTimer = 0;
      skillHit1Ref.current.clear();
      skillHit2Ref.current.clear();
      normalAttackComboCountRef.current = 0;
      normalAttackComboTimerRef.current = 0;
      inp.skillQPressed = false;
      attackHoldTimerRef.current = 0;
      soundEffects.playAttack();
      soundEffects.playSlash();
    }
    // Priority 4: C -> crimson_blade_wave (10 frames)
    // Requirement 5: Hidden bonus unlocked after slaying 20+ bats!
    else if (canAct && inp.skillCPressed && unlockedSkillsRef.current.crimsonBladeWave) {
      p.activeSkill = 'crimson_blade_wave';
      p.skillTimer = BLADE_WAVE_DURATION;
      p.skillFrame = 0;
      p.anim = 'crimson_blade_wave';
      p.vx = 0;
      p.isDefending = false;
      p.parryAnimTimer = 0;
      p.isDoubleJumping = false;
      p.doubleJumpTimer = 0;
      p.doubleJumpFrame = undefined;
      p.attackTimer = 0;
      bladeWaveSpawnedRef.current = false;
      skillHit1Ref.current.clear();
      skillHit2Ref.current.clear();
      normalAttackComboCountRef.current = 0;
      normalAttackComboTimerRef.current = 0;
      inp.skillCPressed = false;
      attackHoldTimerRef.current = 0;
      soundEffects.playSlash();
    }
    // Priority 4: Hold Attack -> blood_spin_slash (8 frames)
    // Requirement 4: Trophy awarded after slaying 10+ in Yunami Jigoku!
    else if (
      canAct &&
      p.onGround &&
      unlockedSkillsRef.current.bloodSpinSlash &&
      (attackHoldTimerRef.current >= ATTACK_HOLD_THRESHOLD || (attackHoldTimerRef.current >= 15 && !inp.attack))
    ) {
      p.activeSkill = 'blood_spin_slash';
      p.skillTimer = BLOOD_SPIN_DURATION;
      p.skillFrame = 0;
      p.anim = 'blood_spin_slash';
      p.vx = 0;
      p.isDefending = false;
      p.parryAnimTimer = 0;
      p.isDoubleJumping = false;
      p.doubleJumpTimer = 0;
      p.doubleJumpFrame = undefined;
      p.attackTimer = 0;
      skillHit1Ref.current.clear();
      skillHit2Ref.current.clear();
      normalAttackComboCountRef.current = 0;
      normalAttackComboTimerRef.current = 0;
      inp.attackPressed = false;
      attackBufferTimerRef.current = 0;
      attackHoldTimerRef.current = 0;
      soundEffects.playSlash();
    }
    // Priority 5: Normal Attack (Basic Katana Combo 1 -> 2 -> 3 / Airborne Down Slash)
    else if (
      !inDeathCinematic &&
      (inp.attackPressed || attackBufferTimerRef.current > 0) &&
      p.attackCooldown <= 0 &&
      p.attackTimer <= 0 &&
      p.alive &&
      !p.activeSkill &&
      p.throwTimer <= 0 &&
      p.anim !== 'hurt' &&
      p.anim !== 'dead'
    ) {
      p.isDefending = false;
      p.parryAnimTimer = 0;
      p.isDoubleJumping = false;
      p.doubleJumpTimer = 0;
      p.doubleJumpFrame = undefined;
      p.attackTimer = ATTACK_DURATION;
      p.attackCooldown = ATTACK_COOLDOWN;
      if (p.onGround) {
        normalAttackComboCountRef.current = (normalAttackComboCountRef.current % 3) + 1;
        normalAttackComboTimerRef.current = 34;
      }
      initiateAttack();
      inp.attackPressed = false;
      attackBufferTimerRef.current = 0;
    }

    // --- Jump & Double Jump (with Coyote Time & Input Buffering) ---
    if (inp.jumpPressed) {
      jumpBufferTimerRef.current = JUMP_BUFFER_TIME;
      inp.jumpPressed = false;
    }

    if (!inDeathCinematic && jumpBufferTimerRef.current > 0 && p.alive && p.attackTimer <= 0 && !p.activeSkill && p.throwTimer <= 0 && p.anim !== 'hurt' && p.anim !== 'dead') {
      if (p.onGround || coyoteTimerRef.current > 0) {
        // Ground Jump (First Jump)
        p.vy = JUMP_VELOCITY;
        p.onGround = false;
        coyoteTimerRef.current = 0;
        p.canDoubleJump = true;
        p.isDoubleJumping = false;
        p.doubleJumpTimer = 0;
        p.doubleJumpFrame = undefined;
        jumpBufferTimerRef.current = 0;
        soundEffects.playJump();
        spawnEffect('dust', p.x + p.w / 2 - 32, p.y + p.h - 24, 1, 2);
      } else if (!p.onGround && p.canDoubleJump && !p.isDoubleJumping) {
        // Second Jump: Double Jump (Airborne Acrobatic Flip)
        // If falling rapidly right above ground, preserve jump buffer for landing instead of burning double jump
        const isNearLanding = p.vy > 2.5 && checkNearGround(p, level.platforms, 28);
        if (!isNearLanding) {
          p.vy = DOUBLE_JUMP_VY;
          p.vx += p.facing * DOUBLE_JUMP_HORIZONTAL_IMPULSE;
          p.onGround = false;
          p.canDoubleJump = false; // Only once per airborne cycle!
          p.isDoubleJumping = true;
          p.doubleJumpTimer = DOUBLE_JUMP_DURATION;
          p.doubleJumpFrame = 0;
          jumpBufferTimerRef.current = 0;
          soundEffects.playDoubleJump();
          spawnEffect('dust', p.x + p.w / 2 - 32, p.y + p.h - 24, p.facing, 2);
        }
      }
    }

    // --- Dash (Works on ground & air, cancels guard, double jump & active skill) ---
    if (!inDeathCinematic && inp.dashPressed && p.dashCooldown <= 0 && p.alive && p.throwTimer <= 0 && p.anim !== 'hurt' && p.anim !== 'dead') {
      if (p.stamina >= DASH_STAMINA_COST) {
        // Determine intentional dash direction based on player input
        const dashDir: 1 | -1 = (inp.left && !inp.right) ? -1 : (inp.right && !inp.left) ? 1 : p.facing;
        p.facing = dashDir;
        p.isDefending = false;
        p.parryAnimTimer = 0;
        p.isDoubleJumping = false;
        p.doubleJumpTimer = 0;
        p.doubleJumpFrame = undefined;
        p.activeSkill = undefined;
        p.skillTimer = 0;
        p.skillFrame = 0;
        p.attackTimer = 0;
        p.stamina -= DASH_STAMINA_COST;
        p.dashTimer = DASH_DURATION;
        p.dashCooldown = DASH_COOLDOWN;
        p.vx = dashDir * DASH_SPEED;
        p.vy = 0;
        p.anim = 'dashing';
        soundEffects.playDash();

        spawnEffect('dust', p.x + (dashDir === 1 ? -12 : p.w - 12), p.y + p.h - 24, (dashDir * -1) as 1 | -1, 3);
        dashGhostsRef.current.push({
          id: nextDashGhostIdRef.current++,
          x: p.x,
          y: p.y,
          facing: dashDir,
          frameIndex: 0,
          alpha: 0.75,
        });
      }
      inp.dashPressed = false;
    }

    // --- Active Skill Execution & Frame Tick ---
    if (p.activeSkill && (p.skillTimer || 0) > 0) {
      // Recovery cancellation into Dash or Jump in final recovery window
      if (p.skillTimer! <= 5) {
        if (inp.dashPressed && p.stamina >= DASH_STAMINA_COST) {
          p.activeSkill = undefined;
          p.skillTimer = 0;
          p.skillFrame = 0;
          skillCooldownRef.current = SKILL_COOLDOWN;
        } else if (inp.jumpPressed && p.onGround) {
          p.activeSkill = undefined;
          p.skillTimer = 0;
          p.skillFrame = 0;
          skillCooldownRef.current = SKILL_COOLDOWN;
        }
      }
    }

    if (p.activeSkill && (p.skillTimer || 0) > 0) {
      p.skillTimer! -= 1;
      const skill = p.activeSkill;

      if (skill === 'shadow_dash_strike') {
        const elapsed = SHADOW_DASH_STRIKE_DURATION - p.skillTimer!;
        p.skillFrame = Math.min(7, Math.floor(elapsed / 3));
        p.vx = p.facing * 8.5;

        // Motion ghost trail
        if (elapsed % 2 === 0) {
          dashGhostsRef.current.push({
            id: nextDashGhostIdRef.current++,
            x: p.x,
            y: p.y,
            facing: p.facing,
            frameIndex: p.skillFrame % 5,
            alpha: 0.7,
          });
        }

        // Active dash strike hitbox (frames 1..5)
        if (p.skillFrame >= 1 && p.skillFrame <= 5) {
          const dashBox: Rect = {
            x: p.facing === 1 ? p.x - 4 : p.x - 48,
            y: p.y - 2,
            w: p.w + 48,
            h: p.h + 4,
          };
          applySkillHit(dashBox, 2.0, 6.0, skillHit1Ref.current, 5.0);
        }

        if (p.skillTimer! <= 0) {
          p.activeSkill = undefined;
          p.skillTimer = 0;
          p.skillFrame = 0;
          skillCooldownRef.current = SKILL_COOLDOWN;
        }
      } else if (skill === 'crimson_slash_combo') {
        const elapsed = SLASH_COMBO_DURATION - p.skillTimer!;
        p.skillFrame = Math.min(9, Math.floor(elapsed / 3));
        p.vx = p.facing * 1.5;

        // Strike 1 (frames 2..4)
        if (p.skillFrame === 2 && elapsed % 3 === 0) {
          soundEffects.playSlash();
          shakeRef.current = Math.max(shakeRef.current, 4.5);
        }
        if (p.skillFrame >= 2 && p.skillFrame <= 4) {
          const strike1Box: Rect = {
            x: p.facing === 1 ? p.x + 8 : p.x - 52,
            y: p.y - 4,
            w: 56,
            h: 50,
          };
          applySkillHit(strike1Box, 1.5, 4.5, skillHit1Ref.current, 3.5);
        }

        // Strike 2 (frames 6..8)
        if (p.skillFrame === 6 && elapsed % 3 === 0) {
          soundEffects.playAttack();
          shakeRef.current = Math.max(shakeRef.current, 6.5);
          spawnEffect('impact', p.facing === 1 ? p.x + 36 : p.x - 24, p.y + 8, p.facing, 2);
        }
        if (p.skillFrame >= 6 && p.skillFrame <= 8) {
          const strike2Box: Rect = {
            x: p.facing === 1 ? p.x + 10 : p.x - 56,
            y: p.y - 2,
            w: 60,
            h: 52,
          };
          applySkillHit(strike2Box, 1.5, 6.5, skillHit2Ref.current, 4.5);
        }

        if (p.skillTimer! <= 0) {
          p.activeSkill = undefined;
          p.skillTimer = 0;
          p.skillFrame = 0;
          skillCooldownRef.current = SKILL_COOLDOWN;
        }
      } else if (skill === 'crimson_blade_wave') {
        const elapsed = BLADE_WAVE_DURATION - p.skillTimer!;
        p.skillFrame = Math.min(9, Math.floor(elapsed / 3));
        p.vx = 0;

        // Spawn projectile wave at frame 5
        if (p.skillFrame >= 5 && !bladeWaveSpawnedRef.current) {
          bladeWaveSpawnedRef.current = true;
          bladeWavesRef.current.push({
            id: nextBladeWaveIdRef.current++,
            x: p.facing === 1 ? p.x + p.w + 4 : p.x - 52,
            y: p.y + 6,
            w: 48,
            h: 36,
            vx: p.facing * 8.0,
            facing: p.facing,
            lifetime: 0,
            maxDistance: 450,
            active: true,
            frame: 0,
          });
          soundEffects.playSlash();
          shakeRef.current = Math.max(shakeRef.current, 5.5);
        }

        if (p.skillTimer! <= 0) {
          p.activeSkill = undefined;
          p.skillTimer = 0;
          p.skillFrame = 0;
          skillCooldownRef.current = SKILL_COOLDOWN;
        }
      } else if (skill === 'blood_spin_slash') {
        const elapsed = BLOOD_SPIN_DURATION - p.skillTimer!;
        p.skillFrame = Math.min(7, Math.floor(elapsed / 3));
        p.vx *= 0.8;

        // Active 360-degree whirlwind hitbox (frames 1..5)
        if (p.skillFrame >= 1 && p.skillFrame <= 5) {
          const spinBox: Rect = {
            x: p.x - 34,
            y: p.y - 8,
            w: p.w + 68,
            h: p.h + 16,
          };
          applySkillHit(spinBox, 2.5, 6.0, skillHit1Ref.current, 4.5);
        }

        if (p.skillTimer! <= 0) {
          p.activeSkill = undefined;
          p.skillTimer = 0;
          p.skillFrame = 0;
          skillCooldownRef.current = SKILL_COOLDOWN;
        }
      } else if (skill === 'aerial_kick') {
        const elapsed = AERIAL_KICK_DURATION - p.skillTimer!;
        p.skillFrame = Math.min(7, Math.floor(elapsed / 3));

        // Physics trajectory: upward anti-air leap during active frames, then hang-time
        if (p.skillFrame <= 3) {
          p.vy = Math.min(p.vy, -6.5);
          p.vx = p.facing * 4.0;
        } else {
          p.vy += 0.35;
          p.vx = p.facing * 1.5;
        }

        // Sound on kick extension (frame 2)
        if (p.skillFrame === 2 && elapsed % 3 === 0) {
          soundEffects.playSlash();
          shakeRef.current = Math.max(shakeRef.current, 4.0);
        }

        // Active Kick Hitbox (frames 1..6): high reach forward & upward to strike flying Wyverns
        if (p.skillFrame >= 1 && p.skillFrame <= 6) {
          const kickBox: Rect = {
            x: p.facing === 1 ? p.x : p.x - 36,
            y: p.y - 24, // Reaches above the ninja into the air where bats fly!
            w: 64,
            h: 68,
          };
          applySkillHit(kickBox, 2.0, 5.0, skillHit1Ref.current, 5.0);
        }

        if (p.skillTimer! <= 0) {
          p.activeSkill = undefined;
          p.skillTimer = 0;
          p.skillFrame = 0;
          skillCooldownRef.current = SKILL_COOLDOWN;
        }
      }
    }

    // --- Horizontal Movement & Guard Stance ---
    if (p.dashTimer > 0) {
      p.dashTimer -= 1;
      p.vx = p.facing * DASH_SPEED;
      p.vy = 0; // dash is horizontal, slight hover
      p.anim = 'dashing';

      // Spawn motion afterimage (残像) every 2 frames
      if (p.dashTimer % 2 === 0) {
        const elapsedPhysicsFrame = Math.min(11, Math.max(0, 12 - p.dashTimer));
        const frameIndex = Math.min(5, Math.floor(elapsedPhysicsFrame / 2));
        dashGhostsRef.current.push({
          id: nextDashGhostIdRef.current++,
          x: p.x,
          y: p.y,
          facing: p.facing,
          frameIndex,
          alpha: 0.7,
        });
      }

      // Smooth transition back to running on the completion frame
      if (p.dashTimer === 0) {
        if (inp.left && !inp.right) p.vx = -MOVE_SPEED;
        else if (inp.right && !inp.left) p.vx = MOVE_SPEED;
        else p.vx *= 0.5;
      }
    } else if (p.activeSkill) {
      p.anim = p.activeSkill;
    } else if (p.isDefending || p.parryAnimTimer > 0) {
      // Guard stance: stationary on ground, or hovering descent in air
      if (p.onGround) {
        p.vx = 0;
      } else {
        p.vx *= 0.85;
        if (p.vy > 2) p.vy = 2; // Controlled aerial guard descent
      }
      p.anim = 'parry';
      // Allow turning left/right while holding guard
      if (inp.left) p.facing = -1;
      else if (inp.right) p.facing = 1;
    } else if (inDeathCinematic) {
      // Cinematic Boss Death: Player stands watching Hanzo dissolve
      p.vx *= 0.8;
      if (Math.abs(p.vx) < 0.1) p.vx = 0;
    } else {
      let target = 0;
      if (inp.left) target -= MOVE_SPEED;
      if (inp.right) target += MOVE_SPEED;

      if (p.onGround) {
        if (target !== 0) {
          // Snappy instant turnaround when reversing direction on ground
          if (Math.sign(target) !== Math.sign(p.vx) && Math.abs(p.vx) > 0.5) {
            p.vx = target * TURN_BOOST;
          } else {
            p.vx += (target - p.vx) * GROUND_ACCEL;
          }
          p.vx = Math.abs(p.vx) > MOVE_SPEED ? target : p.vx;
          p.facing = target > 0 ? 1 : -1;
        } else {
          // Crisp ground stopping (no ice-skating)
          p.vx *= GROUND_FRICTION;
          if (Math.abs(p.vx) < 0.2) p.vx = 0;
        }
      } else {
        // Controlled airborne movement
        if (target !== 0) {
          p.vx += (target - p.vx) * AIR_ACCEL;
          p.vx = Math.abs(p.vx) > MOVE_SPEED ? target : p.vx;
          p.facing = target > 0 ? 1 : -1;
        } else {
          p.vx *= AIR_FRICTION;
          if (Math.abs(p.vx) < 0.15) p.vx = 0;
        }
      }

      // Variable jump height: cut upward velocity if jump key released early
      if (!inp.jump && p.vy < VARIABLE_JUMP_CUTOFF) {
        p.vy *= VARIABLE_JUMP_DAMPING;
      }
    }

    // Shuriken Throw (X key or Right Click)
    if (!inDeathCinematic && inp.throwPressed) {
      inp.throwPressed = false;
      // Verify ninja has at least 1 shuriken in ammo
      if (p.shurikenCount > 0) {
        // Ignore if dash is active, already throwing, in cooldown, or during skill/attack/hurt/death
        if (
          p.dashTimer <= 0 &&
          !p.activeSkill &&
          p.throwTimer <= 0 &&
          p.throwCooldown <= 0 &&
          p.attackTimer <= 0 &&
          p.anim !== 'hurt' &&
          p.anim !== 'dead'
        ) {
          p.shurikenCount -= 1; // Consume 1 shuriken
          p.throwTimer = 26; // 26 frames total throw sequence
          p.throwCooldown = SHURIKEN_COOLDOWN;
          p.shurikenSpawned = false;
          soundEffects.playShurikenThrow();
        }
      }
    }

    // Active Shuriken Throw execution
    if (p.throwTimer > 0) {
      p.throwTimer -= 1;
      p.vx *= 0.6;

      if (p.throwTimer <= 13 && !p.shurikenSpawned) {
        p.shurikenSpawned = true;
        const throwOffsetX = p.facing === 1 ? p.w + 6 : -20;
        const throwOffsetY = 16;
        spawnShuriken(p.x + throwOffsetX, p.y + throwOffsetY, p.facing);
      }
    }

    // Gravity
    if (p.activeSkill) {
      p.vy += GRAVITY * 0.45;
      if (p.vy > 2.5) p.vy = 2.5;
    } else {
      p.vy += GRAVITY;
      if (p.vy > MAX_FALL) p.vy = MAX_FALL;
    }

    // --- Move X with collision ---
    p.x += p.vx;
    for (const plat of level.platforms) {
      if (plat.type === 'platform') continue; // Jump-through platforms do not block horizontally
      if (rectsOverlap(p, plat)) {
        // If player's feet are near the top surface of the platform, it's ground being walked on, not a wall!
        if (p.y + p.h <= plat.y + 8) {
          continue;
        }
        if (p.vx > 0) p.x = plat.x - p.w;
        else if (p.vx < 0) p.x = plat.x + plat.w;
        p.vx = 0;
      }
    }

    // --- Move Y with collision ---
    p.y += p.vy;
    const wasGroundBefore = p.onGround;
    p.onGround = false;
    for (const plat of level.platforms) {
      if (rectsOverlap(p, plat)) {
        if (plat.type === 'platform') {
          // Jump-through platform: only land when falling downward from above
          if (p.vy > 0 && p.y + p.h - p.vy <= plat.y + 8) {
            p.y = plat.y - p.h;
            p.vy = 0;
            p.onGround = true;
          }
          continue;
        }
        if (p.vy > 0) {
          p.y = plat.y - p.h;
          p.vy = 0;
          p.onGround = true;
        } else if (p.vy < 0) {
          p.y = plat.y + plat.h;
          p.vy = 0;
        }
      }
    }

    // Landing detection: just transitioned from airborne to grounded
    if (p.onGround) {
      coyoteTimerRef.current = COYOTE_TIME;
      // Solid landing: reset double jump state and re-enable for next airborne cycle
      p.canDoubleJump = true;
      p.isDoubleJumping = false;
      p.doubleJumpTimer = 0;
      p.doubleJumpFrame = undefined;

      // Immediately execute buffered jump upon landing
      if (jumpBufferTimerRef.current > 0) {
        p.vy = JUMP_VELOCITY;
        p.onGround = false;
        coyoteTimerRef.current = 0;
        jumpBufferTimerRef.current = 0;
        soundEffects.playJump();
        spawnEffect('dust', p.x + p.w / 2 - 32, p.y + p.h - 24, 1, 2);
      } else if (wasAirborneRef.current) {
        landingTimerRef.current = 10;
        wasAirborneRef.current = false;
        spawnEffect('dust', p.x + p.w / 2 - 32, p.y + p.h - 24, 1, 2);
      }
    }
    if (!p.onGround) wasAirborneRef.current = true;
    if (landingTimerRef.current > 0) landingTimerRef.current -= 1;

    // Boss Arena Boundary Clamping (Section 8 - Hanzo Arena in Chinoike Jigoku)
    // Once entered, the arena is sealed: the ninja cannot escape to any place until he kills Hanzo!
    if (level.storyLocation === 'chinoike-jigoku' && bossIntroTriggeredRef.current && !hanzoDefeatedRef.current) {
      // Left Kekkai Barrier (Sealing entrance back to Section 7)
      if (p.x < 6100) {
        p.x = 6100;
        if (p.vx < 0) {
          p.vx = 0;
          if (Math.random() < 0.35) {
            spawnEffect('impact', 6100 - 8, p.y + p.h / 2 - 24, 1, 2);
            shakeRef.current = Math.max(shakeRef.current, 2.5);
          }
        }
      }
      // Right Arena Boundary (Platform Edge / Wall)
      if (p.x + p.w > 7460) {
        p.x = 7460 - p.w;
        if (p.vx > 0) p.vx = 0;
      }
    }

    // World bounds
    if (p.x < 0) p.x = 0;
    if (p.x + p.w > level.width) p.x = level.width - p.w;

    // Fall death
    if (p.y > level.height + 100) {
      damagePlayer(99, false);
    }

    // --- Spikes ---
    for (const sp of level.spikes) {
      if (rectsOverlap(p, sp) && p.invuln <= 0 && p.dashTimer <= 0) {
        damagePlayer(SPIKE_DAMAGE, true);
        p.vy = -8;
        p.vx = (p.x < sp.x + sp.w / 2 ? -1 : 1) * 4;
      }
    }

    // --- Coins ---
    for (const c of level.coins) {
      if (!c.collected && rectsOverlap(p, c)) {
        c.collected = true;
        coinsCollectedRef.current += 1;
        scoreRef.current += 100;
        soundEffects.playCoin();
      }
    }

    // --- Collectible Shurikens in Yunami Jigoku ---
    if (level.collectibleShurikens) {
      for (const cs of level.collectibleShurikens) {
        if (!cs.collected && rectsOverlap(p, cs)) {
          cs.collected = true;
          p.shurikenCount += 1;
          scoreRef.current += 150;
          soundEffects.playCoin();
          spawnEffect('impact', cs.x - 4, cs.y - 4, 1, 3);
        }
      }
    }

    // --- Checkpoint ---
    if (!level.checkpoint.activated && rectsOverlap(p, level.checkpoint)) {
      level.checkpoint.activated = true;
      checkpointActivatedRef.current = true;
      respawnPointRef.current = {
        x: level.checkpoint.x + 10,
        y: level.checkpoint.y + level.checkpoint.h - p.h,
      };
      scoreRef.current += 200;
      soundEffects.playCheckpoint();
    }

    // --- Lethal Blood Pond Hazard (Chinoike Jigoku) ---
    // Single lethal death event: only trigger once per contact/death cycle while alive
    if (level.bloodPonds && p.alive && p.deathTimer === 0 && statusRef.current === 'playing') {
      for (const bp of level.bloodPonds) {
        if (rectsOverlap(p, bp)) {
          // Immediately consume event for current player death cycle
          p.hp = 0;
          p.alive = false;
          p.deathTimer = 0;
          p.anim = 'dead';
          p.vx = 0;
          p.vy = 0;
          damageFlashRef.current = 1;
          shakeRef.current = 16;
          soundEffects.stopRunning();
          soundEffects.stopHanzoBattleMusic();
          soundEffects.stopHanzoIntro();
          if (extraLivesRef.current <= 0) {
            titleMusic.pause();
          }
          soundEffects.playGameOver();
          spawnEffect('slash', p.x + p.w / 2 - 24, p.y + p.h / 2 - 24, 1, 3);
          break;
        }
      }
    }

    // --- Boss Arena Entry & Cinematic Splash Trigger (Section 8) ---
    if (level.storyLocation === 'chinoike-jigoku' && p.x >= 6080 && !hanzoDefeatedRef.current) {
      if (!bossIntroTriggeredRef.current) {
        bossIntroTriggeredRef.current = true;
        // Cleanly position player safely on the arena ground platform (6100 - 7500, Y: 280)
        p.x = Math.max(p.x, 6140);
        p.y = 280 - p.h;
        p.vx = 0;
        p.vy = 0;
        p.onGround = true;
        p.anim = 'idle';
        p.invuln = 220; // Safe invulnerability during title card intro

        // Requirement 4: Auto-activate Checkpoint at the Hanzo Boss Fight Arena entrance!
        level.checkpoint.activated = true;
        checkpointActivatedRef.current = true;
        respawnPointRef.current = {
          x: 6140,
          y: 280 - p.h,
        };
        try {
          sessionStorage.setItem('shadow_boss_checkpoint', 'true');
        } catch (_) {}
        soundEffects.playCheckpoint();
        spawnEffect('impact', p.x + 16, p.y + 24, 1, 3);

        // Despawn non-boss enemies (bats/samurais) so player is never ambushed during arena intro/fight
        enemiesRef.current = enemiesRef.current.filter((e) => e.type === 'hanzo');

        // Cinematic boss intro: 280 frames (~4.66s) synchronized to Japanese_Intro_mp3.mp3 (4.63s)
        bossIntroTimerRef.current = 280;
        shakeRef.current = Math.max(shakeRef.current, 12);
        titleMusic.pause();
        soundEffects.playHanzoIntro();
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
        if (hanzo) {
          hanzo.state = 'idle';
          hanzo.x = 6750;
          hanzo.y = 280 - hanzo.h;
          hanzo.vx = 0;
          hanzo.vy = 0;
          hanzo.onGround = true;
          hanzo.attackTimer = 0;
          hanzo.comboActive = false;
          hanzo.comboStep = undefined;
          hanzo.jumpPhase = undefined;
          hanzo.jumpFrame = undefined;
          hanzo.jumpTimer = 0;
          hanzo.jumpCooldown = 60;
          hanzo.facing = -1;
        }
      }
    }
    if (bossIntroTimerRef.current > 0) {
      bossIntroTimerRef.current -= 1;
      p.invuln = Math.max(p.invuln, 60);
      // Gently decelerate player so player pauses to behold Hanzo's spawn and title intro
      p.vx *= 0.85;
      if (p.onGround && Math.abs(p.vx) < 0.2) p.anim = 'idle';

      if (bossIntroTimerRef.current === 0) {
        // TITLE CARD ENDED: Hanzo begins relentless active combat!
        soundEffects.stopHanzoIntro();
        soundEffects.playHanzoBattleMusic();
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
        if (hanzo && hanzo.alive && hanzo.state !== 'death' && hanzo.state !== 'dead') {
          hanzo.state = 'chase';
          hanzo.facing = p.x >= hanzo.x ? 1 : -1;
          hanzo.vx = hanzo.facing * 3.4; // Immediate active combat charge towards the player!
          hanzo.comboCooldown = 15;
          hanzo.spinCooldown = 0;
          hanzo.dashCooldown = 0;
          hanzo.teleportCooldown = 25;
          hanzo.risingCooldown = 0;
          hanzo.jumpCooldown = 35;
        }
      }
    }

    // --- Ancient Supernatural Portal (End of Story Location) ---
    if (rectsOverlap(p, level.exit) && statusRef.current === 'playing') {
      if (level.storyLocation === 'yunami-jigoku') {
        if (portalCooldownRef.current <= 0) {
          const killsInYunami = yunamiKillsRef.current;
          const hasBonusSkill = killsInYunami >= 10 || Boolean(unlockedSkillsRef.current.bloodSpinSlash);
          portalPromptRef.current = {
            open: true,
            kills: killsInYunami,
            requiredKills: 10,
            hasBonusSkill,
          };
          p.vx = 0;
          p.vy = 0;
          p.anim = 'idle';
          soundEffects.stopRunning();
          soundEffects.playMenuSelect();
          return;
        }
      } else if (level.storyLocation === 'chinoike-jigoku') {
        // Portal to TAMASHI NO SHINDEN is guarded by Hanzo
        if (!hanzoDefeatedRef.current) {
          // Portal is LOCKED while Hanzo lives: deflect player back with barrier pulse
          if (p.x > level.exit.x - 20) {
            p.x = level.exit.x - 20;
            p.vx = -3.5;
            shakeRef.current = Math.max(shakeRef.current, 4);
          }
        } else {
          // HANZO DEFEATED: Portal unlocked! Story transition to Tamashi no Shinden!
          statusRef.current = 'mission_complete';
          soundEffects.stopRunning();
          p.vx = 0;
          p.vy = 0;
          p.anim = 'idle';
          soundEffects.playVictory();
        }
      }
    }

    // --- Enemy contact ---
    for (const e of enemiesRef.current) {
      if (!e.alive) continue;
      // During boss intros or death, Hanzo cannot fight or damage the ninja!
      if (e.type === 'hanzo' && (!bossIntroTriggeredRef.current || bossIntroTimerRef.current > 0 || e.state === 'death' || e.state === 'dead')) continue;
      if (rectsOverlap(p, e) && p.invuln <= 0 && p.dashTimer <= 0) {
        if (p.isDefending || p.parryAnimTimer > 0) {
          // Defending: 0 damage, deflect contact and spawn parry spark!
          e.vx = e.facing * -3.5;
          if (!e.attackParried) {
            e.attackParried = true;
            p.parryAnimTimer = 24; // Trigger 24-frame dynamic deflection swing!
            const colX = (p.x + e.x + p.w / 2) / 2;
            const colY = (p.y + e.y + p.h / 2) / 2;
            parryHitsRef.current.push({
              id: nextParryHitIdRef.current++,
              x: colX,
              y: colY,
              isPerfect: true,
              lifetime: 24,
              maxLifetime: 24,
            });
            shakeRef.current = Math.max(shakeRef.current, 5);
            soundEffects.playHit();
            p.stamina = Math.min(p.maxStamina, p.stamina + 20);
          }
        } else {
          damagePlayer(ENEMY_CONTACT_DAMAGE, true);
          // knockback
          p.vx = (p.x < e.x ? -1 : 1) * 6;
          p.vy = -6;
        }
      }
    }

    // --- Cooldowns & Animation Timers ---
    if (p.attackTimer > 0) p.attackTimer -= 1;
    if (p.attackCooldown > 0) p.attackCooldown -= 1;
    if (p.dashCooldown > 0) p.dashCooldown -= 1;
    if (p.throwCooldown > 0) p.throwCooldown -= 1;
    if (p.parryCooldown > 0) p.parryCooldown -= 1;
    if (p.parryAnimTimer > 0) p.parryAnimTimer -= 1;
    if (p.invuln > 0) p.invuln -= 1;

    // --- Double Jump Lifecycle & Frame Progression ---
    if (p.isDoubleJumping) {
      p.doubleJumpTimer = (p.doubleJumpTimer || DOUBLE_JUMP_DURATION) - 1;
      const elapsed = DOUBLE_JUMP_DURATION - p.doubleJumpTimer;
      p.doubleJumpFrame = Math.min(23, Math.floor(elapsed / 3));

      if (p.doubleJumpTimer <= 0) {
        p.isDoubleJumping = false;
        p.doubleJumpFrame = undefined;
      }
    }

    // --- Animation state (Priority: Death > Damage > Dash > Active Skill > Downward Attack > Ground Attack > Defend/Parry > Throw > Land > Double Jump > Fall > Jump > Run > Idle) ---
    if (!p.alive) {
      p.anim = 'dead';
      p.isDefending = false;
      p.parryAnimTimer = 0;
      p.parryTimer = 0;
      p.parryCooldown = 0;
      p.parrySuccess = false;
    }
    else if (p.invuln > 0 && p.invuln > INVULN_DURATION - 16) p.anim = 'hurt';
    else if (p.dashTimer > 0) p.anim = 'dashing';
    else if (p.activeSkill) p.anim = p.activeSkill;
    else if (p.attackTimer > 0 && !p.onGround) p.anim = 'down_attacking';
    else if (p.attackTimer > 0 && p.onGround) p.anim = 'attacking';
    else if (p.parryAnimTimer > 0 || p.isDefending) p.anim = 'parry';
    else if (p.throwTimer > 0) p.anim = 'throwing';
    else if (landingTimerRef.current > 0) p.anim = 'landing';
    else if (p.isDoubleJumping) p.anim = 'double_jumping';
    else if (!p.onGround) p.anim = p.vy < 0 ? 'jumping' : 'falling';
    else if (Math.abs(p.vx) > 0.5) p.anim = 'running';
    else p.anim = 'idle';

    // --- Attack Active Window & Frame Computation ---
    if (p.attackTimer > 0) {
      const isDownAttack = !p.onGround;
      const elapsed = ATTACK_DURATION - p.attackTimer;
      if (isDownAttack) {
        p.attackFrame = Math.min(5, Math.floor(elapsed / 2.33));
        // Active strike apex on frames 1..3
        if (p.attackFrame >= 1 && p.attackFrame <= 3) {
          if (!attackSlashSpawnedRef.current) {
            attackSlashSpawnedRef.current = true;
            spawnEffect('down_slash', p.x + p.w / 2 - 32, p.y + p.h - 8, p.facing, 3);
          }
          if (!attackHitRegisteredRef.current) {
            executeAttackHitCheck(true);
          }
        }
      } else {
        p.attackFrame = Math.min(7, Math.floor(elapsed / 1.75));
        // Active strike apex on frames 2..4
        if (p.attackFrame >= 2 && p.attackFrame <= 4) {
          if (!attackSlashSpawnedRef.current) {
            attackSlashSpawnedRef.current = true;
            const comboStep = normalAttackComboCountRef.current || 1;
            if (comboStep === 3) {
              shakeRef.current = Math.max(shakeRef.current, 8);
              soundEffects.playSlash();
            } else {
              shakeRef.current = Math.max(shakeRef.current, 6);
            }
            spawnEffect('slash', p.facing === 1 ? p.x + p.w - 14 : p.x - 50, p.y - 12, p.facing, 3);
          }
          if (!attackHitRegisteredRef.current) {
            executeAttackHitCheck(false);
          }
        }
      }
    } else {
      p.attackFrame = undefined;
      attackHitRegisteredRef.current = false;
      attackSlashSpawnedRef.current = false;
    }

    // --- Deterministic Player Animation Frame Calculation from Game Loop Tick ---
    const tick = gameTickRef.current;
    if (p.throwTimer > 0) {
      p.throwFrame = Math.min(4, Math.floor((16 - p.throwTimer) / 3.2));
    } else {
      p.throwFrame = undefined;
    }

    if (landingTimerRef.current > 0) {
      p.landingFrame = Math.min(2, Math.floor((8 - landingTimerRef.current) / 2.7));
    } else {
      p.landingFrame = undefined;
    }

    if (p.anim === 'hurt') {
      p.hurtFrame = Math.min(3, Math.floor((INVULN_DURATION - p.invuln) / 4));
    } else {
      p.hurtFrame = undefined;
    }

    if (p.anim === 'idle') p.animFrame = Math.floor(tick / 6) % 6;
    else if (p.anim === 'running') p.animFrame = Math.floor(tick / 4) % 8;
    else if (p.anim === 'jumping') p.animFrame = Math.min(5, Math.max(0, Math.floor((p.vy + 12) / 2.4)));
    else if (p.anim === 'falling') p.animFrame = Math.floor(tick / 5) % 4;
    else if (p.anim === 'dashing') p.animFrame = Math.min(5, Math.floor((14 - p.dashTimer) / 2.4));
    else if (p.anim === 'dead') p.animFrame = Math.min(5, Math.floor(p.deathTimer / 8));
    else if (p.anim === 'parry') p.animFrame = Math.min(3, Math.floor((12 - p.parryAnimTimer) / 3));
    else p.animFrame = undefined;

    // Running audio effect (Fast_Running ninja sfx)
    if (p.anim === 'running' && p.onGround && p.alive && statusRef.current === 'playing' && !inDeathCinematic && !inBossIntro) {
      soundEffects.startRunning();
    } else {
      soundEffects.stopRunning();
    }

    updateShurikens();
    updateBladeWaves();
    updateEnemies();
    updateCamera();
    decayEffects();
  }

  function triggerHanzoDamage(e: Enemy, hitFacing: 1 | -1) {
    // Non-lethal damage animation:
    // damage_hanzo_1 (65ms, 4 ticks) -> damage_hanzo_2 (65ms, 4 ticks) -> damage_hanzo_3 (75ms, 4 ticks) -> damage_hanzo_4 (90ms, 6 ticks)
    // Total 18 ticks (~295ms)
    e.state = 'hurt';
    e.hurtCooldown = 18;
    e.damageFrame = 0;
    e.deathFrame = undefined;
    e.vx = hitFacing * 2.2;

    // Interrupt jump if active
    e.jumpPhase = undefined;
    e.jumpFrame = undefined;
    e.jumpTimer = 0;

    // Interrupt combo / attack / telegraph if active
    e.comboActive = false;
    e.comboStep = undefined;
    e.attackTimer = 0;
    e.teleportTimer = 0;
    e.hitConnected = false;
    e.attackParried = false;
    e.telegraph = 'none';
    e.telegraphTimer = 0;
    e.telegraphMaxTimer = 0;
    e.telegraphTargetX = undefined;
    e.telegraphTargetY = undefined;

    // Spawn visual impact effect
    spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, hitFacing, 2);
    shakeRef.current = Math.max(shakeRef.current, 5);
  }

  function triggerHanzoLethalDeath(e: Enemy, hitFacing: 1 | -1) {
    // Immediately stop Hanzo battle music on death!
    soundEffects.stopHanzoBattleMusic();
    soundEffects.stopHanzoIntro();
    titleMusic.play(soundEffects.isMuted(), 0.22);
    // Immediately cancel damage animation, attacks, combo, dash, teleport, jump, telegraph
    e.hp = 0;
    e.state = 'death';
    e.deadTimer = 0;
    e.deathFrame = 0;
    e.damageFrame = undefined;
    e.hurtCooldown = 0;
    e.vx = 0;
    e.vy = 0;

    // Snap cleanly to platform ground if airborne
    if (!e.onGround) {
      e.y = 280 - e.h;
      e.vy = 0;
      e.onGround = true;
    }

    e.comboActive = false;
    e.comboStep = undefined;
    e.jumpPhase = undefined;
    e.jumpFrame = undefined;
    e.jumpTimer = 0;
    e.attackTimer = 0;
    e.teleportTimer = 0;
    e.hitConnected = false;
    e.attackParried = false;
    e.telegraph = 'none';
    e.telegraphTimer = 0;
    e.telegraphMaxTimer = 0;
    e.telegraphTargetX = undefined;
    e.telegraphTargetY = undefined;

    // Trigger Cinematic Boss Death Sequence
    hanzoDeathCinematicRef.current = {
      active: true,
      timer: 0,
      endingTimer: 0,
    };

    // Phase 1: Killing hit impact pause and visual emphasis
    shakeRef.current = Math.max(shakeRef.current, 8);
    damageFlashRef.current = 0.45;
    spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, hitFacing, 3);
    scoreRef.current += 500;
    const p = playerRef.current;
    p.hp = Math.min(p.maxHp, p.hp + 0.5);
  }

  function triggerHanzoHit(e: Enemy, hitFacing: 1 | -1) {
    if (!e.alive || e.state === 'death' || e.state === 'dead') return;

    soundEffects.playHit();
    scoreRef.current += 50;

    e.hp = Math.max(0, e.hp - 1);
    if (e.hp <= 0) {
      triggerHanzoLethalDeath(e, hitFacing);
    } else {
      triggerHanzoDamage(e, hitFacing);
    }
  }

  function getParryHitbox(p: PlayerState): Rect {
    return {
      x: p.facing === 1 ? p.x + 14 : p.x - 22,
      y: p.y + 4,
      w: 36,
      h: p.h - 8,
    };
  }

  function registerHitCombo(damageDealt: number = 1) {
    hitComboCountRef.current += 1;
    hitComboTimerRef.current = 300; // 5.0s @ 60fps
    if (hitComboCountRef.current > highestComboRef.current) {
      highestComboRef.current = hitComboCountRef.current;
    }
    soundEffects.playComboHit(hitComboCountRef.current);
    if (hitComboCountRef.current >= 5 && !finisherReadyRef.current) {
      finisherReadyRef.current = true;
      soundEffects.playFinisherReady();
      spawnEffect('impact', playerRef.current.x, playerRef.current.y - 20, playerRef.current.facing, 6);
    }
  }

  function registerEnemyKilled(enemy: Enemy) {
    if (storyLocationRef.current === 'yunami-jigoku') {
      yunamiKillsRef.current += 1;
      if (yunamiKillsRef.current >= 10 && !unlockedSkillsRef.current.bloodSpinSlash) {
        unlockedSkillsRef.current.bloodSpinSlash = true;
        soundEffects.playTrophyUnlocked();
        trophyNotificationRef.current = {
          id: nextNotificationIdRef.current++,
          title: 'トロフィー獲得: 獄炎旋風斬 (TROPHY UNLOCKED: BLOOD SPIN SLASH)',
          message: `Mastery of Yunami Jigoku (${yunamiKillsRef.current}/10 Kills)! You unlocked Blood Spin Slash! Hold [Attack] to execute a 360° sweeping crimson vortex!`,
          type: 'trophy',
          lifetime: 420,
        };
      }
    }
    if (enemy.type === 'spirit' || (enemy.type as string) === 'corrupted_bat') {
      totalBatKillsRef.current += 1;
      // Requirement 5: 20+ bat kills unlocks crimson_blade_wave secretly!
      if (totalBatKillsRef.current >= 20 && !unlockedSkillsRef.current.crimsonBladeWave) {
        unlockedSkillsRef.current.crimsonBladeWave = true;
        soundEffects.playSecretUnlocked();
        trophyNotificationRef.current = {
          id: nextNotificationIdRef.current++,
          title: '秘技覚醒・紅蓮刃波 (SECRET UNLOCKED: CRIMSON BLADE WAVE)',
          message: 'Slain 20+ Corrupted Bats! You have awakened the ancient ranged slash technique. Press [C] to unleash Crimson Blade Waves!',
          type: 'secret',
          lifetime: 420,
        };
      }
    }
  }

  function initiateAttack() {
    soundEffects.playAttack();
    const p = playerRef.current;
    p.isDoubleJumping = false;
    p.doubleJumpTimer = 0;
    p.doubleJumpFrame = undefined;
    p.attackFrame = 0;
    attackHitRegisteredRef.current = false;
    attackSlashSpawnedRef.current = false;
  }

  function executeAttackHitCheck(isDownAttack: boolean) {
    const p = playerRef.current;
    const comboStep = normalAttackComboCountRef.current || 1;
    let attackDamage = 1.0;
    let attackKnockback = 4.0;
    let attackRange = ATTACK_RANGE;
    let hitStopDuration = HIT_STOP_NORMAL;

    if (!isDownAttack && comboStep === 3) {
      // 3rd Strike: Combo Finisher (Heavy Crimson Slash)
      attackDamage = 1.5;
      attackKnockback = 6.0;
      attackRange = ATTACK_RANGE + 6;
      hitStopDuration = HIT_STOP_COMBO_FINISHER;
    }

    let attackBox: Rect;
    if (isDownAttack) {
      attackBox = {
        x: p.x - 4,
        y: p.y + p.h - 6,
        w: p.w + 8,
        h: 38,
      };
    } else {
      attackBox = {
        x: p.facing === 1 ? p.x + p.w - 4 : p.x - attackRange + 4,
        y: p.y + 4,
        w: attackRange,
        h: p.h - 8,
      };
    }

    let hitConnected = false;
    for (const e of enemiesRef.current) {
      if (!e.alive) continue;
      // Hanzo Execution Blow during HANZO_EXECUTION_PENDING:
      if (e.type === 'hanzo' && storyCinematicRef.current.phase === 'hanzo_execution_pending') {
        triggerHanzoExecutionBlow(e, p.facing);
        hitConnected = true;
        continue;
      }
      // Hanzo cannot be attacked during the boss intro sequence, death animation, or when dead
      if (e.type === 'hanzo' && (!bossIntroTriggeredRef.current || bossIntroTimerRef.current > 0 || e.state === 'death' || e.state === 'dead')) continue;
      if (rectsOverlap(attackBox, e)) {
        hitConnected = true;
        hitStopTimerRef.current = e.type === 'hanzo' ? HIT_STOP_BOSS_HIT : hitStopDuration;
        if (e.type === 'hanzo') {
          triggerHanzoHit(e, p.facing);
          registerHitCombo(attackDamage);
          p.energy = Math.min(p.maxEnergy, p.energy + 25);
          p.stamina = Math.min(p.maxStamina, p.stamina + 15);
          if (!p.onGround) {
            p.vy = -11;
            p.dashCooldown = 0;
            p.canDoubleJump = true;
          }
        } else {
          // Samurai guard deflection
          if (e.type === 'samurai' && e.state === 'guard') {
            e.hp -= 0.2;
            soundEffects.playParry();
            shakeRef.current = Math.max(shakeRef.current, 5);
            spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, p.facing, 2);
            e.vx = p.facing * 1.5;
            registerHitCombo(0.2);
            continue;
          }

          e.hp -= attackDamage;
          e.hurtCooldown = 20;
          soundEffects.playHit();
          registerHitCombo(attackDamage);

          // Refill Speed Dash Power & Stamina on hitting enemy! (+25 energy, +15 stamina)
          p.energy = Math.min(p.maxEnergy, p.energy + 25);
          p.stamina = Math.min(p.maxStamina, p.stamina + 15);

          // Spawn impact visual effect directly at the enemy hit location
          spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, p.facing, 2);

          // Knockback enemy
          e.vx = p.facing * attackKnockback;
          scoreRef.current += 50;

          // Hollow Knight style aerial pogo bounce, dash reset & double jump restore on down attack / airborne hit
          if (!p.onGround) {
            p.vy = -11;
            p.dashCooldown = 0;
            p.canDoubleJump = true;
          }

          if (e.hp <= 0) {
            e.alive = false;
            e.state = 'dead';
            e.deadTimer = 0;
            scoreRef.current += 150;
            registerEnemyKilled(e);
            // Heal ninja by half heart (0.5) when killing an enemy
            p.hp = Math.min(p.maxHp, p.hp + 0.5);
          }
        }
      }
    }

    if (hitConnected) {
      attackHitRegisteredRef.current = true;
    }
  }

  function applySkillHit(
    hitBox: Rect,
    damage: number,
    shakeAmount: number,
    hitSet: Set<number>,
    knockback: number = 4
  ) {
    const p = playerRef.current;
    shakeRef.current = Math.max(shakeRef.current, shakeAmount);

    for (const e of enemiesRef.current) {
      if (!e.alive) continue;
      if (e.type === 'hanzo' && storyCinematicRef.current.phase === 'hanzo_execution_pending') {
        triggerHanzoExecutionBlow(e, p.facing);
        continue;
      }
      if (e.type === 'hanzo' && (!bossIntroTriggeredRef.current || bossIntroTimerRef.current > 0 || e.state === 'death' || e.state === 'dead')) continue;
      if (rectsOverlap(hitBox, e)) {
        if (!hitSet.has(e.id)) {
          hitSet.add(e.id);
          hitStopTimerRef.current = e.type === 'hanzo' ? HIT_STOP_BOSS_HIT : HIT_STOP_SKILL;
          if (e.type === 'hanzo') {
            triggerHanzoHit(e, p.facing);
            registerHitCombo(damage);
            p.energy = Math.min(p.maxEnergy, p.energy + 25);
            p.stamina = Math.min(p.maxStamina, p.stamina + 20);
            spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, p.facing, 2);
          } else {
            if (e.type === 'samurai' && e.state === 'guard') {
              damage = Math.max(0.2, damage * 0.35);
              soundEffects.playParry();
            } else {
              soundEffects.playHit();
            }
            e.hp -= damage;
            e.hurtCooldown = 20;
            registerHitCombo(damage);
            p.energy = Math.min(p.maxEnergy, p.energy + 20);
            p.stamina = Math.min(p.maxStamina, p.stamina + 15);
            spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, p.facing, 2);
            e.vx = p.facing * knockback;
            scoreRef.current += 75;

            if (e.hp <= 0) {
              e.alive = false;
              e.state = 'dead';
              e.deadTimer = 0;
              scoreRef.current += 150;
              registerEnemyKilled(e);
              p.hp = Math.min(p.maxHp, p.hp + 0.5);
            }
          }
        }
      }
    }
  }

  function updateBladeWaves() {
    const level = levelRef.current;
    const p = playerRef.current;
    const surviving: BladeWaveProjectile[] = [];

    for (const bw of bladeWavesRef.current) {
      if (!bw.active) continue;
      bw.x += bw.vx;
      bw.lifetime += 1;
      bw.frame = (bw.frame + 1) % 6;

      if (
        bw.lifetime * Math.abs(bw.vx) >= bw.maxDistance ||
        bw.lifetime >= 70 ||
        bw.x < -40 ||
        bw.x > level.width + 40
      ) {
        bw.active = false;
        continue;
      }

      let hitObstacle = false;
      for (const pl of level.platforms) {
        if (pl.type === 'wall' && rectsOverlap(bw, pl)) {
          hitObstacle = true;
          spawnEffect('impact', bw.x, bw.y, bw.facing, 2);
          break;
        }
      }
      if (hitObstacle) {
        bw.active = false;
        continue;
      }

      let hitEnemy = false;
      for (const e of enemiesRef.current) {
        if (!e.alive) continue;
        if (e.type === 'hanzo' && (!bossIntroTriggeredRef.current || bossIntroTimerRef.current > 0 || e.state === 'death' || e.state === 'dead')) continue;
        if (rectsOverlap(bw, e)) {
          hitEnemy = true;
          if (e.type === 'hanzo') {
            triggerHanzoHit(e, bw.facing);
            registerHitCombo(2.5);
            p.energy = Math.min(p.maxEnergy, p.energy + 25);
            spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, bw.facing, 2);
            shakeRef.current = Math.max(shakeRef.current, 6);
          } else {
            e.hp -= 2.5;
            e.hurtCooldown = 20;
            soundEffects.playHit();
            registerHitCombo(2.5);
            p.energy = Math.min(p.maxEnergy, p.energy + 20);
            spawnEffect('impact', e.x + e.w / 2 - 32, e.y + e.h / 2 - 32, bw.facing, 2);
            e.vx = bw.facing * 5;
            scoreRef.current += 75;

            if (e.hp <= 0) {
              e.alive = false;
              e.state = 'dead';
              e.deadTimer = 0;
              scoreRef.current += 150;
              registerEnemyKilled(e);
              p.hp = Math.min(p.maxHp, p.hp + 0.5);
            }
          }
          break;
        }
      }

      if (hitEnemy) {
        bw.active = false;
        continue;
      }

      surviving.push(bw);
    }
    bladeWavesRef.current = surviving;
  }

  function spawnShuriken(x: number, y: number, facing: 1 | -1) {
    shurikensRef.current.push({
      id: nextShurikenIdRef.current++,
      x,
      y,
      w: 20,
      h: 20,
      vx: facing * SHURIKEN_SPEED,
      facing,
      frame: 0,
      lifetime: 0,
      distanceTraveled: 0,
      active: true,
    });
  }

  function updateShurikens() {
    const level = levelRef.current;
    const p = playerRef.current;
    const survivingShurikens: ShurikenProjectile[] = [];

    for (const s of shurikensRef.current) {
      if (!s.active) continue;

      // Advance physics
      s.x += s.vx;
      s.distanceTraveled += Math.abs(s.vx);
      s.lifetime += 1;
      s.frame = (s.frame + 1) % 14; // continuous rotation across the 14 frames

      // Max travel distance or lifetime limit or out of level bounds
      if (
        s.distanceTraveled >= MAX_SHURIKEN_DISTANCE ||
        s.lifetime >= 80 ||
        s.x < -40 ||
        s.x > level.width + 40
      ) {
        s.active = false;
        continue;
      }

      // Map collision: solid wall platforms destroy the shuriken
      let hitObstacle = false;
      for (const pl of level.platforms) {
        if (pl.type === 'wall' && rectsOverlap(s, pl)) {
          hitObstacle = true;
          break;
        }
      }
      if (hitObstacle) {
        s.active = false;
        continue;
      }

      // Check collision against all living enemies (including Boss Hanzo!)
      let hitEnemy = false;
      for (const e of enemiesRef.current) {
        if (!e.alive) continue;
        if (e.type === 'hanzo' && (!bossIntroTriggeredRef.current || bossIntroTimerRef.current > 0 || e.state === 'death' || e.state === 'dead')) continue;

        const shurikenBox: Rect = {
          x: s.x + 2,
          y: s.y + 2,
          w: s.w - 4,
          h: s.h - 4,
        };

        if (rectsOverlap(shurikenBox, e)) {
          hitEnemy = true;
          s.active = false;

          if (e.type === 'hanzo') {
            triggerHanzoHit(e, s.facing);
            registerHitCombo(SHURIKEN_DAMAGE);
          } else {
            // Apply damage via existing enemy health system
            e.hp -= SHURIKEN_DAMAGE;
            registerHitCombo(SHURIKEN_DAMAGE);
            if (e.hp <= 0) {
              e.hp = 0;
              e.alive = false;
              e.state = 'dead';
              e.deadTimer = 0;
              scoreRef.current += e.type === 'spirit' ? 200 : 150;
              registerEnemyKilled(e);
              // Heal ninja by half heart (0.5) when killing an enemy
              p.hp = Math.min(p.maxHp, p.hp + 0.5);
              soundEffects.playHit();
            } else {
              e.hurtCooldown = 18;
              e.state = 'hurt';
              soundEffects.playHit();
            }
          }

          // Spawn the Hit Effect GIF at the exact collision point
          const collisionX = s.x + s.w / 2 - 28;
          const collisionY = s.y + s.h / 2 - 28;
          shurikenHitsRef.current.push({
            id: nextHitEffectIdRef.current++,
            x: collisionX,
            y: collisionY,
            lifetime: 25, // 25 frames (~420ms duration of GIF)
            maxLifetime: 25,
          });

          shakeRef.current = Math.max(shakeRef.current, 3);
          break; // Register hit once, destroy shuriken
        }
      }

      if (s.active && !hitEnemy) {
        survivingShurikens.push(s);
      }
    }

    shurikensRef.current = survivingShurikens;

    // Decay and remove finished hit effects (after 25 frames / 420ms)
    shurikenHitsRef.current = shurikenHitsRef.current
      .map((h) => ({ ...h, lifetime: h.lifetime - 1 }))
      .filter((h) => h.lifetime > 0);
  }

  function damagePlayer(amount: number, useInvuln: boolean) {
    const p = playerRef.current;
    if (p.dashTimer > 0) return; // Invulnerable during active dash
    if (useInvuln && p.invuln > 0) return; // Invulnerable during i-frames
    p.isDoubleJumping = false;
    p.doubleJumpTimer = 0;
    p.doubleJumpFrame = undefined;
    p.activeSkill = undefined;
    p.skillTimer = 0;
    p.skillFrame = 0;
    p.attackHoldTimer = 0;
    p.hp -= amount;
    if (useInvuln) p.invuln = INVULN_DURATION;
    damageFlashRef.current = 1;
    shakeRef.current = Math.max(shakeRef.current, 10);
    p.anim = 'hurt';
    soundEffects.playHit();
    if (p.hp <= 0) {
      p.hp = 0;
      p.alive = false;
      p.deathTimer = 0;
      p.anim = 'dead';
      soundEffects.stopRunning();
      soundEffects.stopHanzoBattleMusic();
      soundEffects.stopHanzoIntro();
      if (extraLivesRef.current <= 0) {
        titleMusic.pause();
      }
      soundEffects.playGameOver();
    }
  }

  function startHanzoTelegraph(
    e: Enemy,
    type: 'rising' | 'spin' | 'teleport',
    isCombo: boolean,
    comboStep?: Enemy['comboStep'],
    targetX?: number,
    targetY?: number
  ) {
    const p = playerRef.current;
    e.state = 'idle';
    e.telegraph = type;
    e.comboActive = isCombo;
    e.comboStep = comboStep;
    e.vx = 0;
    e.facing = p.x >= e.x ? 1 : -1;

    if (type === 'rising') {
      e.telegraphTimer = HANZO_TELEGRAPH_RISING_TICKS;
      e.telegraphMaxTimer = HANZO_TELEGRAPH_RISING_TICKS;
      e.telegraphTargetX = undefined;
      e.telegraphTargetY = undefined;
      e.risingCooldown = Math.max(e.risingCooldown || 0, HANZO_TELEGRAPH_RISING_TICKS + (e.isEnraged ? 45 : 70));
      soundEffects.playHanzoTelegraphRising();
    } else if (type === 'spin') {
      e.telegraphTimer = HANZO_TELEGRAPH_SPIN_TICKS;
      e.telegraphMaxTimer = HANZO_TELEGRAPH_SPIN_TICKS;
      e.telegraphTargetX = undefined;
      e.telegraphTargetY = undefined;
      e.spinCooldown = Math.max(e.spinCooldown || 0, HANZO_TELEGRAPH_SPIN_TICKS + (e.isEnraged ? 35 : 55));
      soundEffects.playHanzoTelegraphSpin();
    } else if (type === 'teleport') {
      e.telegraphTimer = HANZO_TELEGRAPH_TELEPORT_TICKS;
      e.telegraphMaxTimer = HANZO_TELEGRAPH_TELEPORT_TICKS;
      e.telegraphTargetX = targetX;
      e.telegraphTargetY = targetY;
      e.teleportCooldown = Math.max(e.teleportCooldown || 0, HANZO_TELEGRAPH_TELEPORT_TICKS + (e.isEnraged ? 55 : 85));
      soundEffects.playHanzoTelegraphTeleport();
    }
  }

  function updateEnemies() {
    const p = playerRef.current;
    const level = levelRef.current;

    // Despawn non-boss enemies in Chinoike Jigoku when approaching or inside boss arena
    if (level.storyLocation === 'chinoike-jigoku' && (bossIntroTriggeredRef.current || p.x >= 6050)) {
      enemiesRef.current = enemiesRef.current.filter((e) => e.type === 'hanzo');
    }

    for (const e of enemiesRef.current) {
      if (!e.alive) {
        e.deadTimer += 1;
        e.state = 'dead';
        if (e.type === 'samurai') {
          e.animFrame = Math.min(5, Math.floor(e.deadTimer / 6));
        } else if (e.type === 'spirit' || (e.type as string) === 'corrupted_bat') {
          e.animFrame = Math.min(11, Math.floor(e.deadTimer / 5));
        }

        // Corrupted Bat / Wyvern 6-second respawn loop across the skies
        if (e.type === 'spirit' || (e.type as string) === 'corrupted_bat') {
          // Do not respawn bats inside the boss arena zone in Chinoike Jigoku
          if (level.storyLocation === 'chinoike-jigoku' && e.spawnX >= 5800) {
            continue;
          }
          if ((e.respawnTimer || 0) >= 0) {
            // Death animation completes at deadTimer = 60 (~1s), then 6s (360 frames) countdown begins
            if (e.deadTimer >= 60) {
              e.respawnTimer = (e.respawnTimer || 0) + 1;
              if (e.respawnTimer >= 360) {
                // Exactly 6.0 seconds elapsed: create a fresh Bat instance
                e.alive = true;
                e.hp = e.maxHp;
                e.x = e.spawnX;
                e.y = e.spawnY;
                e.vx = 0;
                e.vy = 0;
                e.facing = -1;
                e.state = 'spawn';
                e.spawnTimer = 36;
                e.deadTimer = 0;
                e.respawnTimer = 0;
                e.attackTimer = 0;
                e.attackCooldown = 60;
                e.hurtCooldown = 0;
                e.divePhase = undefined;
                e.diveTimer = 0;
              }
            }
          }
        }
        continue;
      }
      if (e.hurtCooldown > 0) e.hurtCooldown -= 1;
      if (e.attackCooldown > 0) e.attackCooldown -= 1;
      if (e.jumpCooldown !== undefined && e.jumpCooldown > 0) e.jumpCooldown -= 1;

      const dist = Math.abs(p.x - e.x);

      if (e.type === 'samurai') {
        if (e.turnCooldown && e.turnCooldown > 0) e.turnCooldown -= 1;
        if (e.guardCooldown && e.guardCooldown > 0) e.guardCooldown -= 1;
        if (e.lungeCooldown && e.lungeCooldown > 0) e.lungeCooldown -= 1;
        if (e.guardTimer && e.guardTimer > 0) {
          e.guardTimer -= 1;
          e.state = 'guard';
          e.vx *= 0.6;
        }

        // Airborne gravity & dynamic multi-platform collision (strictly platform-based, no groundY fallback)
        if (!e.onGround) {
          e.vy = Math.min((e.vy || 0) + GRAVITY, MAX_FALL);
          e.y += e.vy;
          let landedPlat: typeof level.platforms[0] | null = null;
          let highestSurface = Infinity;
          for (const pl of level.platforms) {
            if (pl.type !== 'wall' && e.x + e.w > pl.x && e.x < pl.x + pl.w) {
              if (e.y + e.h >= pl.y && e.y + e.h <= pl.y + 20 && (e.vy || 0) >= 0) {
                if (pl.y < highestSurface) {
                  highestSurface = pl.y;
                  landedPlat = pl;
                }
              }
            }
          }
          if (landedPlat) {
            e.y = landedPlat.y - e.h;
            e.vy = 0;
            e.onGround = true;
            spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
          }
        } else {
          // Verify solid ground is still underneath walking samurai (strictly platform-based)
          let groundUnderneath = false;
          for (const pl of level.platforms) {
            if (pl.type !== 'wall' && e.x + e.w > pl.x && e.x < pl.x + pl.w) {
              if (Math.abs(e.y + e.h - pl.y) <= 6) {
                groundUnderneath = true;
                break;
              }
            }
          }
          if (!groundUnderneath) {
            e.onGround = false;
          }
        }

        // Lethal Blood Sea death for samurai in Chinoike Jigoku (instant death upon touching blood)
        if (level.bloodPonds) {
          let inBlood = false;
          for (const bp of level.bloodPonds) {
            if (e.y + e.h >= bp.y && e.x + e.w > bp.x && e.x < bp.x + bp.w) {
              inBlood = true;
              break;
            }
          }
          if (inBlood) {
            e.hp = 0;
            e.alive = false;
            e.state = 'dead';
            e.deadTimer = 0;
            scoreRef.current += 150;
            registerEnemyKilled(e);
            spawnEffect('slash', e.x + e.w / 2 - 24, e.y + e.h / 2 - 24, 1, 2);
            continue;
          }
        }
        // Fall out of world safeguard
        if (e.y > (level.height || 900) + 50) {
          e.hp = 0;
          e.alive = false;
          e.state = 'dead';
          e.deadTimer = 0;
          registerEnemyKilled(e);
          continue;
        }

        // Priority 1: Damage / Hurt reaction
        if (e.hurtCooldown > 12) {
          e.state = 'hurt';
          e.vx *= 0.85; // Decelerate knockback
        }
        // Priority 2: Active Attack strike
        else if (e.attackTimer > 0) {
          e.attackTimer -= 1;
          e.state = 'attack';
          e.vx = 0;

          // Active sword strike damage window (frames 10-15 out of 24)
          if (e.attackTimer === 12) {
            const eAttackBox: Rect = {
              x: e.facing === 1 ? e.x + e.w : e.x - 38,
              y: e.y + 4,
              w: 38,
              h: e.h - 8,
            };

            const isDefending = (p.isDefending || p.parryAnimTimer > 0) && p.alive;
            const parryBox = getParryHitbox(p);

            if (isDefending && (rectsOverlap(eAttackBox, parryBox) || rectsOverlap(eAttackBox, p)) && !e.attackParried) {
              // PARRY SUCCESS: Deflect enemy attack, spawn Parry Effect, ninja takes 0 damage!
              e.attackParried = true;
              e.attackTimer = 0; // Consume attack immediately
              e.state = 'hurt';
              e.hurtCooldown = 28; // Stagger reaction
              e.vx = e.facing * -3.5; // Stagger backward

              p.parrySuccess = true;
              p.parryAnimTimer = 24; // Trigger 24-frame dynamic deflection swing!

              // Calculate exact collision intersection point
              const colX = (Math.max(eAttackBox.x, p.x) + Math.min(eAttackBox.x + eAttackBox.w, p.x + p.w)) / 2;
              const colY = (Math.max(eAttackBox.y, p.y) + Math.min(eAttackBox.y + eAttackBox.h, p.y + p.h)) / 2;

              parryHitsRef.current.push({
                id: nextParryHitIdRef.current++,
                x: colX,
                y: colY,
                isPerfect: true,
                lifetime: 24,
                maxLifetime: 24,
              });

              registerHitCombo(1);
              shakeRef.current = Math.max(shakeRef.current, 6);
              soundEffects.playHit();
              p.stamina = Math.min(p.maxStamina, p.stamina + 25);
              p.energy = Math.min(p.maxEnergy, p.energy + 25);
              scoreRef.current += 100;
            } else if (rectsOverlap(eAttackBox, p) && p.invuln <= 0 && p.dashTimer <= 0 && !e.attackParried) {
              damagePlayer(ENEMY_CONTACT_DAMAGE, true);
              spawnEffect('impact', p.x + p.w / 2 - 32, p.y + p.h / 2 - 32, e.facing, 2);
              spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
            }
          }
        }
        // Priority 2.5: Defensive Guard (raises sword guard against incoming player attack)
        else if (
          p.alive &&
          (p.attackTimer > 0 || p.activeSkill) &&
          dist < 65 &&
          Math.abs(p.y - e.y) < 40 &&
          (e.guardCooldown || 0) <= 0 &&
          e.onGround &&
          e.attackTimer <= 0
        ) {
          e.state = 'guard';
          e.guardTimer = 22;
          e.guardCooldown = 120;
          e.facing = p.x >= e.x ? 1 : -1;
          e.vx = e.facing * -1.0;
        }
        // Priority 3: Attack Trigger within 40px
        else if (dist < ENEMY_ATTACK_RANGE && p.alive && Math.abs(p.y - e.y) < 70 && e.attackCooldown <= 0) {
          e.state = 'attack';
          e.attackTimer = 24; // 8-frame strike duration
          e.attackCooldown = ENEMY_ATTACK_COOLDOWN; // 70-frame cooldown
          e.facing = p.x > e.x ? 1 : -1;
          e.vx = 0;
          e.attackParried = false; // Reset parry flag for fresh attack activation
          spawnEffect('slash', e.facing === 1 ? e.x + e.w - 10 : e.x - 50, e.y - 10, e.facing, 3);
        }
        // Priority 4: Airborne Jump state
        else if (!e.onGround) {
          e.state = 'jump';
        }
        // Priority 5: Jump Leap Trigger (e.g. player elevated above on platform or combat leap)
        else if (
          p.alive &&
          dist < 220 &&
          p.y < e.y - 30 &&
          p.y > e.y - 200 &&
          (e.jumpCooldown || 0) <= 0 &&
          e.onGround
        ) {
          e.vy = -11;
          e.onGround = false;
          e.state = 'jump';
          e.jumpCooldown = 130;
          e.facing = p.x >= e.x ? 1 : -1;
          e.vx = e.facing * 1.8;
          spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
        }
        // Priority 6: Smart Chase across entire Mastaba Platform Boundary
        else if (
          p.alive &&
          (!e.turnCooldown || e.turnCooldown <= 0) &&
          ((dist < ENEMY_DETECT_RANGE && Math.abs(p.y - e.y) < 180) ||
            (p.x >= e.patrolMin - 40 && p.x <= e.patrolMax + 40 && Math.abs(p.y - e.y) < 240))
        ) {
          e.state = 'chase';
          e.facing = p.x >= e.x ? 1 : -1;
          // Tactical Lunge Attack when closing distance
          if (dist > 35 && dist < 75 && (e.lungeCooldown || 0) <= 0 && e.onGround) {
            e.vx = e.facing * 3.4;
            e.lungeCooldown = 90;
            spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
          } else if (dist < 12) {
            e.vx = 0;
          } else {
            e.vx = e.facing * 2.2;
          }
        }
        // Priority 7: Patrol within assigned platform boundaries
        else {
          e.state = 'patrol';
          if (e.x <= e.patrolMin) e.facing = 1;
          if (e.x >= e.patrolMax) e.facing = -1;
          e.vx = e.facing * 0.7;
        }

        // Obstacle (Spike) & Hazard detection: Samurai senses obstacles and will NEVER move into them
        let obstacleAhead = false;
        const testX = e.x + e.vx + (e.facing === 1 ? e.w + 14 : -14);
        for (const sp of level.spikes) {
          if (testX >= sp.x - 14 && testX <= sp.x + sp.w + 14 && e.y + e.h >= sp.y - 14) {
            obstacleAhead = true;
            break;
          }
        }

        // Platform Ledge / Chasm detection: ensures solid ground is underneath forward step (strictly platform-based)
        let groundAhead = false;
        const footX = e.x + (e.facing === 1 ? e.w + 8 : -8);
        const footY = e.y + e.h + 8;
        for (const pl of level.platforms) {
          if (pl.type !== 'wall' && footX >= pl.x && footX <= pl.x + pl.w) {
            if (pl.y >= e.y + e.h - 4 && pl.y <= e.y + e.h + 20) {
              groundAhead = true;
              break;
            }
          }
        }

        if ((obstacleAhead || (!groundAhead && e.onGround)) && e.state !== 'hurt') {
          if (!e.turnCooldown || e.turnCooldown <= 0) {
            e.facing = e.facing === 1 ? -1 : 1;
            e.turnCooldown = 32; // 0.5s turn cooldown to eliminate 60Hz edge jitter
            e.state = 'patrol';
            e.vx = e.facing * 0.9;
          }
        }

        // Apply horizontal movement
        e.x += e.vx;

        // Platform-aware boundary safety: prevent intentional patrol past current platform edges
        if (e.onGround && e.state === 'patrol') {
          for (const pl of level.platforms) {
            if (pl.type !== 'wall' && e.x + e.w > pl.x && e.x < pl.x + pl.w && Math.abs(e.y + e.h - pl.y) <= 6) {
              if (e.x < pl.x + 8 && e.facing === -1) {
                e.x = pl.x + 8;
                e.facing = 1;
                e.turnCooldown = 28;
              } else if (e.x + e.w > pl.x + pl.w - 8 && e.facing === 1) {
                e.x = pl.x + pl.w - e.w - 8;
                e.facing = -1;
                e.turnCooldown = 28;
              }
              break;
            }
          }
        }

        if (e.x < e.patrolMin) { e.x = e.patrolMin; e.facing = 1; e.turnCooldown = 28; }
        if (e.x > e.patrolMax) { e.x = e.patrolMax; e.facing = -1; e.turnCooldown = 28; }

        // Hard obstacle barrier: completely prevents Samurai from standing or moving inside any spike obstacle
        for (const sp of level.spikes) {
          if (rectsOverlap(e, { x: sp.x - 4, y: sp.y - 8, w: sp.w + 8, h: sp.h + 8 })) {
            if (e.x + e.w / 2 < sp.x + sp.w / 2) {
              e.x = sp.x - e.w - 14;
              e.facing = -1;
            } else {
              e.x = sp.x + sp.w + 14;
              e.facing = 1;
            }
            e.vx = 0;
          }
        }

        const samState = e.state as string;
        if (samState === 'attack') {
          e.attackFrame = Math.min(7, Math.floor((24 - e.attackTimer) / 3));
        } else {
          e.attackFrame = undefined;
          if (samState === 'idle') e.animFrame = Math.floor(gameTickRef.current / 7) % 5;
          else if (samState === 'patrol') e.animFrame = Math.floor(gameTickRef.current / 6) % 5;
          else if (samState === 'chase') e.animFrame = Math.floor(gameTickRef.current / 5) % 6;
          else if (samState === 'jump') e.animFrame = Math.min(7, Math.floor(gameTickRef.current / 5) % 8);
          else if (samState === 'hurt') e.animFrame = Math.min(3, Math.floor((20 - e.hurtCooldown) / 5));
          else if (samState === 'guard') e.animFrame = 0;
        }
      } else if (e.type === 'spirit' || (e.type as string) === 'corrupted_bat') {
        // Priority 0: Manifesting / Appear animation phase after spawn
        if (e.spawnTimer && e.spawnTimer > 0) {
          e.spawnTimer -= 1;
          e.state = 'spawn';
          e.vx = 0;
          e.vy = 0;
          if (e.spawnTimer === 0) {
            e.state = 'idle';
          }
          continue; // Cannot attack while appearing
        }

        // Priority 1: Damage / Hurt reaction
        if (e.hurtCooldown > 10) {
          e.state = 'hurt';
          e.vx *= 0.8;
          e.vy *= 0.8;
        }
        // Priority 2: Active Claw strike
        else if (e.attackTimer > 0) {
          e.attackTimer -= 1;
          e.state = 'attack';
          e.attackType = 'claw';

          // Active claw strike damage window (frames 3-6 out of 8, timer 6 to 15)
          if (e.attackTimer >= 6 && e.attackTimer <= 15) {
            const clawBox: Rect = {
              x: e.facing === 1 ? e.x + e.w - 4 : e.x - 36,
              y: e.y - 6,
              w: 40,
              h: e.h + 12,
            };

            const isDefending = (p.isDefending || p.parryAnimTimer > 0) && p.alive;
            const parryBox = getParryHitbox(p);

            if (isDefending && (rectsOverlap(clawBox, parryBox) || rectsOverlap(clawBox, p)) && !e.attackParried) {
              e.attackParried = true;
              e.attackTimer = 0;
              e.attackCooldown = 80;
              e.state = 'hurt';
              e.hurtCooldown = 24;
              e.vx = e.facing * -4;
              e.vy = -3.5;

              p.parrySuccess = true;
              p.parryAnimTimer = 24;

              const colX = (Math.max(clawBox.x, p.x) + Math.min(clawBox.x + clawBox.w, p.x + p.w)) / 2;
              const colY = (Math.max(clawBox.y, p.y) + Math.min(clawBox.y + clawBox.h, p.y + p.h)) / 2;

              parryHitsRef.current.push({
                id: nextParryHitIdRef.current++,
                x: colX,
                y: colY,
                isPerfect: true,
                lifetime: 24,
                maxLifetime: 24,
              });

              registerHitCombo(1);
              shakeRef.current = Math.max(shakeRef.current, 6);
              soundEffects.playHit();
              p.stamina = Math.min(p.maxStamina, p.stamina + 25);
              p.energy = Math.min(p.maxEnergy, p.energy + 25);
              scoreRef.current += 100;
            } else if (rectsOverlap(clawBox, p) && p.invuln <= 0 && p.dashTimer <= 0 && !e.attackParried) {
              damagePlayer(ENEMY_CONTACT_DAMAGE, true);
              spawnEffect('impact', p.x + p.w / 2 - 32, p.y + p.h / 2 - 32, e.facing, 2);
            }
          }

          // When claw attack completes, initiate ascent retreat
          if (e.attackTimer === 0) {
            e.divePhase = 'ascent';
            e.diveTimer = 28;
            e.vy = -3.8;
          }
        }
        // Priority 2.5: Ascent Retreat Phase (swoop up into the skies after strike)
        else if (e.divePhase === 'ascent' && (e.diveTimer || 0) > 0) {
          e.diveTimer = (e.diveTimer || 0) - 1;
          e.state = 'fly';
          e.vy = -3.2;
          e.vx = e.facing * 2.0;
          if (e.diveTimer <= 0) {
            e.divePhase = undefined;
          }
        }
        // Priority 3: Dive-Bomb Swoop Attack Phase (BAT_DIVE_FRAMES)
        else if (e.divePhase === 'dive' && (e.diveTimer || 0) > 0) {
          e.diveTimer = (e.diveTimer || 0) - 1;
          e.state = 'dive';
          const dx = p.x - e.x;
          e.facing = dx >= 0 ? 1 : -1;
          e.vx = e.facing * 4.2;
          e.vy = 3.6;

          // Transition to claw strike when reaching ninja
          if (dist < 46 && Math.abs(p.y - e.y) < 45 && p.alive) {
            e.state = 'attack';
            e.attackType = 'claw';
            e.attackTimer = 20;
            e.attackCooldown = 85;
            e.divePhase = undefined;
            e.diveTimer = 0;
            e.attackParried = false;
            spawnEffect('slash', e.facing === 1 ? e.x + e.w - 8 : e.x - 48, e.y - 8, e.facing, 3);
          } else if (e.diveTimer <= 0 || e.y >= (level.storyLocation === 'chinoike-jigoku' ? level.height - 130 : level.groundY - 60)) {
            // Pull up before hitting ground
            e.divePhase = 'ascent';
            e.diveTimer = 26;
            e.vy = -3.6;
          }
        }
        // Priority 3.5: Close Melee Claw Attack within 44px
        else if (dist < 44 && Math.abs(p.y - e.y) < 42 && p.alive && (e.attackCooldown || 0) <= 0) {
          e.state = 'attack';
          e.attackType = 'claw';
          e.attackTimer = 20;
          e.attackCooldown = 80;
          e.facing = p.x > e.x ? 1 : -1;
          e.vx = 0;
          e.vy = 0;
          e.attackParried = false;
          spawnEffect('slash', e.facing === 1 ? e.x + e.w - 8 : e.x - 48, e.y - 8, e.facing, 3);
        }
        // Priority 4: Initiate Dive-Bomb when hovering above the ninja
        else if (
          p.alive &&
          dist > 50 &&
          dist < 280 &&
          p.y > e.y + 35 &&
          (e.attackCooldown || 0) <= 0 &&
          !e.divePhase
        ) {
          e.divePhase = 'dive';
          e.diveTimer = 44;
          e.state = 'dive';
        }
        // Priority 5: Smart Stalking Flight (Hover & circle at safe altitude above ninja, never scrape floor!)
        else if (p.alive && (dist < 500 || Math.hypot(p.x - e.x, p.y - e.y) < 520)) {
          e.state = 'chase';
          const targetY = Math.max(60, p.y - 75 + Math.sin(timeRef.current * 2.2 + e.id) * 22);
          const dx = p.x - e.x;
          const dy = targetY - e.y;
          const len = Math.hypot(dx, dy) || 1;
          e.facing = dx >= 0 ? 1 : -1;
          e.vx = (dx / len) * 2.5;
          e.vy = (dy / len) * 2.2;
        }
        // Priority 6: Free patrol flight everywhere in the sky of the level
        else {
          e.state = 'fly';
          if (e.x <= 40) e.facing = 1;
          if (e.x >= level.width - 80) e.facing = -1;
          e.vx = e.facing * 1.6;
          e.vy = Math.sin(timeRef.current * 1.5 + e.id) * 1.2;
        }

        // Apply 2D flight velocity
        e.x += e.vx;
        e.y += e.vy;

        // Ground Pull-Up Safeguard: bats are airborne and will bounce back up if they get near the floor
        const groundLimit = (level.storyLocation === 'chinoike-jigoku' ? level.height - 110 : level.groundY - 50);
        if (e.y >= groundLimit) {
          e.y = groundLimit;
          if (e.vy > 0) e.vy = -2.8; // upward bounce
        }

        if (level.storyLocation === 'chinoike-jigoku') {
          const minBatX = 40;
          const maxBatX = 6000;
          if (e.x < minBatX) { e.x = minBatX; e.vx = Math.abs(e.vx || 1.6); e.facing = 1; }
          if (e.x > maxBatX) { e.x = maxBatX; e.vx = -Math.abs(e.vx || 1.6); e.facing = -1; }
          const maxBatY = level.height - 110;
          if (e.y < 60) e.y = 60;
          if (e.y > maxBatY) e.y = maxBatY;
        } else {
          if (e.x < 20) { e.x = 20; e.facing = 1; }
          if (e.x > level.width - 50) { e.x = level.width - 50; e.facing = -1; }
          if (e.y < 60) e.y = 60;
        }

        const batState = e.state as string;
        if (batState === 'spawn') e.animFrame = Math.min(5, Math.floor((36 - (e.spawnTimer || 0)) / 6));
        else if (batState === 'hurt') e.animFrame = Math.min(3, Math.floor((20 - e.hurtCooldown) / 5));
        else if (batState === 'dive') e.animFrame = Math.floor(gameTickRef.current / 4) % 6;
        else if (batState === 'attack' || batState === 'claw_attack') e.animFrame = Math.floor(gameTickRef.current / 4) % 4;
        else if (batState === 'fly' || batState === 'chase') e.animFrame = Math.floor(gameTickRef.current / 4) % 4;
        else e.animFrame = Math.floor(gameTickRef.current / 6) % 4;
      } else if (e.type === 'hanzo') {
        // STATE 0: DEATH STATE & CINEMATIC PROGRESSION (ABSOLUTE PRIORITY)
        if (e.state === 'death') {
          e.vx = 0;
          e.vy = 0;
          if (!e.onGround) {
            e.y = 280 - e.h;
            e.onGround = true;
          }

          const sc = storyCinematicRef.current;

          // HOLD FRAME: In execution pending, final dialogue, or choice, freeze permanently on death_hanzo_4!
          if (
            sc.phase === 'hanzo_execution_pending' ||
            sc.phase === 'final_dialogue' ||
            sc.phase === 'unknown_reveal' ||
            sc.phase === 'choice_waiting' ||
            sc.phase === 'hanzo_defeated'
          ) {
            e.deathFrame = 3; // death_hanzo_4 HOLD FRAME
            continue;
          }

          // KILL BRANCH: Continues strictly after physical player attack hit connected!
          if (sc.phase === 'hanzo_death_continue') {
            e.deadTimer += 1;
            const dt = e.deadTimer;
            if (dt <= 34) {
              e.deathFrame = 4; // death_hanzo_5
            } else if (dt <= 40) {
              e.deathFrame = 5; // death_hanzo_6
            } else if (dt <= 46) {
              e.deathFrame = 6; // death_hanzo_7
            } else if (dt <= 52) {
              e.deathFrame = 7; // death_hanzo_8
              if (dt === 47) {
                shakeRef.current = Math.max(shakeRef.current, 5);
                spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
              }
            } else if (dt <= 58) {
              e.deathFrame = 8; // death_hanzo_9
            } else if (dt <= 64) {
              e.deathFrame = 9; // death_hanzo_10
            } else if (dt <= 70) {
              e.deathFrame = 10; // death_hanzo_11
            } else if (dt <= 76) {
              e.deathFrame = 11; // death_hanzo_12
            } else {
              e.deathFrame = 12; // death_hanzo_13 (final death frame)
              if (dt >= 95) {
                e.alive = false;
                e.state = 'dead';
                sc.phase = 'hanzo_dead';
                sc.timer = 0;
                hanzoDefeatedRef.current = true;
              }
            }
            continue;
          }

          // Initial fall ticks leading to death_hanzo_4
          e.deadTimer += 1;
          const dt = e.deadTimer;
          if (dt <= 12) {
            e.deathFrame = 0; // death_hanzo_1
          } else if (dt <= 17) {
            e.deathFrame = 1; // death_hanzo_2
          } else if (dt <= 22) {
            e.deathFrame = 2; // death_hanzo_3
          } else {
            // REACHED death_hanzo_4! STOP AND HOLD!
            e.deathFrame = 3; // death_hanzo_4
            if (!sc.active || sc.phase === 'none') {
              startFinalCutscene(e);
            }
          }
          continue; // DEATH LOCK: disable AI, movement, jump, attacks, timers!
        }

        if (e.state === 'dead' || !e.alive) {
          continue;
        }

        // STATE 1: DAMAGE / HURT ANIMATION
        if (e.state === 'hurt') {
          e.hurtCooldown -= 1;
          e.vx *= 0.85;

          // 18 ticks total (~295ms):
          // Frame 0 (ticks 18..15): damage_hanzo_1 (65ms)
          // Frame 1 (ticks 14..11): damage_hanzo_2 (65ms)
          // Frame 2 (ticks 10..7):  damage_hanzo_3 (75ms)
          // Frame 3 (ticks 6..1):   damage_hanzo_4 (90ms)
          if (e.hurtCooldown > 14) {
            e.damageFrame = 0;
          } else if (e.hurtCooldown > 10) {
            e.damageFrame = 1;
          } else if (e.hurtCooldown > 6) {
            e.damageFrame = 2;
          } else {
            e.damageFrame = 3;
          }

          if (e.hurtCooldown <= 0) {
            e.state = 'idle';
            e.damageFrame = undefined;
            e.vx = 0;
          }

          if (e.state === 'hurt') {
            // Keep grounded and bounded during hurt stagger
            if (!e.onGround) {
              e.vy = Math.min((e.vy || 0) + GRAVITY, MAX_FALL);
              e.y += e.vy;
              for (const pl of level.platforms) {
                if (pl.type !== 'wall' && e.x + e.w > pl.x && e.x < pl.x + pl.w) {
                  if (e.y + e.h >= pl.y && e.y + e.h <= pl.y + 16 && (e.vy || 0) >= 0) {
                    e.y = pl.y - e.h;
                    e.vy = 0;
                    e.onGround = true;
                    break;
                  }
                }
              }
            }
            e.x += e.vx;
            if (e.x < 6110) { e.x = 6110; e.vx = 0; }
            if (e.x > 7460) { e.x = 7460; e.vx = 0; }
            continue;
          }
        }

        // UNTIL TITLE CARD ENDS: Hanzo stays strictly in IDLE state at his arena position!
        if (!bossIntroTriggeredRef.current || bossIntroTimerRef.current > 0) {
          e.state = 'idle';
          e.x = 6750;
          e.y = 280 - e.h;
          e.vx = 0;
          e.vy = 0;
          e.onGround = true;
          e.facing = -1;
          e.attackTimer = 0;
          e.comboActive = false;
          e.comboStep = undefined;
          e.jumpPhase = undefined;
          e.jumpFrame = undefined;
          e.jumpTimer = 0;
          e.hitConnected = false;
          e.attackParried = false;
          continue; // Complete combat freeze: Hanzo remains in IDLE until title card finishes!
        }

        // Enraged Phase check (HP <= 50% maxHp: 5 hits remaining)
        if (e.hp <= (e.maxHp ? e.maxHp / 2 : 5)) {
          e.isEnraged = true;
        }

        // Decrement Hanzo boss ability & combo cooldowns
        if (e.dashCooldown !== undefined && e.dashCooldown > 0) e.dashCooldown -= 1;
        if (e.spinCooldown !== undefined && e.spinCooldown > 0) e.spinCooldown -= 1;
        if (e.risingCooldown !== undefined && e.risingCooldown > 0) e.risingCooldown -= 1;
        if (e.teleportCooldown !== undefined && e.teleportCooldown > 0) e.teleportCooldown -= 1;
        if (e.comboCooldown !== undefined && e.comboCooldown > 0) e.comboCooldown -= 1;
        if (e.jumpCooldown !== undefined && e.jumpCooldown > 0) e.jumpCooldown -= 1;

        // Airborne gravity & platform collision
        if (!e.onGround) {
          e.vy = Math.min((e.vy || 0) + GRAVITY, MAX_FALL);
          e.y += e.vy;
          for (const pl of level.platforms) {
            if (pl.type !== 'wall' && e.x + e.w > pl.x && e.x < pl.x + pl.w) {
              if (e.y + e.h >= pl.y && e.y + e.h <= pl.y + 16 && (e.vy || 0) >= 0) {
                e.y = pl.y - e.h;
                e.vy = 0;
                e.onGround = true;

                // REAL LANDING COLLISION TRIGGER FOR HANZO JUMP:
                if (e.state === 'jump' && (e.jumpPhase === 'launch' || e.jumpPhase === 'airborne' || e.jumpPhase === 'descent')) {
                  e.jumpPhase = 'landing';
                  e.jumpTimer = 9;
                  e.jumpFrame = 12; // jump_hanzo_13.png
                  e.vx = 0;
                  spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
                  soundEffects.playHit();
                }
                break;
              }
            }
          }
        }

        const isDefending = (p.isDefending || p.parryAnimTimer > 0) && p.alive;
        const parryBox = getParryHitbox(p);

        // State 1.5: Active Hanzo Attack Telegraph System
        if (e.telegraph && e.telegraph !== 'none') {
          e.vx = 0;
          e.telegraphTimer = (e.telegraphTimer || 0) - 1;

          // Camera feedback:
          // Rising Slash: very small anticipation camera movement
          if (e.telegraph === 'rising' && e.telegraphTimer === Math.floor(HANZO_TELEGRAPH_RISING_TICKS / 2)) {
            shakeRef.current = Math.max(shakeRef.current, 1);
          }
          // Spin Slash: small camera pulse
          else if (e.telegraph === 'spin' && e.telegraphTimer === Math.floor(HANZO_TELEGRAPH_SPIN_TICKS / 2)) {
            shakeRef.current = Math.max(shakeRef.current, 1.2);
          }

          if (e.telegraphTimer <= 0) {
            const currentTelegraph = e.telegraph;
            e.telegraph = 'none';
            e.telegraphTimer = 0;
            e.telegraphMaxTimer = 0;

            if (currentTelegraph === 'rising') {
              e.state = 'rising_attack';
              e.attackTimer = 18;
              e.facing = p.x >= e.x ? 1 : -1;
              e.vy = -8.5;
              e.onGround = false;
              e.hitConnected = false;
              e.attackParried = false;
              spawnEffect('slash', e.facing === 1 ? e.x + e.w : e.x - 30, e.y - 16, e.facing, 3);
              soundEffects.playSlash();
            } else if (currentTelegraph === 'spin') {
              e.state = 'spin_attack';
              e.attackTimer = 20;
              e.facing = p.x >= e.x ? 1 : -1;
              e.hitConnected = false;
              e.attackParried = false;
              spawnEffect('slash', e.facing === 1 ? e.x + e.w : e.x - 40, e.y - 10, e.facing, 3);
              shakeRef.current = Math.max(shakeRef.current, 4);
              soundEffects.playSlash();
            } else if (currentTelegraph === 'teleport') {
              e.state = 'teleport_attack';
              e.teleportTimer = 34; // Extended so all 12 frames of HANZO_TELEPORT_FRAMES play clearly!
              const heading = p.vx !== 0 ? (p.vx > 0 ? 1 : -1) : p.facing;
              e.teleportDestX = e.telegraphTargetX ?? (p.x + (heading === 1 ? 56 : -56));
              e.teleportDestY = e.telegraphTargetY ?? (280 - e.h);
              e.hitConnected = false;
              e.attackParried = false;
              soundEffects.playHanzoTeleport();
            }
          }
          continue; // ATTACK LOCK: AI, movement, jump, or another attack cannot overwrite!
        }

        // State 2: Active Teleport Attack sequence (Signature Finisher)
        if (e.state === 'teleport_attack') {
          e.teleportTimer = (e.teleportTimer || 0) - 1;

          if (e.teleportTimer > 24) {
            // Disappear phase: dissolving into shadows (invulnerable during travel)
            e.teleportPhase = 'disappear';
            e.vx = 0;
            e.vy = 0;
          } else if (e.teleportTimer === 24) {
            // Instant teleport reposition to validated destination directly in player's path
            e.x = e.teleportDestX ?? e.x;
            e.y = e.teleportDestY ?? e.y;
            e.facing = p.x >= e.x ? 1 : -1;
            e.teleportPhase = 'reappear';
            e.vx = 0;
            e.vy = 0;
            shakeRef.current = Math.max(shakeRef.current, 3); // Camera response when Hanzo reappears
            spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
            soundEffects.playEtherealTetherPulse();
            // Spawn afterimage on reappearance
            hanzoGhostsRef.current.push({
              id: nextHanzoGhostIdRef.current++,
              x: e.x,
              y: e.y,
              facing: e.facing,
              state: 'teleport_attack',
              alpha: 0.85,
            });
          } else if (e.teleportTimer >= 10 && e.teleportTimer <= 20) {
            // Active Strike window!
            e.teleportPhase = 'strike';
            e.vx = e.facing * 1.0;

            const strikeBox: Rect = {
              x: e.facing === 1 ? e.x + e.w - 8 : e.x - 48,
              y: e.y + 4,
              w: 52,
              h: e.h - 6,
            };

            if (isDefending && (rectsOverlap(strikeBox, parryBox) || rectsOverlap(strikeBox, p)) && !e.attackParried) {
              // PARRY SUCCESS: Deflect Hanzo's strike!
              e.attackParried = true;
              e.comboActive = false;
              e.comboStep = undefined;
              e.teleportTimer = 0;
              e.state = 'hurt';
              e.damageFrame = 0;
              e.hurtCooldown = 28;
              e.vx = e.facing * -4.5;
              p.parrySuccess = true;
              p.parryAnimTimer = 24;

              const colX = (Math.max(strikeBox.x, p.x) + Math.min(strikeBox.x + strikeBox.w, p.x + p.w)) / 2;
              const colY = (Math.max(strikeBox.y, p.y) + Math.min(strikeBox.y + strikeBox.h, p.y + p.h)) / 2;
              parryHitsRef.current.push({
                id: nextParryHitIdRef.current++,
                x: colX,
                y: colY,
                isPerfect: true,
                lifetime: 24,
                maxLifetime: 24,
              });
              shakeRef.current = Math.max(shakeRef.current, 8);
              soundEffects.playHit();
              p.stamina = Math.min(p.maxStamina, p.stamina + 30);
              p.energy = Math.min(p.maxEnergy, p.energy + 30);
              scoreRef.current += 200;
            } else if (rectsOverlap(strikeBox, p) && p.invuln <= 0 && p.dashTimer <= 0 && !e.hitConnected && !e.attackParried) {
              // Connects with player: Deal 2.5 hearts damage and trigger hit effect hanzo.gif!
              e.hitConnected = true;
              damagePlayer(2.5, true);
              const hitX = (Math.max(strikeBox.x, p.x) + Math.min(strikeBox.x + strikeBox.w, p.x + p.w)) / 2;
              const hitY = (Math.max(strikeBox.y, p.y) + Math.min(strikeBox.y + strikeBox.h, p.y + p.h)) / 2;
              hanzoHitEffectRef.current = {
                id: nextHanzoHitEffectIdRef.current++,
                x: hitX,
                y: hitY,
                facing: e.facing,
                lifetime: 36,
                maxLifetime: 36,
              };
              spawnEffect('impact', p.x + p.w / 2 - 32, p.y + p.h / 2 - 32, e.facing, 2);
            }
          }

          if (e.teleportTimer <= 0) {
            const wasParried = e.attackParried;
            e.hitConnected = false;
            e.attackParried = false;
            e.teleportPhase = 'recover';

            // SMART ATTACK CHAINING: After Teleport Strike, intelligently follow up with Spin Slash or Rising Slash
            if (!wasParried && p.alive && (e.comboActive || Math.random() < 0.75)) {
              const currentDist = Math.abs(p.x - e.x);
              // Branch A: If player jumped or is elevated, immediately punish with Rising Slash!
              if ((!p.onGround || p.y < e.y - 20) && currentDist < 150) {
                startHanzoTelegraph(e, 'rising', true, 'rising');
                continue;
              }
              // Branch B: If player is grounded nearby, immediately unleash Spin Slash!
              else if (currentDist < 110 && Math.abs(p.y - e.y) < 60) {
                startHanzoTelegraph(e, 'spin', true, 'spin');
                continue;
              }
            }

            e.state = 'idle';
            e.teleportCooldown = e.isEnraged ? 55 : 85;
            e.comboActive = false;
            e.comboStep = undefined;
            e.comboCooldown = e.isEnraged ? 45 : 70;
          }
        }
        // State 3: Active Spin Attack (Step 1 of Master Combo, or individual attack)
        else if (e.state === 'spin_attack') {
          e.attackTimer -= 1;
          e.vx = e.facing * 1.0;

          // Spawn afterimages during spin
          if (e.attackTimer % 4 === 0) {
            hanzoGhostsRef.current.push({
              id: nextHanzoGhostIdRef.current++,
              x: e.x,
              y: e.y,
              facing: e.facing,
              state: 'spin_attack',
              alpha: 0.6,
            });
          }

          if (e.attackTimer >= 6 && e.attackTimer <= 14) {
            const spinBox: Rect = {
              x: e.x - 28,
              y: e.y + 4,
              w: e.w + 56,
              h: e.h - 6,
            };

            if (isDefending && (rectsOverlap(spinBox, parryBox) || rectsOverlap(spinBox, p)) && !e.attackParried) {
              e.attackParried = true;
              e.comboActive = false;
              e.comboStep = undefined;
              e.attackTimer = 0;
              e.state = 'hurt';
              e.damageFrame = 0;
              e.hurtCooldown = 24;
              e.vx = e.facing * -3.5;
              p.parrySuccess = true;
              p.parryAnimTimer = 24;

              const colX = (Math.max(spinBox.x, p.x) + Math.min(spinBox.x + spinBox.w, p.x + p.w)) / 2;
              const colY = (Math.max(spinBox.y, p.y) + Math.min(spinBox.y + spinBox.h, p.y + p.h)) / 2;
              parryHitsRef.current.push({
                id: nextParryHitIdRef.current++,
                x: colX,
                y: colY,
                isPerfect: true,
                lifetime: 24,
                maxLifetime: 24,
              });
              shakeRef.current = Math.max(shakeRef.current, 6);
              soundEffects.playHit();
            } else if (rectsOverlap(spinBox, p) && p.invuln <= 0 && p.dashTimer <= 0 && !e.hitConnected && !e.attackParried) {
              e.hitConnected = true;
              damagePlayer(1.5, true);
              const hitX = (Math.max(spinBox.x, p.x) + Math.min(spinBox.x + spinBox.w, p.x + p.w)) / 2;
              const hitY = (Math.max(spinBox.y, p.y) + Math.min(spinBox.y + spinBox.h, p.y + p.h)) / 2;
              hanzoHitEffectRef.current = {
                id: nextHanzoHitEffectIdRef.current++,
                x: hitX,
                y: hitY,
                facing: e.facing,
                lifetime: 36,
                maxLifetime: 36,
              };
              spawnEffect('impact', p.x + p.w / 2 - 32, p.y + p.h / 2 - 32, e.facing, 2);
            }
          }

          if (e.attackTimer <= 0) {
            e.hitConnected = false;
            e.attackParried = false;

            // SMART ATTACK CHAINING: Spin Slash fluidly chains into Rising Slash!
            if (e.comboActive || Math.random() < 0.75) {
              startHanzoTelegraph(e, 'rising', true, 'rising');
              continue;
            } else {
              e.state = 'idle';
              e.spinCooldown = e.isEnraged ? 35 : 55;
            }
          }
        }
        // State 4: Active Rising Attack (Step 2 of Master Combo, or individual anti-air)
        else if (e.state === 'rising_attack') {
          e.attackTimer -= 1;
          e.vx = e.facing * 1.5;

          // Spawn afterimages during rising leap
          if (e.attackTimer % 3 === 0) {
            hanzoGhostsRef.current.push({
              id: nextHanzoGhostIdRef.current++,
              x: e.x,
              y: e.y,
              facing: e.facing,
              state: 'rising_attack',
              alpha: 0.65,
            });
          }

          if (e.attackTimer >= 6 && e.attackTimer <= 13) {
            const risingBox: Rect = {
              x: e.facing === 1 ? e.x + 8 : e.x - 38,
              y: e.y - 18,
              w: 44,
              h: e.h + 18,
            };

            if (isDefending && (rectsOverlap(risingBox, parryBox) || rectsOverlap(risingBox, p)) && !e.attackParried) {
              e.attackParried = true;
              e.comboActive = false;
              e.comboStep = undefined;
              e.attackTimer = 0;
              e.state = 'hurt';
              e.damageFrame = 0;
              e.hurtCooldown = 24;
              e.vx = e.facing * -3.5;
              p.parrySuccess = true;
              p.parryAnimTimer = 24;

              const colX = (Math.max(risingBox.x, p.x) + Math.min(risingBox.x + risingBox.w, p.x + p.w)) / 2;
              const colY = (Math.max(risingBox.y, p.y) + Math.min(risingBox.y + risingBox.h, p.y + p.h)) / 2;
              parryHitsRef.current.push({
                id: nextParryHitIdRef.current++,
                x: colX,
                y: colY,
                isPerfect: true,
                lifetime: 24,
                maxLifetime: 24,
              });
              shakeRef.current = Math.max(shakeRef.current, 6);
              soundEffects.playHit();
            } else if (rectsOverlap(risingBox, p) && p.invuln <= 0 && p.dashTimer <= 0 && !e.hitConnected && !e.attackParried) {
              e.hitConnected = true;
              damagePlayer(1.5, true);
              const hitX = (Math.max(risingBox.x, p.x) + Math.min(risingBox.x + risingBox.w, p.x + p.w)) / 2;
              const hitY = (Math.max(risingBox.y, p.y) + Math.min(risingBox.y + risingBox.h, p.y + p.h)) / 2;
              hanzoHitEffectRef.current = {
                id: nextHanzoHitEffectIdRef.current++,
                x: hitX,
                y: hitY,
                facing: e.facing,
                lifetime: 36,
                maxLifetime: 36,
              };
              spawnEffect('impact', p.x + p.w / 2 - 32, p.y + p.h / 2 - 32, e.facing, 2);
            }
          }

          if (e.attackTimer <= 0) {
            e.hitConnected = false;
            e.attackParried = false;

            // SMART ATTACK CHAINING: Rising Slash in mid-air dissolves directly into Teleport Strike!
            if (e.comboActive || Math.random() < 0.75) {
              // Calculate destination in the player's path based on player heading
              const heading = p.vx !== 0 ? (p.vx > 0 ? 1 : -1) : p.facing;
              let destX = p.x + (heading === 1 ? 56 : -56);
              if (destX < 6140) destX = 6160;
              else if (destX > 7400) destX = 7380;
              startHanzoTelegraph(e, 'teleport', true, 'teleport', destX, 280 - e.h);
              continue;
            } else {
              e.state = 'idle';
              e.risingCooldown = e.isEnraged ? 45 : 70;
            }
          }
        }
        // State 5: Active Dash (Step 3 of Master Combo, or repositioning mechanic)
        else if (e.state === 'dash') {
          e.attackTimer -= 1;
          e.vx = e.facing * 8.0;

          // Spawn purple afterimage every 2 frames during dash
          if (e.attackTimer % 2 === 0) {
            hanzoGhostsRef.current.push({
              id: nextHanzoGhostIdRef.current++,
              x: e.x,
              y: e.y,
              facing: e.facing,
              state: 'dash',
              alpha: 0.75,
            });
          }

          if (e.attackTimer <= 0) {
            if (e.comboActive && e.comboStep === 'dash') {
              // DIRECT COMBO TRANSITION: Step 4 -> TELEPORT STRIKE (Finisher)!
              // Calculate destination in the player's path based on player heading
              const heading = p.vx !== 0 ? (p.vx > 0 ? 1 : -1) : p.facing;
              let destX = p.x + (heading === 1 ? 56 : -56);
              if (destX < 6140) destX = 6160;
              else if (destX > 7400) destX = 7380;
              startHanzoTelegraph(e, 'teleport', true, 'teleport', destX, 280 - e.h);
              continue;
            } else {
              e.state = 'idle';
              e.dashCooldown = e.isEnraged ? 80 : 120;
            }
          }
        }
        // State 6: Active Hanzo Jump Sequence (Unified Physics & Collision-Driven Animation Timeline)
        else if (e.state === 'jump') {
          // Phase 1: Preparation (Frames 1-2: Crouch compression before upward launch)
          if (e.jumpPhase === 'prep') {
            e.jumpTimer = (e.jumpTimer || 0) - 1;
            e.vx = 0;
            e.vy = 0;
            e.onGround = true;
            // Frame 1 (first 3 ticks) -> Frame 2 (next 3 ticks)
            if (e.jumpTimer > 3) {
              e.jumpFrame = 0; // jump_hanzo_1.png
            } else {
              e.jumpFrame = 1; // jump_hanzo_2.png
            }

            if (e.jumpTimer <= 0) {
              // Launch impulse! (Frames 3-5: Push off ground)
              e.jumpPhase = 'launch';
              e.jumpTimer = 9;
              e.jumpFrame = 2; // jump_hanzo_3.png
              e.vy = HANZO_JUMP_LAUNCH_VY;
              e.onGround = false;
              e.vx = e.facing * HANZO_JUMP_HORIZONTAL_SPEED;
              spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
              soundEffects.playJump();
            }
          }
          // Phase 2: Launch (Frames 3-5: Push off ground and rapidly move upward)
          else if (e.jumpPhase === 'launch') {
            e.jumpTimer = (e.jumpTimer || 0) - 1;
            if (e.jumpTimer > 6) {
              e.jumpFrame = 2; // jump_hanzo_3.png
            } else if (e.jumpTimer > 3) {
              e.jumpFrame = 3; // jump_hanzo_4.png
            } else {
              e.jumpFrame = 4; // jump_hanzo_5.png
            }

            // Spawn visual-only ethereal afterimage during launch
            if (e.jumpTimer === 5) {
              hanzoGhostsRef.current.push({
                id: nextHanzoGhostIdRef.current++,
                x: e.x,
                y: e.y,
                facing: e.facing,
                state: 'jump',
                alpha: 0.6,
              });
            }

            if (e.jumpTimer <= 0) {
              e.jumpPhase = 'airborne';
              e.jumpTimer = 16;
              e.jumpFrame = 5; // jump_hanzo_6.png
            }
          }
          // Phase 3: Airborne Ascent (Frames 6-9: Ascending toward apex)
          else if (e.jumpPhase === 'airborne') {
            e.jumpTimer = (e.jumpTimer || 0) - 1;
            if (e.jumpTimer > 12) {
              e.jumpFrame = 5; // jump_hanzo_6.png
            } else if (e.jumpTimer > 8) {
              e.jumpFrame = 6; // jump_hanzo_7.png
            } else if (e.jumpTimer > 4) {
              e.jumpFrame = 7; // jump_hanzo_8.png
            } else {
              e.jumpFrame = 8; // jump_hanzo_9.png (apex)
            }

            // Spawn visual-only afterimage near apex
            if (e.jumpTimer === 8) {
              hanzoGhostsRef.current.push({
                id: nextHanzoGhostIdRef.current++,
                x: e.x,
                y: e.y,
                facing: e.facing,
                state: 'jump',
                alpha: 0.5,
              });
            }

            // Transition to descent as gravity turns velocity downward
            if (e.jumpTimer <= 0 || (e.vy || 0) > 0.5) {
              e.jumpPhase = 'descent';
              e.jumpTimer = 12;
              e.jumpFrame = 9; // jump_hanzo_10.png
            }
          }
          // Phase 4: Descent (Frames 10-12: Descending toward platform)
          else if (e.jumpPhase === 'descent') {
            e.jumpTimer = (e.jumpTimer || 0) - 1;
            if (e.jumpTimer > 8) {
              e.jumpFrame = 9; // jump_hanzo_10.png
            } else if (e.jumpTimer > 4) {
              e.jumpFrame = 10; // jump_hanzo_11.png
            } else {
              // Frame 12: Hold descending stance indefinitely while airborne!
              e.jumpFrame = 11; // jump_hanzo_12.png
            }
            // Note: Landing is strictly triggered by physical collision in airborne platform check!
          }
          // Phase 5: Landing (Frames 13-15: Touchdown compression on ground)
          else if (e.jumpPhase === 'landing') {
            e.jumpTimer = (e.jumpTimer || 0) - 1;
            e.vx = 0;
            e.vy = 0;
            e.onGround = true;
            if (e.jumpTimer > 6) {
              e.jumpFrame = 12; // jump_hanzo_13.png
            } else if (e.jumpTimer > 3) {
              e.jumpFrame = 13; // jump_hanzo_14.png
            } else {
              e.jumpFrame = 14; // jump_hanzo_15.png
            }

            if (e.jumpTimer <= 0) {
              // Transition to Phase 6: Recovery ready stance
              e.jumpPhase = 'recover';
              e.jumpTimer = 4;
              e.jumpFrame = 15; // jump_hanzo_16.png
            }
          }
          // Phase 6: Recovery (Frame 16: Return to combat-ready state)
          else if (e.jumpPhase === 'recover') {
            e.jumpTimer = (e.jumpTimer || 0) - 1;
            e.vx = 0;
            e.vy = 0;
            e.onGround = true;
            e.jumpFrame = 15; // jump_hanzo_16.png

            if (e.jumpTimer <= 0) {
              // Complete jump cycle! Return to normal combat AI
              e.state = 'idle';
              e.jumpPhase = undefined;
              e.jumpFrame = undefined;
              e.jumpTimer = 0;
              e.jumpCooldown = e.isEnraged ? HANZO_JUMP_ENRAGED_COOLDOWN : HANZO_JUMP_COOLDOWN;
            }
          }
        }
        // State 7: Boss AI Decision Tree (Intelligent Tri-Attack Synergy: Spin Slash, Rising Slash, Teleport Strike)
        else {
          e.facing = p.x >= e.x ? 1 : -1;

          // Priority 0: Anti-Air Reaction (Player is jumping or elevated)
          // If player is airborne, Hanzo telegraphs Rising Slash -> mid-air Teleport Strike!
          if (p.alive && (!p.onGround || p.y < e.y - 20) && dist < 170 && (e.risingCooldown || 0) <= 0) {
            startHanzoTelegraph(e, 'rising', true, 'rising');
          }
          // Priority 1: Full Infernal Combo Chain (Spin Slash -> Rising Slash -> Teleport Strike)
          // Initiated when close/mid range to player
          else if (p.alive && (e.comboCooldown || 0) <= 0 && dist < 220) {
            startHanzoTelegraph(e, 'spin', true, 'spin');
          }
          // Priority 2: Shadow Ambush (Teleport Strike -> Follow-up Spin Slash / Rising Slash)
          // When player is maintaining distance, Hanzo telegraphs shadow ambush into the player's path
          else if (p.alive && (e.teleportCooldown || 0) <= 0 && dist > 110 && dist < 520) {
            const heading = p.vx !== 0 ? (p.vx > 0 ? 1 : -1) : p.facing;
            let destX = p.x + (heading === 1 ? 56 : -56);
            if (destX < 6140) destX = 6160;
            else if (destX > 7400) destX = 7380;
            if (destX >= 6120 && destX <= 7440) {
              startHanzoTelegraph(e, 'teleport', true, 'teleport', destX, 280 - e.h);
            }
          }
          // Priority 3: Close Quarters Quick Spin Slash
          else if (p.alive && (e.spinCooldown || 0) <= 0 && dist < 95 && Math.abs(p.y - e.y) < 60) {
            startHanzoTelegraph(e, 'spin', Math.random() < 0.7, 'spin');
          }
          // Priority 4: Tactical Combat Jump (Anti-air leap, gap closer, combat evasion)
          else if (
            p.alive &&
            (e.jumpCooldown || 0) <= 0 &&
            e.onGround &&
            (
              (dist > 180 && dist < 380 && (e.teleportCooldown || 0) > 25) ||
              (dist < 120 && (p.attackTimer > 0 || p.anim === 'attacking' || p.anim === 'down_attacking') && Math.random() < 0.35)
            )
          ) {
            e.state = 'jump';
            e.jumpPhase = 'prep';
            e.jumpTimer = 6;
            e.jumpFrame = 0;
            e.vx = 0;
            e.jumpCooldown = e.isEnraged ? HANZO_JUMP_ENRAGED_COOLDOWN : HANZO_JUMP_COOLDOWN;
            spawnEffect('dust', e.x + e.w / 2 - 32, e.y + e.h - 16, e.facing, 2);
          }
          // Priority 5: Relentless Pursuit Chase
          else if (p.alive && dist > 50) {
            e.state = 'chase';
            e.vx = e.facing * (e.isEnraged ? 3.4 : 2.8);
          } else {
            e.state = 'idle';
            e.vx = 0;
          }
        }

        // Keep Hanzo bounded within the 1400px Section 8 arena platform (6110 to 7460)
        e.x += e.vx;
        if (e.x < 6110) { e.x = 6110; e.vx = 0; }
        if (e.x > 7460) { e.x = 7460; e.vx = 0; }

        if (e.state === 'spin_attack') {
          e.attackFrame = Math.min(7, Math.floor((20 - e.attackTimer) / 2.5));
        } else if (e.state === 'rising_attack') {
          e.attackFrame = Math.min(6, Math.floor((20 - e.attackTimer) / 3));
        } else {
          e.attackFrame = undefined;
          if (e.state === 'idle') e.animFrame = Math.floor(gameTickRef.current / 6) % 8;
          else if (e.state === 'chase' || e.state === 'patrol') e.animFrame = Math.floor(gameTickRef.current / 4) % 11;
          else if (e.state === 'dash') e.animFrame = Math.floor(gameTickRef.current / 3) % 12;
          else if (e.state === 'teleport_attack') e.animFrame = Math.min(14, Math.floor(gameTickRef.current / 3) % 15);
        }
      }
    }
  }

  function updateCamera() {
    const p = playerRef.current;
    const level = levelRef.current;

    // Horizontal tracking using dynamic actual viewport width (prevents hardcoded -800)
    const actualVpWidth = viewportWidthRef.current || 800;
    const actualVpHeight = viewportHeightRef.current || 450;
    const maxCameraX = Math.max(0, level.width - actualVpWidth);
    const maxCameraY = Math.max(0, level.height - actualVpHeight);
    // Subtle horizontal look-ahead: bias camera in direction Hanzo is facing and moving
    const lookAhead = p.facing * Math.min(CAMERA_LOOKAHEAD_MAX, Math.abs(p.vx) * 6 + (Math.abs(p.vx) > 0.5 ? 14 : 0));
    let targetX = p.x - actualVpWidth * 0.475 + lookAhead;
    let targetY = 0;

    if (storyCinematicRef.current.active) {
      targetX = storyCinematicRef.current.cameraFocusX - actualVpWidth * 0.5;
      targetY = Math.min(Math.max(0, storyCinematicRef.current.cameraFocusY - actualVpHeight * 0.52), maxCameraY);
      cameraZoomRef.current += (storyCinematicRef.current.cameraZoom - cameraZoomRef.current) * 0.06;
    } else {
      cameraZoomRef.current += (1.0 - cameraZoomRef.current) * 0.08;
      if (hanzoDeathCinematicRef.current.active) {
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
        if (hanzo) {
          targetX = hanzo.x + hanzo.w / 2 - actualVpWidth * 0.48;
        }
      } else if (level.storyLocation === 'chinoike-jigoku' && bossIntroTriggeredRef.current && !hanzoDefeatedRef.current) {
        const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo' && e.alive);
        if (hanzo) {
          targetX = (p.x + hanzo.x) / 2 - actualVpWidth * 0.48;
        }
      }
    }

    cameraXRef.current += (targetX - cameraXRef.current) * 0.08;
    if (cameraXRef.current < 0) cameraXRef.current = 0;
    if (cameraXRef.current > maxCameraX) cameraXRef.current = maxCameraX;

    // Boss Arena Camera Containment (Locks camera within Hanzo's arena)
    if (level.storyLocation === 'chinoike-jigoku' && bossIntroTriggeredRef.current && !hanzoDefeatedRef.current && !storyCinematicRef.current.active) {
      const minBossCamX = Math.min(6060, maxCameraX);
      if (cameraXRef.current < minBossCamX) cameraXRef.current = minBossCamX;
      const maxBossCamX = Math.max(minBossCamX, 7500 - actualVpWidth);
      if (cameraXRef.current > maxBossCamX) cameraXRef.current = maxBossCamX;
    }

    // Vertical tracking: dynamic based on level structure and actual viewport height
    if (storyCinematicRef.current.active) {
      // targetY already calculated above
    } else if (hanzoDeathCinematicRef.current.active) {
      const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
      if (hanzo) {
        targetY = Math.min(Math.max(0, hanzo.y + hanzo.h / 2 - actualVpHeight * 0.52), maxCameraY);
      }
    } else if (level.storyLocation === 'chinoike-jigoku') {
      targetY = Math.min(Math.max(0, p.y - actualVpHeight * 0.48), maxCameraY);
    } else {
      targetY = Math.min(Math.max(0, p.y - actualVpHeight * 0.55), maxCameraY);
    }
    cameraYRef.current += (targetY - cameraYRef.current) * 0.08;
    if (cameraYRef.current < 0) cameraYRef.current = 0;
    if (cameraYRef.current > maxCameraY) cameraYRef.current = maxCameraY;
  }

  function decayEffects() {
    if (shakeRef.current > 0) shakeRef.current = Math.max(0, shakeRef.current - 0.8);
    if (damageFlashRef.current > 0) damageFlashRef.current = Math.max(0, damageFlashRef.current - 0.04);

    // Advance and clean up visual effects
    effectsRef.current = effectsRef.current
      .map((eff) => ({ ...eff, frame: eff.frame + 0.35 }))
      .filter((eff) => Math.floor(eff.frame) < eff.maxFrames);

    // Decay and remove finished ninja respawn effect (after 50 frames / ~830ms)
    if (respawnEffectRef.current) {
      respawnEffectRef.current.lifetime -= 1;
      if (respawnEffectRef.current.lifetime <= 0) {
        respawnEffectRef.current = null;
      }
    }

    // Decay and remove finished dash ghost afterimages
    dashGhostsRef.current = dashGhostsRef.current
      .map((g) => ({ ...g, alpha: g.alpha - 0.08 }))
      .filter((g) => g.alpha > 0);

    // Decay and remove finished Hanzo afterimages (残像)
    hanzoGhostsRef.current = hanzoGhostsRef.current
      .map((g) => ({ ...g, alpha: g.alpha - 0.06 }))
      .filter((g) => g.alpha > 0);

    // Decay and remove finished parry hit effects (after 24 frames / ~400ms)
    parryHitsRef.current = parryHitsRef.current
      .map((h) => ({ ...h, lifetime: h.lifetime - 1 }))
      .filter((h) => h.lifetime > 0);

    // Decay and remove finished Hanzo hit effect (hit effect hanzo.gif, ~36 frames / 600ms)
    if (hanzoHitEffectRef.current) {
      hanzoHitEffectRef.current.lifetime -= 1;
      if (hanzoHitEffectRef.current.lifetime <= 0) {
        hanzoHitEffectRef.current = null;
      }
    }
  }

  const triggerExecutionBlow = useCallback(() => {
    const sc = storyCinematicRef.current;
    if (sc.phase !== 'hanzo_execution_pending') return;
    const hanzo = enemiesRef.current.find((e) => e.type === 'hanzo');
    if (hanzo) {
      const p = playerRef.current;
      p.anim = 'attacking';
      p.attackTimer = 24;
      p.facing = p.x <= hanzo.x ? 1 : -1;
      p.x = p.facing === 1 ? hanzo.x - 52 : hanzo.x + 52;
      triggerHanzoExecutionBlow(hanzo, p.facing);
      setRender(buildRender());
    }
  }, [buildRender]);

  const stayInYunami = useCallback(() => {
    portalPromptRef.current = null;
    const p = playerRef.current;
    if (p && levelRef.current) {
      p.x = Math.max(0, levelRef.current.exit.x - 140);
      p.vx = -4;
      p.vy = 0;
      p.invuln = 60;
    }
    portalCooldownRef.current = 120;
    soundEffects.playMenuSelect();
    setRender(buildRender());
  }, [buildRender]);

  const proceedToChinoike = useCallback(() => {
    portalPromptRef.current = null;
    soundEffects.playVictory();
    damageFlashRef.current = 0.8;
    shakeRef.current = 12;
    switchStoryLocation('chinoike-jigoku', true);
  }, [switchStoryLocation]);

  return {
    render,
    reset,
    loadStoryLocation,
    pause,
    resume,
    setInput,
    advanceStoryCinematic,
    skipStoryCinematic,
    skipBossIntro,
    navigateStoryChoice,
    selectStoryChoice,
    triggerExecutionBlow,
    stayInYunami,
    proceedToChinoike,
  };
}
