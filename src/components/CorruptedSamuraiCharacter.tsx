import { useState, useEffect, useRef } from 'react';

/**
 * SHADOW OF THE RED MOON — CORRUPTED SAMURAI CHARACTER
 * ===================================================
 * Frame-based PNG sprite renderer supporting:
 * - IDLE Animation (5 frames, 120ms cadence, loop)
 * - WALK / PATROL Animation (5 frames, 110ms cadence, loop)
 * - CHASE Animation (6 frames, 85ms cadence, loop)
 * - JUMP Animation (8 frames, 80ms cadence, single-play holding jump_08)
 * - ATTACK Animation (8 frames, 50ms cadence, single-play)
 * - DAMAGE Animation (4 frames, 65ms cadence, single-play)
 * - DEATH Animation (6 frames, 95ms cadence, holds death_06 permanently)
 * 
 * Asset Paths:
 * Idle:   /assets/sprites/enemies/corrupted-samurai/idle/idle_01.png ... idle_05.png
 * Walk:   /assets/sprites/enemies/corrupted-samurai/walk/walk_01.png ... walk_05.png
 * Chase:  /assets/sprites/enemies/corrupted-samurai/chase/chase_01.png ... chase_06.png
 * Jump:   /assets/sprites/enemies/corrupted-samurai/jump/jump_01.png ... jump_08.png
 * Attack: /assets/sprites/enemies/corrupted-samurai/attack/attack_01.png ... attack_08.png
 * Damage: /assets/sprites/enemies/corrupted-samurai/damage/damage_01.png ... damage_04.png
 * Death:  /assets/sprites/enemies/corrupted-samurai/death/death_01.png ... death_06.png
 * 
 * Gameplay Hitbox: 34px width × 48px height
 * Ground baseline anchored at bottom
 */

export const SAMURAI_IDLE_FRAMES = [
  '/assets/sprites/enemies/corrupted-samurai/idle/idle_01.png',
  '/assets/sprites/enemies/corrupted-samurai/idle/idle_02.png',
  '/assets/sprites/enemies/corrupted-samurai/idle/idle_03.png',
  '/assets/sprites/enemies/corrupted-samurai/idle/idle_04.png',
  '/assets/sprites/enemies/corrupted-samurai/idle/idle_05.png',
] as const;

export const SAMURAI_WALK_FRAMES = [
  '/assets/sprites/enemies/corrupted-samurai/walk/walk_01.png',
  '/assets/sprites/enemies/corrupted-samurai/walk/walk_02.png',
  '/assets/sprites/enemies/corrupted-samurai/walk/walk_03.png',
  '/assets/sprites/enemies/corrupted-samurai/walk/walk_04.png',
  '/assets/sprites/enemies/corrupted-samurai/walk/walk_05.png',
] as const;

export const SAMURAI_CHASE_FRAMES = [
  '/assets/sprites/enemies/corrupted-samurai/chase/chase_01.png',
  '/assets/sprites/enemies/corrupted-samurai/chase/chase_02.png',
  '/assets/sprites/enemies/corrupted-samurai/chase/chase_03.png',
  '/assets/sprites/enemies/corrupted-samurai/chase/chase_04.png',
  '/assets/sprites/enemies/corrupted-samurai/chase/chase_05.png',
  '/assets/sprites/enemies/corrupted-samurai/chase/chase_06.png',
] as const;

export const SAMURAI_JUMP_FRAMES = [
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_01.png',
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_02.png',
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_03.png',
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_04.png',
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_05.png',
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_06.png',
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_07.png',
  '/assets/sprites/enemies/corrupted-samurai/jump/jump_08.png',
] as const;

export const SAMURAI_ATTACK_FRAMES = [
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_01.png',
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_02.png',
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_03.png',
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_04.png',
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_05.png',
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_06.png',
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_07.png',
  '/assets/sprites/enemies/corrupted-samurai/attack/attack_08.png',
] as const;

export const SAMURAI_DAMAGE_FRAMES = [
  '/assets/sprites/enemies/corrupted-samurai/damage/damage_01.png',
  '/assets/sprites/enemies/corrupted-samurai/damage/damage_02.png',
  '/assets/sprites/enemies/corrupted-samurai/damage/damage_03.png',
  '/assets/sprites/enemies/corrupted-samurai/damage/damage_04.png',
] as const;

export const SAMURAI_DEATH_FRAMES = [
  '/assets/sprites/enemies/corrupted-samurai/death/death_01.png',
  '/assets/sprites/enemies/corrupted-samurai/death/death_02.png',
  '/assets/sprites/enemies/corrupted-samurai/death/death_03.png',
  '/assets/sprites/enemies/corrupted-samurai/death/death_04.png',
  '/assets/sprites/enemies/corrupted-samurai/death/death_05.png',
  '/assets/sprites/enemies/corrupted-samurai/death/death_06.png',
] as const;

