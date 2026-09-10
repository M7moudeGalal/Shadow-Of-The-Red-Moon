import { useState, useEffect, useRef } from 'react';
import type { AnimState, NinjaSkill } from '@/game/types';

/**
 * SHADOW OF THE RED MOON — NINJA PLAYER CHARACTER
 * ===============================================
 * Frame-based PNG sprite renderer supporting:
 * - IDLE Animation (6 frames, 120ms cadence, loop)
 * - RUN Animation (8 frames, 90ms cadence, loop)
 * - JUMP Animation (6 frames, 95ms cadence, rising arc)
 * - FALL Animation (4 frames, 100ms cadence, holds fall_04 until landing)
 * - LAND Animation (3 frames, 75ms cadence, single-play)
 * - DASH Animation (6 frames, deterministically mapped 1:1 to 9 physics frames)
 * - ATTACK Animation (8 frames, 50ms cadence, fast responsive strike)
 * - DOWN ATTACK Animation (6 frames, 50ms cadence, aerial down thrust)
 * - DAMAGE Animation (4 frames, 65ms cadence, single-play)
 * - DEATH Animation (6 frames, 100ms cadence, holds death_06 permanently)
 * 
 * Asset Paths:
 * Master:      /assets/sprites/player/master.png
 * Idle:        /assets/sprites/player/idle/idle_01.png ... idle_06.png
 * Run:         /assets/sprites/player/run/run_01.png ... run_08.png
 * Jump:        /assets/sprites/player/jump/jump_01.png ... jump_06.png
 * Fall:        /assets/sprites/player/fall/fall_01.png ... fall_04.png
 * Land:        /assets/sprites/player/land/land_01.png, land_02.png, land_04.png
 * Dash:        /assets/sprites/player/dash/dash_01.png ... dash_06.png
 * Attack:      /assets/sprites/player/attack/attack_01.png ... attack_08.png
 * Down Attack: /assets/sprites/player/down-attack/down_01.png ... down_06.png
 * Damage:      /assets/sprites/player/damage/damage_01.png ... damage_04.png
 * Death:       /assets/sprites/player/death/death_01.png ... death_06.png
 * 
 * Gameplay Collision: 28px width × 48px height
 * Visual Canvas: 44px width × 64px height (Ground baseline anchored at bottom)
 */

export const MASTER_PLAYER_REFERENCE = '/assets/sprites/player/master.png' as const;

export const IDLE_FRAMES = [
  '/assets/sprites/player/idle/idle_01.png',
  '/assets/sprites/player/idle/idle_02.png',
  '/assets/sprites/player/idle/idle_03.png',
  '/assets/sprites/player/idle/idle_04.png',
  '/assets/sprites/player/idle/idle_05.png',
  '/assets/sprites/player/idle/idle_06.png',
] as const;

export const RUN_FRAMES = [
  '/assets/sprites/player/run/run_01.png',
  '/assets/sprites/player/run/run_02.png',
  '/assets/sprites/player/run/run_03.png',
  '/assets/sprites/player/run/run_04.png',
  '/assets/sprites/player/run/run_05.png',
  '/assets/sprites/player/run/run_06.png',
  '/assets/sprites/player/run/run_07.png',
  '/assets/sprites/player/run/run_08.png',
] as const;

export const JUMP_FRAMES = [
  '/assets/sprites/player/jump/jump_01.png',
  '/assets/sprites/player/jump/jump_02.png',
  '/assets/sprites/player/jump/jump_03.png',
  '/assets/sprites/player/jump/jump_04.png',
  '/assets/sprites/player/jump/jump_05.png',
  '/assets/sprites/player/jump/jump_06.png',
] as const;

