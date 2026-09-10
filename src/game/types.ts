// Game type definitions & Master Character References
export const MASTER_SAMURAI_REFERENCE = '/assets/sprites/enemies/master_samurai.png' as const;
export const MASTER_BAT_REFERENCE = '/assets/sprites/enemies/corrupted-bat/master.png' as const;
export const MASTER_HANZO_REFERENCE = '/assets/sprites/enemies/hanzo/master.png' as const;
export const MASTER_PLAYER_REFERENCE = '/assets/sprites/player/ninja_master.png' as const;

export type AnimState =
  | 'idle'
  | 'running'
  | 'jumping'
  | 'falling'
  | 'landing'
  | 'attacking'
  | 'down_attacking'
  | 'hurt'
  | 'dashing'
  | 'dead'
  | 'throwing'
  | 'parry'
  | 'double_jumping'
  | 'crimson_slash_combo'
  | 'crimson_blade_wave'
  | 'blood_spin_slash'
  | 'shadow_dash_strike'
  | 'aerial_kick';

export type NinjaSkill =
  | 'crimson_slash_combo'
  | 'crimson_blade_wave'
  | 'blood_spin_slash'
  | 'shadow_dash_strike'
  | 'aerial_kick';

export interface BladeWaveProjectile {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  facing: 1 | -1;
  lifetime: number;
  maxDistance: number;
  active: boolean;
  frame: number;
}

export interface ParryHitEffect {
  id: number;
  x: number;
  y: number;
  isPerfect: boolean;
  lifetime: number;
  maxLifetime: number;
}

export interface ShurikenProjectile {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  facing: 1 | -1;
  frame: number;
  lifetime: number;
  distanceTraveled: number;
  active: boolean;
}

export interface ShurikenHitEffect {
  id: number;
  x: number;
  y: number;
  lifetime: number;
  maxLifetime: number;
}

export interface RespawnEffect {
  id: number;
  x: number;
  y: number;
  lifetime: number;
  maxLifetime: number;
}

export interface HanzoHitEffect {
  id: number;
  x: number;
  y: number;
  facing: 1 | -1;
  lifetime: number;
  maxLifetime: number;
}

export interface DashGhost {
  id: number;
  x: number;
  y: number;
  facing: 1 | -1;
  frameIndex: number;
  alpha: number;
}