// Preload all Corrupted Samurai frames once on module load
if (typeof window !== 'undefined') {
  [
    ...SAMURAI_IDLE_FRAMES,
    ...SAMURAI_WALK_FRAMES,
    ...SAMURAI_CHASE_FRAMES,
    ...SAMURAI_JUMP_FRAMES,
    ...SAMURAI_ATTACK_FRAMES,
    ...SAMURAI_DAMAGE_FRAMES,
    ...SAMURAI_DEATH_FRAMES,
    '/assets/sprites/enemies/corrupted-samurai/effects/slash_arc_01.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/slash_arc_02.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/slash_arc_03.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/impact_01.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/impact_02.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/dust_01.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/dust_02.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/blood_hit_spark.png',
    '/assets/sprites/enemies/corrupted-samurai/effects/dark_energy.png',
  ].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export interface CorruptedSamuraiCharacterProps {
  state: 'idle' | 'patrol' | 'chase' | 'attack' | 'jump' | 'hurt' | 'dead' | 'spawn' | 'fly';
  facing?: 1 | -1;
  isHurt?: boolean;
}

const IDLE_DURATION_MS = 120;
const WALK_DURATION_MS = 110;
const CHASE_DURATION_MS = 85;
const JUMP_DURATION_MS = 80;
const ATTACK_DURATION_MS = 50;
const DAMAGE_DURATION_MS = 65;
const DEATH_DURATION_MS = 95;

export function CorruptedSamuraiCharacter({
  state = 'idle',
  facing = 1,
  isHurt = false,
}: CorruptedSamuraiCharacterProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  // Priority Mode: Death > Damage > Attack > Jump > Chase > Patrol > Idle
  const currentMode = state === 'dead'
    ? 'death'
    : (isHurt || state === 'hurt')
    ? 'damage'
    : state === 'attack'
    ? 'attack'
    : state === 'jump'
    ? 'jump'
    : state === 'chase'
    ? 'chase'
    : state === 'patrol'
    ? 'walk'
    : 'idle';

  const prevModeRef = useRef<string>(currentMode);

  useEffect(() => {
    if (prevModeRef.current !== currentMode) {
      setFrameIndex(0);
      prevModeRef.current = currentMode;
    }
  }, [currentMode]);

  useEffect(() => {
    if (currentMode === 'idle') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % SAMURAI_IDLE_FRAMES.length);
      }, IDLE_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'walk') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % SAMURAI_WALK_FRAMES.length);
      }, WALK_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'chase') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % SAMURAI_CHASE_FRAMES.length);
      }, CHASE_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'jump') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < SAMURAI_JUMP_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, JUMP_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'attack') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < SAMURAI_ATTACK_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, ATTACK_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'damage') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < SAMURAI_DAMAGE_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, DAMAGE_DURATION_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'death') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < SAMURAI_DEATH_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, DEATH_DURATION_MS);
      return () => window.clearInterval(interval);
    }
  }, [currentMode]);

  const flip = facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';

  let currentSrc: string;
  let spriteHeight = '56px';
  let maxWidth = '72px';

  if (currentMode === 'death') {
    const clampedIndex = Math.min(frameIndex, SAMURAI_DEATH_FRAMES.length - 1);
    currentSrc = SAMURAI_DEATH_FRAMES[clampedIndex];
    spriteHeight = '56px';
    maxWidth = '76px';
  } else if (currentMode === 'damage') {
    const clampedIndex = Math.min(frameIndex, SAMURAI_DAMAGE_FRAMES.length - 1);
    currentSrc = SAMURAI_DAMAGE_FRAMES[clampedIndex];
    spriteHeight = '56px';
    maxWidth = '72px';
  } else if (currentMode === 'attack') {
    const clampedIndex = Math.min(frameIndex, SAMURAI_ATTACK_FRAMES.length - 1);
    currentSrc = SAMURAI_ATTACK_FRAMES[clampedIndex];
    spriteHeight = '58px';
    maxWidth = '80px';
  } else if (currentMode === 'jump') {
    const clampedIndex = Math.min(frameIndex, SAMURAI_JUMP_FRAMES.length - 1);
    currentSrc = SAMURAI_JUMP_FRAMES[clampedIndex];
    spriteHeight = '58px';
    maxWidth = '78px';
  } else if (currentMode === 'chase') {
    currentSrc = SAMURAI_CHASE_FRAMES[frameIndex % SAMURAI_CHASE_FRAMES.length];
    spriteHeight = '56px';
    maxWidth = '72px';
  } else if (currentMode === 'walk') {
    currentSrc = SAMURAI_WALK_FRAMES[frameIndex % SAMURAI_WALK_FRAMES.length];
    spriteHeight = '56px';
    maxWidth = '72px';
  } else {
    currentSrc = SAMURAI_IDLE_FRAMES[frameIndex % SAMURAI_IDLE_FRAMES.length];
    spriteHeight = '56px';
    maxWidth = '72px';
  }

  return (
    <div
      style={{
        transform: flip,
        transformOrigin: 'center bottom',
        width: '54px',
        height: '58px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        position: 'relative',
      }}
      className="corrupted-samurai-character select-none pointer-events-none"
      data-state={state}
      data-mode={currentMode}
      data-frame={frameIndex}
    >
      <img
        src={currentSrc}
        alt={`Corrupted Samurai ${state}`}
        draggable={false}
        style={{
          height: spriteHeight,
          width: 'auto',
          maxWidth: maxWidth,
          objectFit: 'contain',
          objectPosition: 'center bottom',
          imageRendering: 'auto',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