export const DOUBLE_JUMP_FRAMES = [
  '/assets/sprites/player/double-jump/double-jump1.png',
  '/assets/sprites/player/double-jump/double-jump2.png',
  '/assets/sprites/player/double-jump/double-jump3.png',
  '/assets/sprites/player/double-jump/double-jump4.png',
  '/assets/sprites/player/double-jump/double-jump5.png',
  '/assets/sprites/player/double-jump/double-jump6.png',
  '/assets/sprites/player/double-jump/double-jump7.png',
  '/assets/sprites/player/double-jump/double-jump8.png',
  '/assets/sprites/player/double-jump/double-jump9.png',
  '/assets/sprites/player/double-jump/double-jump10.png',
  '/assets/sprites/player/double-jump/double-jump11.png',
  '/assets/sprites/player/double-jump/double-jump12.png',
  '/assets/sprites/player/double-jump/double-jump13.png',
  '/assets/sprites/player/double-jump/double-jump14.png',
  '/assets/sprites/player/double-jump/double-jump15.png',
  '/assets/sprites/player/double-jump/double-jump16.png',
  '/assets/sprites/player/double-jump/double-jump17.png',
  '/assets/sprites/player/double-jump/double-jump18.png',
  '/assets/sprites/player/double-jump/double-jump19.png',
  '/assets/sprites/player/double-jump/double-jump20.png',
  '/assets/sprites/player/double-jump/double-jump21.png',
  '/assets/sprites/player/double-jump/double-jump22.png',
  '/assets/sprites/player/double-jump/double-jump23.png',
  '/assets/sprites/player/double-jump/double-jump24.png',
] as const;

export const FALL_FRAMES = [
  '/assets/sprites/player/fall/fall_01.png',
  '/assets/sprites/player/fall/fall_02.png',
  '/assets/sprites/player/fall/fall_03.png',
  '/assets/sprites/player/fall/fall_04.png',
] as const;

export const LAND_FRAMES = [
  '/assets/sprites/player/land/land_01.png',
  '/assets/sprites/player/land/land_02.png',
  '/assets/sprites/player/land/land_04.png',
] as const;

export const DASH_FRAMES = [
  '/assets/sprites/player/dash/dash_01.png',
  '/assets/sprites/player/dash/dash_02.png',
  '/assets/sprites/player/dash/dash_03.png',
  '/assets/sprites/player/dash/dash_04.png',
  '/assets/sprites/player/dash/dash_05.png',
  '/assets/sprites/player/dash/dash_06.png',
] as const;

export const ATTACK_FRAMES = [
  '/assets/sprites/player/attack/attack_01.png',
  '/assets/sprites/player/attack/attack_02.png',
  '/assets/sprites/player/attack/attack_03.png',
  '/assets/sprites/player/attack/attack_04.png',
  '/assets/sprites/player/attack/attack_05.png',
  '/assets/sprites/player/attack/attack_06.png',
  '/assets/sprites/player/attack/attack_07.png',
  '/assets/sprites/player/attack/attack_08.png',
] as const;

export const DOWN_ATTACK_FRAMES = [
  '/assets/sprites/player/down-attack/down_01.png',
  '/assets/sprites/player/down-attack/down_02.png',
  '/assets/sprites/player/down-attack/down_03.png',
  '/assets/sprites/player/down-attack/down_04.png',
  '/assets/sprites/player/down-attack/down_05.png',
  '/assets/sprites/player/down-attack/down_06.png',
] as const;

export const CRIMSON_SLASH_COMBO_FRAMES = [
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_1.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_2.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_3.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_4.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_5.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_6.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_7.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_8.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_9.png',
  '/assets/sprites/player/attacks/crimson_slash_combo/crimson_slash_combo_10.png',
] as const;

export const CRIMSON_BLADE_WAVE_FRAMES = [
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_1.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_2.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_3.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_4.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_5.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_6.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_7.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_8.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_9.png',
  '/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_10.png',
] as const;

export const BLOOD_SPIN_SLASH_FRAMES = [
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_1.png',
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_2.png',
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_3.png',
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_4.png',
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_5.png',
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_6.png',
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_7.png',
  '/assets/sprites/player/attacks/blood_spin_slash/blood_spin_slash_8.png',
] as const;

export const SHADOW_DASH_STRIKE_FRAMES = [
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_1.png',
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_2.png',
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_3.png',
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_4.png',
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_5.png',
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_6.png',
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_7.png',
  '/assets/sprites/player/attacks/shadow_dash_strike/shadow_dash_strike_8.png',
] as const;