export interface VisualEffect {
  id: number;
  type: 'slash' | 'down_slash' | 'impact' | 'dust';
  x: number;
  y: number;
  facing: 1 | -1;
  frame: number;
  maxFrames: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Platform extends Rect {
  type?: 'ground' | 'platform' | 'wall';
}

export interface Coin extends Rect {
  collected: boolean;
}

export interface CollectibleShuriken extends Rect {
  id: number;
  collected: boolean;
}

export interface Spike extends Rect { }

export interface Enemy {
  id: number;
  type: 'samurai' | 'spirit' | 'hanzo';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround?: boolean;
  hp: number;
  maxHp: number;
  patrolMin: number;
  patrolMax: number;
  facing: 1 | -1;
  state:
    | 'idle'
    | 'patrol'
    | 'chase'
    | 'attack'
    | 'jump'
    | 'hurt'
    | 'death'
    | 'dead'
    | 'spawn'
    | 'fly'
    | 'dash'
    | 'spin_attack'
    | 'rising_attack'
    | 'teleport_attack'
    | 'dive'
    | 'guard'
    | 'defeated';
  attackType?: 'claw' | 'dive';
  attackCooldown: number;
  attackTimer: number;
  jumpCooldown?: number;
  turnCooldown?: number;
  guardCooldown?: number;
  guardTimer?: number;
  lungeCooldown?: number;
  divePhase?: 'hover' | 'dive' | 'ascent' | 'swoop' | 'ascend';
  diveTimer?: number;
  targetAltitude?: number;
  hurtCooldown: number;
  deadTimer: number;
  spawnTimer?: number;
  respawnTimer?: number;
  spawnX: number;
  spawnY: number;
  alive: boolean;
  attackParried?: boolean;
  // Hanzo Boss specific properties
  dashCooldown?: number;
  spinCooldown?: number;
  risingCooldown?: number;
  teleportCooldown?: number;
  teleportTimer?: number;
  teleportPhase?: 'disappear' | 'travel' | 'reappear' | 'strike' | 'recover';
  teleportDestX?: number;
  teleportDestY?: number;
  hitConnected?: boolean;
  jumpPhase?: 'prep' | 'launch' | 'airborne' | 'descent' | 'landing' | 'recover';
  jumpFrame?: number;
  jumpTimer?: number;
  damageFrame?: number;
  deathFrame?: number;
  attackFrame?: number;
  animFrame?: number;
  // Hanzo Master Combo properties
  comboActive?: boolean;
  comboStep?: 'spin' | 'rising' | 'dash' | 'teleport' | 'teleport_to_spin' | 'rising_to_teleport' | 'spin_to_rising';
  comboCooldown?: number;
  isEnraged?: boolean;
  // Hanzo Attack Telegraph System
  telegraph?: HanzoTelegraphType;
  telegraphTimer?: number;
  telegraphMaxTimer?: number;
  telegraphTargetX?: number;
  telegraphTargetY?: number;
}

export type HanzoTelegraphType = 'none' | 'rising' | 'spin' | 'teleport';

export interface HanzoGhost {
  id: number;
  x: number;
  y: number;
  facing: 1 | -1;
  state: 'dash' | 'spin_attack' | 'rising_attack' | 'teleport_attack' | 'jump';
  alpha: number;
}

export interface Checkpoint extends Rect {
  activated: boolean;
}

export interface ExitGate extends Rect {
  locked?: boolean;
}

export interface PlayerState {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  onGround: boolean;
  anim: AnimState;
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  energy: number;
  maxEnergy: number;
  invuln: number;
  attackCooldown: number;
  attackTimer: number;
  dashCooldown: number;
  dashTimer: number;
  throwCooldown: number;
  throwTimer: number;
  shurikenSpawned?: boolean;
  parryCooldown: number;
  parryTimer: number;
  parryAnimTimer: number;
  parrySuccess: boolean;
  isDefending: boolean;
  alive: boolean;
  deathTimer: number;
  extraLives: number;
  shurikenCount: number;
  canDoubleJump?: boolean;
  isDoubleJumping?: boolean;
  doubleJumpFrame?: number;
  doubleJumpTimer?: number;
  activeSkill?: NinjaSkill;
  skillTimer?: number;
  skillFrame?: number;
  animFrame?: number;
  attackFrame?: number;
  throwFrame?: number;
  landingFrame?: number;
  hurtFrame?: number;
  attackHoldTimer?: number;
  comboCount?: number;
  comboTimer?: number;
  comboMaxTimer?: number;
  highestCombo?: number;
  finisherReady?: boolean;
}

export interface TrophyNotification {
  id: number;
  title: string;
  message: string;
  subtitle?: string;
  type: 'trophy' | 'missed' | 'secret';
  lifetime: number;
  maxLifetime?: number;
}

export interface UnlockedSkills {
  bloodSpinSlash: boolean;
  crimsonBladeWave: boolean;
}

export interface GameResultData {
  score: number;
  coins: number;
  time: number;
  rank: string;
}

export type StoryLocation = 'yunami-jigoku' | 'chinoike-jigoku' | 'shinoki-jigoku' | 'tamashi-no-shinden';

export interface LevelData {
  name: string;
  jpName: string;
  storyLocation: StoryLocation;
  width: number;
  height: number;
  groundY: number;
  spawn: Vec2;
  platforms: Platform[];
  coins: Coin[];
  collectibleShurikens?: CollectibleShuriken[];
  spikes: Spike[];
  bloodPonds?: Rect[];
  enemies: Enemy[];
  checkpoint: Checkpoint;
  exit: ExitGate;
  hanzoDefeated?: boolean;
}

export type StoryCinematicShot =
  | 'shot1_silence'
  | 'shot2_approach'
  | 'shot3_dialogue1'
  | 'shot4_guardian_move'
  | 'shot5_memory_reveal'
  | 'shot6_purple_soul'
  | 'shot7_curse_lore'
  | 'shot8_cannot_destroy'
  | 'shot9_cycle_reveal'
  | 'shot10_guardian_req'
  | 'shot11_choice'
  | 'shot12_final_words'
  | 'shot13_resumption';

export type CinematicSpeaker = 'HANZO' | 'UNKNOWN' | 'HANZO — SHADOW' | 'THE GUARDIAN';

export type StoryCutscenePhase =
  | 'none'
  | 'opening_fade_in'
  | 'opening_dialogue'
  | 'opening_spirit_transfer'
  | 'opening_unknown_exit'
  | 'hanzo_defeated'
  | 'final_dialogue'
  | 'unknown_reveal'
  | 'choice_waiting'
  | 'hanzo_execution_pending'
  | 'hanzo_death_continue'
  | 'hanzo_dead'
  | 'hanzo_spared'
  | 'hanzo_escape'
  | 'dlc_teaser'
  | 'cutscene_complete';

export type StoryChoice = 'kill' | 'spare';

export interface CinematicDialogueLine {
  speaker: CinematicSpeaker;
  text: string;
  jpSubtitle?: string;
  pauseAfterTicks?: number;
  highlightWords?: string[];
}

export interface StoryCinematicState {
  active: boolean;
  phase: StoryCutscenePhase;
  shot: StoryCinematicShot;
  shotIndex: number; // 1 to 13
  dialogueIndex: number;
  currentLine: CinematicDialogueLine | null;
  timer: number;
  cameraFocusX: number;
  cameraFocusY: number;
  cameraZoom: number;
  flashbackActive: boolean;
  energyTetherActive: boolean;
  fadeOpacity: number;
  isComplete: boolean;
  canAdvance: boolean;
  // Opening Cutscene actor state
  unknownActor?: {
    x: number;
    y: number;
    facing: 1 | -1;
    anim: 'idle' | 'run' | 'chase' | 'dash' | 'teleport';
    opacity: number;
    hasEnteredGate?: boolean;
  };
  // Spirit orb state for Opening Cutscene
  spiritOrb?: {
    active: boolean;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    progress: number;
  };
  // Choice state for Finale
  choice?: StoryChoice;
  selectedChoiceIndex?: number; // 0 for KILL, 1 for SPARE
  revealedIdentity?: boolean;
  executionHitConnected?: boolean;
}