export const AERIAL_KICK_FRAMES = [
  '/assets/sprites/player/attack/aerial-kick/airkick_01.png',
  '/assets/sprites/player/attack/aerial-kick/airkick_02.png',
  '/assets/sprites/player/attack/aerial-kick/airkick_03.png',
  '/assets/sprites/player/attack/aerial-kick/airkick_04.png',
  '/assets/sprites/player/attack/aerial-kick/airkick_05.png',
  '/assets/sprites/player/attack/aerial-kick/airkick_06.png',
  '/assets/sprites/player/attack/aerial-kick/airkick_07.png',
  '/assets/sprites/player/attack/aerial-kick/airkick_08.png',
] as const;

export const DAMAGE_FRAMES = [
  '/assets/sprites/player/damage/damage_01.png',
  '/assets/sprites/player/damage/damage_02.png',
  '/assets/sprites/player/damage/damage_03.png',
  '/assets/sprites/player/damage/damage_04.png',
] as const;

export const DEATH_FRAMES = [
  '/assets/sprites/player/death/death_01.png',
  '/assets/sprites/player/death/death_02.png',
  '/assets/sprites/player/death/death_03.png',
  '/assets/sprites/player/death/death_04.png',
  '/assets/sprites/player/death/death_05.png',
  '/assets/sprites/player/death/death_06.png',
] as const;

export const THROW_FRAMES = [
  '/assets/sprites/player/throw/throw_01.png',
  '/assets/sprites/player/throw/throw_02.png',
  '/assets/sprites/player/throw/throw_03.png',
  '/assets/sprites/player/throw/throw_04.png',
  '/assets/sprites/player/throw/throw_05.png',
  '/assets/sprites/player/throw/throw_06.png',
  '/assets/sprites/player/throw/throw_07.png',
  '/assets/sprites/player/throw/throw_08.png',
  '/assets/sprites/player/throw/throw_09.png',
  '/assets/sprites/player/throw/throw_10.png',
  '/assets/sprites/player/throw/throw_11.png',
  '/assets/sprites/player/throw/throw_12.png',
  '/assets/sprites/player/throw/throw_13.png',
  '/assets/sprites/player/throw/throw_14.png',
  '/assets/sprites/player/throw/throw_15.png',
  '/assets/sprites/player/throw/throw_16.png',
  '/assets/sprites/player/throw/throw_17.png',
  '/assets/sprites/player/throw/throw_18.png',
  '/assets/sprites/player/throw/throw_19.png',
  '/assets/sprites/player/throw/throw_20.png',
] as const;

export const SHURIKEN_FRAMES = [
  '/assets/effects/shuriken/shuriken_01.png',
  '/assets/effects/shuriken/shuriken_02.png',
  '/assets/effects/shuriken/shuriken_03.png',
  '/assets/effects/shuriken/shuriken_04.png',
  '/assets/effects/shuriken/shuriken_05.png',
  '/assets/effects/shuriken/shuriken_06.png',
  '/assets/effects/shuriken/shuriken_07.png',
  '/assets/effects/shuriken/shuriken_08.png',
  '/assets/effects/shuriken/shuriken_09.png',
  '/assets/effects/shuriken/shuriken_10.png',
  '/assets/effects/shuriken/shuriken_11.png',
  '/assets/effects/shuriken/shuriken_12.png',
  '/assets/effects/shuriken/shuriken_13.png',
  '/assets/effects/shuriken/shuriken_14.png',
] as const;

export const SHURIKEN_HIT_EFFECT = '/assets/effects/shuriken/hit_effect.gif' as const;
export const NINJA_RESPAWN_EFFECT = '/assets/sprites/player/effects/respawn_effect.gif' as const;

export const PARRY_FRAMES = [
  '/assets/player/parry/parry1.png',
  '/assets/player/parry/parry2.png',
  '/assets/player/parry/parry3.png',
  '/assets/player/parry/parry4.png',
  '/assets/player/parry/parry5.png',
  '/assets/player/parry/parry6.png',
  '/assets/player/parry/parry7.png',
  '/assets/player/parry/parry8.png',
  '/assets/player/parry/parry9.png',
  '/assets/player/parry/parry10.png',
  '/assets/player/parry/parry11.png',
  '/assets/player/parry/parry12.png',
  '/assets/player/parry/parry13.png',
  '/assets/player/parry/parry14.png',
  '/assets/player/parry/parry15.png',
  '/assets/player/parry/parry16.png',
  '/assets/player/parry/parry17.png',
  '/assets/player/parry/parry18.png',
  '/assets/player/parry/parry19.png',
  '/assets/player/parry/parry20.png',
  '/assets/player/parry/parry21.png',
  '/assets/player/parry/parry22.png',
  '/assets/player/parry/parry23.png',
  '/assets/player/parry/parry24.png',
] as const;

export const PARRY_EFFECT = '/assets/effects/parry/parry_effect.gif' as const;
export const PARRY_STATIONARY_FRAME = '/assets/player/parry/parry16.png' as const;

// Deterministic mapping: 12 active physics dash frames -> 6 visual dash frames
const DASH_FRAME_MAP: readonly number[] = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5];

// Preload all sprite frames once on module load
if (typeof window !== 'undefined') {
  [
    MASTER_PLAYER_REFERENCE,
    ...IDLE_FRAMES,
    ...RUN_FRAMES,
    ...JUMP_FRAMES,
    ...DOUBLE_JUMP_FRAMES,
    ...FALL_FRAMES,
    ...LAND_FRAMES,
    ...DASH_FRAMES,
    ...ATTACK_FRAMES,
    ...DOWN_ATTACK_FRAMES,
    ...CRIMSON_SLASH_COMBO_FRAMES,
    ...CRIMSON_BLADE_WAVE_FRAMES,
    ...BLOOD_SPIN_SLASH_FRAMES,
    ...SHADOW_DASH_STRIKE_FRAMES,
    ...AERIAL_KICK_FRAMES,
    ...DAMAGE_FRAMES,
    ...DEATH_FRAMES,
    ...THROW_FRAMES,
    ...SHURIKEN_FRAMES,
    ...PARRY_FRAMES,
    SHURIKEN_HIT_EFFECT,
    NINJA_RESPAWN_EFFECT,
    PARRY_EFFECT,
    '/assets/sprites/player/effects/slash_01.png',
    '/assets/sprites/player/effects/slash_02.png',
    '/assets/sprites/player/effects/slash_03.png',
    '/assets/sprites/player/effects/impact_01.png',
    '/assets/sprites/player/effects/impact_02.png',
    '/assets/sprites/player/effects/dust_01.png',
    '/assets/sprites/player/effects/dust_02.png',
  ].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export interface NinjaCharacterProps {
  anim?: AnimState;
  facing?: 1 | -1;
  size?: number;
  dashTimer?: number;
  parryAnimTimer?: number;
  doubleJumpTimer?: number;
  doubleJumpFrame?: number;
  activeSkill?: NinjaSkill;
  skillTimer?: number;
  skillFrame?: number;
  attackHoldTimer?: number;
}

const IDLE_FRAME_DURATION_MS = 120;        // 120ms per frame
const RUN_FRAME_DURATION_MS = 90;          // 90ms per frame
const JUMP_FRAME_DURATION_MS = 95;         // 95ms per frame
const DOUBLE_JUMP_FRAME_DURATION_MS = 50;  // 50ms per frame (24 frames total ~1.2s acrobatic flip)
const FALL_FRAME_DURATION_MS = 100;        // 100ms per frame
const LAND_FRAME_DURATION_MS = 75;         // 75ms per frame
const ATTACK_FRAME_DURATION_MS = 50;       // 50ms per frame
const DOWN_ATTACK_FRAME_DURATION_MS = 50;  // 50ms per frame
const SKILL_FRAME_DURATION_MS = 45;        // 45ms per frame for new attack skills
const THROW_FRAME_DURATION_MS = 22;        // 22ms per frame (20 frames total ~440ms single cast)
const PARRY_FRAME_DURATION_MS = 16;        // 16ms per frame (24 frames total ~384ms single parry)
const DAMAGE_FRAME_DURATION_MS = 65;       // 65ms per frame
const DEATH_FRAME_DURATION_MS = 100;       // 100ms per frame

export function NinjaCharacter({
  anim = 'idle',
  facing = 1,
  size = 1,
  dashTimer = 0,
  parryAnimTimer = 0,
  doubleJumpTimer = 0,
  doubleJumpFrame,
  activeSkill,
  skillTimer = 0,
  skillFrame,
  attackHoldTimer = 0,
}: NinjaCharacterProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  const isDead = anim === 'dead';
  const isDamage = anim === 'hurt';
  const isParry = anim === 'parry';
  const isDash = anim === 'dashing' || dashTimer > 0;
  const isCrimsonSlashCombo = anim === 'crimson_slash_combo' || activeSkill === 'crimson_slash_combo';
  const isCrimsonBladeWave = anim === 'crimson_blade_wave' || activeSkill === 'crimson_blade_wave';
  const isBloodSpinSlash = anim === 'blood_spin_slash' || activeSkill === 'blood_spin_slash';
  const isShadowDashStrike = anim === 'shadow_dash_strike' || activeSkill === 'shadow_dash_strike';
  const isAerialKick = anim === 'aerial_kick' || activeSkill === 'aerial_kick';
  const isDownAttack = anim === 'down_attacking';
  const isAttack = anim === 'attacking';
  const isThrow = anim === 'throwing';
  const isLanding = anim === 'landing';
  const isDoubleJump = anim === 'double_jumping';
  const isFalling = anim === 'falling';
  const isJumping = anim === 'jumping';
  const isRunning = anim === 'running';
  const isIdle = anim === 'idle';

  // Priority mode selection (Death > Damage > Parry > Dash > Special Skills > Down Attack > Attack > Throw > Land > Double Jump > Fall > Jump > Run > Idle)
  const currentMode = isDead
    ? 'death'
    : isDamage
    ? 'damage'
    : isParry
    ? 'parry'
    : isDash
    ? 'dash'
    : isCrimsonSlashCombo
    ? 'crimson_slash_combo'
    : isCrimsonBladeWave
    ? 'crimson_blade_wave'
    : isBloodSpinSlash
    ? 'blood_spin_slash'
    : isShadowDashStrike
    ? 'shadow_dash_strike'
    : isAerialKick
    ? 'aerial_kick'
    : isDownAttack
    ? 'down_attack'
    : isAttack
    ? 'attack'
    : isThrow
    ? 'throw'
    : isLanding
    ? 'land'
    : isDoubleJump
    ? 'double_jump'
    : isFalling
    ? 'fall'
    : isJumping
    ? 'jump'
    : isRunning
    ? 'run'
    : isIdle
    ? 'idle'
    : 'other';

  const prevModeRef = useRef<string>(currentMode);

  // Reset frame index immediately when animation mode changes
  useEffect(() => {
    if (prevModeRef.current !== currentMode) {
      setFrameIndex(0);
      prevModeRef.current = currentMode;
    }
  }, [currentMode]);

  // Frame cycle timer
  useEffect(() => {
    if (currentMode === 'idle') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % IDLE_FRAMES.length);
      }, IDLE_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'run') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % RUN_FRAMES.length);
      }, RUN_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'jump') {
      // Advance 01 -> 06, hold last frame while rising
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < JUMP_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, JUMP_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'double_jump') {
      // Advance double-jump1 -> double-jump24 (single play, non-looping)
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < DOUBLE_JUMP_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, DOUBLE_JUMP_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'fall') {
      // Advance 01 -> 04, hold fall_04 until landing
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < FALL_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, FALL_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'land') {
      // Advance land_01 -> land_02 -> land_04 (single play, non-looping)
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < LAND_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, LAND_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'attack') {
      // Advance attack_01 -> attack_08 (single play, non-looping)
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < ATTACK_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, ATTACK_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'down_attack') {
      // Advance down_01 -> down_06 (single play, non-looping)
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < DOWN_ATTACK_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, DOWN_ATTACK_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'crimson_slash_combo') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev < CRIMSON_SLASH_COMBO_FRAMES.length - 1 ? prev + 1 : prev));
      }, SKILL_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'crimson_blade_wave') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev < CRIMSON_BLADE_WAVE_FRAMES.length - 1 ? prev + 1 : prev));
      }, SKILL_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'blood_spin_slash') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev < BLOOD_SPIN_SLASH_FRAMES.length - 1 ? prev + 1 : prev));
      }, SKILL_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'shadow_dash_strike') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev < SHADOW_DASH_STRIKE_FRAMES.length - 1 ? prev + 1 : prev));
      }, SKILL_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'aerial_kick') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev < AERIAL_KICK_FRAMES.length - 1 ? prev + 1 : prev));
      }, SKILL_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'throw') {
      // Advance throw_01 -> throw_20 (single play, non-looping)
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < THROW_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, THROW_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'parry') {
      // Advance parry1 -> parry24 (single play, non-looping)
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < PARRY_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, PARRY_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'damage') {
      // Advance damage_01 -> damage_04 (single play, non-looping)
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < DAMAGE_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, DAMAGE_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'death') {
      // Advance death_01 -> death_06, hold death_06 permanently
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < DEATH_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, DEATH_FRAME_DURATION_MS);
      return () => window.clearInterval(interval);
    }
  }, [currentMode]);

  const flip = facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';

  // Select active frame source & dimension scaling
  let currentSrc: string;
  let spriteHeight: string;
  let maxWidth: string;

  if (isDead) {
    const clampedIndex = Math.min(frameIndex, DEATH_FRAMES.length - 1);
    currentSrc = DEATH_FRAMES[clampedIndex];
    spriteHeight = '47px';
    maxWidth = '64px';
  } else if (isDamage) {
    const clampedIndex = Math.min(frameIndex, DAMAGE_FRAMES.length - 1);
    currentSrc = DAMAGE_FRAMES[clampedIndex];
    spriteHeight = '47px';
    maxWidth = '56px';
  } else if (isParry) {
    if (parryAnimTimer > 0) {
      // Dynamic parry deflection swing when an enemy attack is intercepted!
      const elapsed = Math.min(23, Math.max(0, 24 - parryAnimTimer));
      currentSrc = PARRY_FRAMES[elapsed];
      spriteHeight = '56px';
      maxWidth = '72px';
    } else {
      // Steady guard stance with sword held stationary while defending
      currentSrc = PARRY_STATIONARY_FRAME;
      spriteHeight = '56px';
      maxWidth = '64px';
    }
  } else if (isDash) {
    // Deterministic 1:1 synchronization with the engine's 12-frame dash countdown (dashTimer: 12 -> 1)
    let dashIdx: number;
    if (dashTimer > 0) {
      const elapsedPhysicsFrame = Math.min(11, Math.max(0, 12 - dashTimer));
      dashIdx = DASH_FRAME_MAP[elapsedPhysicsFrame] ?? 0;
    } else {
      dashIdx = 0;
    }
    currentSrc = DASH_FRAMES[dashIdx];
    spriteHeight = '47px';
    maxWidth = '56px';
  } else if (isCrimsonSlashCombo) {
    const idx = skillFrame !== undefined ? Math.min(skillFrame, CRIMSON_SLASH_COMBO_FRAMES.length - 1) : Math.min(frameIndex, CRIMSON_SLASH_COMBO_FRAMES.length - 1);
    currentSrc = CRIMSON_SLASH_COMBO_FRAMES[idx];
    spriteHeight = '68px';
    maxWidth = '116px';
  } else if (isCrimsonBladeWave) {
    const idx = skillFrame !== undefined ? Math.min(skillFrame, CRIMSON_BLADE_WAVE_FRAMES.length - 1) : Math.min(frameIndex, CRIMSON_BLADE_WAVE_FRAMES.length - 1);
    currentSrc = CRIMSON_BLADE_WAVE_FRAMES[idx];
    spriteHeight = '70px';
    maxWidth = '125px';
  } else if (isBloodSpinSlash) {
    const idx = skillFrame !== undefined ? Math.min(skillFrame, BLOOD_SPIN_SLASH_FRAMES.length - 1) : Math.min(frameIndex, BLOOD_SPIN_SLASH_FRAMES.length - 1);
    currentSrc = BLOOD_SPIN_SLASH_FRAMES[idx];
    spriteHeight = '70px';
    maxWidth = '120px';
  } else if (isShadowDashStrike) {
    const idx = skillFrame !== undefined ? Math.min(skillFrame, SHADOW_DASH_STRIKE_FRAMES.length - 1) : Math.min(frameIndex, SHADOW_DASH_STRIKE_FRAMES.length - 1);
    currentSrc = SHADOW_DASH_STRIKE_FRAMES[idx];
    spriteHeight = '68px';
    maxWidth = '120px';
  } else if (isAerialKick) {
    const idx = skillFrame !== undefined ? Math.min(skillFrame, AERIAL_KICK_FRAMES.length - 1) : Math.min(frameIndex, AERIAL_KICK_FRAMES.length - 1);
    currentSrc = AERIAL_KICK_FRAMES[idx];
    spriteHeight = '72px';
    maxWidth = '100px';
  } else if (isDownAttack) {
    const clampedIndex = Math.min(frameIndex, DOWN_ATTACK_FRAMES.length - 1);
    currentSrc = DOWN_ATTACK_FRAMES[clampedIndex];
    spriteHeight = '47px';
    maxWidth = '64px';
  } else if (isAttack) {
    const clampedIndex = Math.min(frameIndex, ATTACK_FRAMES.length - 1);
    currentSrc = ATTACK_FRAMES[clampedIndex];
    spriteHeight = '47px';
    maxWidth = '64px';
  } else if (isThrow) {
    const clampedIndex = Math.min(frameIndex, THROW_FRAMES.length - 1);
    currentSrc = THROW_FRAMES[clampedIndex];
    spriteHeight = '56px';
    maxWidth = '64px';
  } else if (isLanding) {
    const clampedIndex = Math.min(frameIndex, LAND_FRAMES.length - 1);
    currentSrc = LAND_FRAMES[clampedIndex];
    spriteHeight = '47px';
    maxWidth = '56px';
  } else if (isDoubleJump) {
    const frame = doubleJumpFrame !== undefined
      ? Math.min(Math.max(0, doubleJumpFrame), DOUBLE_JUMP_FRAMES.length - 1)
      : Math.min(frameIndex, DOUBLE_JUMP_FRAMES.length - 1);
    currentSrc = DOUBLE_JUMP_FRAMES[frame];
    spriteHeight = '56px';
    maxWidth = '70px';
  } else if (isFalling) {
    const clampedIndex = Math.min(frameIndex, FALL_FRAMES.length - 1);
    currentSrc = FALL_FRAMES[clampedIndex];
    spriteHeight = '47px';
    maxWidth = '56px';
  } else if (isJumping) {
    const clampedIndex = Math.min(frameIndex, JUMP_FRAMES.length - 1);
    currentSrc = JUMP_FRAMES[clampedIndex];
    spriteHeight = '52px';
    maxWidth = '56px';
  } else if (isRunning) {
    currentSrc = RUN_FRAMES[frameIndex % RUN_FRAMES.length];
    spriteHeight = '42px';
    maxWidth = '64px';
  } else if (isIdle) {
    currentSrc = IDLE_FRAMES[frameIndex % IDLE_FRAMES.length];
    spriteHeight = '60px';
    maxWidth = '56px';
  } else {
    currentSrc = IDLE_FRAMES[0];
    spriteHeight = '60px';
    maxWidth = '56px';
  }

  return (
    <div
      style={{
        transform: `${flip} scale(${size})`,
        transformOrigin: 'center bottom',
        width: '44px',
        height: '64px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'relative',
      }}
      className="ninja-character select-none pointer-events-none"
      data-anim={anim}
      data-dash-timer={dashTimer}
      data-frame={frameIndex}
    >
      <img
        src={currentSrc}
        alt={`Ninja Shinobi ${anim}`}
        draggable={false}
        style={
          isDash
            ? {
                position: 'absolute',
                top: '-17px',
                left: '-56px',
                width: '120px',
                height: '120px',
                maxWidth: 'none',
                objectFit: 'contain',
                filter:
                  'drop-shadow(0 0 10px rgba(255, 43, 54, 0.85)) drop-shadow(0 0 20px rgba(220, 18, 29, 0.6))',
                imageRendering: 'auto',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
              }
            : {
                height: spriteHeight,
                width: 'auto',
                maxWidth: maxWidth,
                objectFit: 'contain',
                objectPosition: 'center bottom',
                imageRendering: 'auto',
                display: 'block',
                userSelect: 'none',
                pointerEvents: 'none',
              }
        }
      />

    </div>
  );
}

export function MasterNinjaIllustration({
  size = 180,
  className = '',
  style = {},
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        ...style,
      }}
    >
      <img
        src={MASTER_PLAYER_REFERENCE}
        alt="Master Ninja Shinobi"
        className="w-full h-full object-contain anim-ninja-breathe"
        style={{
          filter: 'drop-shadow(0 0 18px rgba(255,59,70,0.55)) drop-shadow(0 6px 16px rgba(0,0,0,0.9))',
        }}
        draggable={false}
      />
    </div>
  );
}
