import { useState, useEffect, useRef } from 'react';

/**
 * SHADOW OF THE RED MOON — CORRUPTED BAT CHARACTER
 * ===============================================
 * Frame-based PNG sprite renderer for the flying Corrupted Bat:
 * - IDLE / HOVER Animation (6 frames, 105ms cadence, continuous loop)
 * - FLY Animation (12 frames, 75ms cadence, continuous loop)
 * - DIVE / CHARGE Animation (8 frames, 60ms cadence, single-play holding dive_08)
 * - CLAW ATTACK Animation (8 frames, 55ms cadence, single-play holding claw_08)
 * - DEATH Animation (12 frames, 85ms cadence, single-play holding death_12 permanently)
 * - SPAWN / APPEAR Animation (6 frames, 85ms cadence, single-play holding spawn_06)
 * 
 * Asset Paths:
 * Master: /assets/sprites/enemies/corrupted-bat/master.png (reference only)
 * Idle:   /assets/sprites/enemies/corrupted-bat/idle/idle_01.png ... idle_06.png
 * Fly:    /assets/sprites/enemies/corrupted-bat/fly/fly_01.png ... fly_12.png
 * Dive:   /assets/sprites/enemies/corrupted-bat/dive/dive_01.png ... dive_08.png
 * Claw:   /assets/sprites/enemies/corrupted-bat/claw-attack/claw_01.png ... claw_08.png
 * Death:  /assets/sprites/enemies/corrupted-bat/death/death_01.png ... death_12.png
 * Spawn:  /assets/sprites/enemies/corrupted-bat/spawn/spawn_01.png ... spawn_06.png
 * 
 * Priority Hierarchy:
 * DEATH > DAMAGE > SPAWN / APPEAR > CLAW_ATTACK > DIVE > FLY > IDLE / HOVER
 * 
 * Gameplay Hitbox: 32px width × 34px height
 * Centered around entity collision box
 */

export const BAT_IDLE_FRAMES = [
  '/assets/sprites/enemies/corrupted-bat/idle/idle_01.png',
  '/assets/sprites/enemies/corrupted-bat/idle/idle_02.png',
  '/assets/sprites/enemies/corrupted-bat/idle/idle_03.png',
  '/assets/sprites/enemies/corrupted-bat/idle/idle_04.png',
  '/assets/sprites/enemies/corrupted-bat/idle/idle_05.png',
  '/assets/sprites/enemies/corrupted-bat/idle/idle_06.png',
] as const;

export const BAT_FLY_FRAMES = [
  '/assets/sprites/enemies/corrupted-bat/fly/fly_01.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_02.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_03.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_04.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_05.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_06.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_07.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_08.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_09.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_10.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_11.png',
  '/assets/sprites/enemies/corrupted-bat/fly/fly_12.png',
] as const;

export const BAT_DIVE_FRAMES = [
  '/assets/sprites/enemies/corrupted-bat/dive/dive_01.png',
  '/assets/sprites/enemies/corrupted-bat/dive/dive_02.png',
  '/assets/sprites/enemies/corrupted-bat/dive/dive_03.png',
  '/assets/sprites/enemies/corrupted-bat/dive/dive_04.png',
  '/assets/sprites/enemies/corrupted-bat/dive/dive_05.png',
  '/assets/sprites/enemies/corrupted-bat/dive/dive_06.png',
  '/assets/sprites/enemies/corrupted-bat/dive/dive_07.png',
  '/assets/sprites/enemies/corrupted-bat/dive/dive_08.png',
] as const;

export const BAT_CLAW_FRAMES = [
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_01.png',
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_02.png',
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_03.png',
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_04.png',
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_05.png',
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_06.png',
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_07.png',
  '/assets/sprites/enemies/corrupted-bat/claw-attack/claw_08.png',
] as const;

export const BAT_DEATH_FRAMES = [
  '/assets/sprites/enemies/corrupted-bat/death/death_01.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_02.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_03.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_04.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_05.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_06.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_07.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_08.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_09.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_10.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_11.png',
  '/assets/sprites/enemies/corrupted-bat/death/death_12.png',
] as const;

export const BAT_SPAWN_FRAMES = [
  '/assets/sprites/enemies/corrupted-bat/spawn/spawn_01.png',
  '/assets/sprites/enemies/corrupted-bat/spawn/spawn_02.png',
  '/assets/sprites/enemies/corrupted-bat/spawn/spawn_03.png',
  '/assets/sprites/enemies/corrupted-bat/spawn/spawn_04.png',
  '/assets/sprites/enemies/corrupted-bat/spawn/spawn_05.png',
  '/assets/sprites/enemies/corrupted-bat/spawn/spawn_06.png',
] as const;

export const MASTER_BAT_REFERENCE = '/assets/sprites/enemies/corrupted-bat/master.png' as const;

// Preload all 6 Idle, 12 Fly, 8 Dive, 8 Claw, 12 Death, and 6 Spawn frames + Master once on module load
if (typeof window !== 'undefined') {
  [
    ...BAT_IDLE_FRAMES,
    ...BAT_FLY_FRAMES,
    ...BAT_DIVE_FRAMES,
    ...BAT_CLAW_FRAMES,
    ...BAT_DEATH_FRAMES,
    ...BAT_SPAWN_FRAMES,
    MASTER_BAT_REFERENCE,
  ].forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

export interface CorruptedBatCharacterProps {
  state?: 'idle' | 'fly' | 'dive' | 'claw_attack' | 'chase' | 'patrol' | 'attack' | 'jump' | 'hurt' | 'dead' | 'spawn';
  attackType?: 'claw' | 'dive';
  isMoving?: boolean;
  facing?: 1 | -1;
  isHurt?: boolean;
}

const IDLE_FRAME_MS = 105;
const FLY_FRAME_MS = 75;
const DIVE_FRAME_MS = 60;
const CLAW_FRAME_MS = 55;
const DEATH_FRAME_MS = 85;
const SPAWN_FRAME_MS = 85;

export function CorruptedBatCharacter({
  state = 'idle',
  attackType = 'claw',
  isMoving = false,
  facing = 1,
  isHurt = false,
}: CorruptedBatCharacterProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  // Determine sub-states
  const isSpawn = state === 'spawn';
  const isClawAttack = state === 'claw_attack' || (state === 'attack' && attackType === 'claw');
  const isDiving = state === 'dive' || (state === 'attack' && attackType === 'dive');
  const isFlying = state === 'fly' || state === 'chase' || isMoving;

  // Visual Priority: Death > Damage > Spawn > Claw Attack > Dive > Fly > Idle
  const currentMode = state === 'dead'
    ? 'death'
    : (isHurt || state === 'hurt')
    ? 'hurt'
    : isSpawn
    ? 'spawn'
    : isClawAttack
    ? 'claw'
    : isDiving
    ? 'dive'
    : isFlying
    ? 'fly'
    : 'idle';

  const prevModeRef = useRef<string>(currentMode);

  // Reset to frame 0 once when transitioning between modes
  useEffect(() => {
    if (prevModeRef.current !== currentMode) {
      setFrameIndex(0);
      prevModeRef.current = currentMode;
    }
  }, [currentMode]);

  // Frame advance loop
  useEffect(() => {
    if (currentMode === 'death') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < BAT_DEATH_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev; // Hold death_12 permanently once finished
        });
      }, DEATH_FRAME_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'spawn') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < BAT_SPAWN_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev; // Hold spawn_06 until state transitions to idle
        });
      }, SPAWN_FRAME_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'claw') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < BAT_CLAW_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev; // Hold claw_08 while attack state finishes
        });
      }, CLAW_FRAME_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'dive') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => {
          if (prev < BAT_DIVE_FRAMES.length - 1) {
            return prev + 1;
          }
          return prev; // Hold dive_08 while dive state finishes
        });
      }, DIVE_FRAME_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'fly') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % BAT_FLY_FRAMES.length);
      }, FLY_FRAME_MS);
      return () => window.clearInterval(interval);
    }

    if (currentMode === 'idle') {
      const interval = window.setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % BAT_IDLE_FRAMES.length);
      }, IDLE_FRAME_MS);
      return () => window.clearInterval(interval);
    }
  }, [currentMode]);

  const flip = facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';

  let currentSrc: string;
  if (currentMode === 'death') {
    const clampedIndex = Math.min(frameIndex, BAT_DEATH_FRAMES.length - 1);
    currentSrc = BAT_DEATH_FRAMES[clampedIndex];
  } else if (currentMode === 'spawn') {
    const clampedIndex = Math.min(frameIndex, BAT_SPAWN_FRAMES.length - 1);
    currentSrc = BAT_SPAWN_FRAMES[clampedIndex];
  } else if (currentMode === 'claw') {
    const clampedIndex = Math.min(frameIndex, BAT_CLAW_FRAMES.length - 1);
    currentSrc = BAT_CLAW_FRAMES[clampedIndex];
  } else if (currentMode === 'dive') {
    const clampedIndex = Math.min(frameIndex, BAT_DIVE_FRAMES.length - 1);
    currentSrc = BAT_DIVE_FRAMES[clampedIndex];
  } else if (currentMode === 'fly') {
    currentSrc = BAT_FLY_FRAMES[frameIndex % BAT_FLY_FRAMES.length];
  } else {
    currentSrc = BAT_IDLE_FRAMES[frameIndex % BAT_IDLE_FRAMES.length];
  }

  return (
    <div
      style={{
        transform: flip,
        transformOrigin: 'center center',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        userSelect: 'none',
        pointerEvents: 'none',
      }}
      className="corrupted-bat-character select-none pointer-events-none"
      data-mode={currentMode}
      data-frame={frameIndex}
    >
      <img
        src={currentSrc}
        alt={`Corrupted Bat ${currentMode}`}
        draggable={false}
        style={{
          width: '64px',
          height: '64px',
          objectFit: 'contain',
          objectPosition: 'center center',
          display: 'block',
          userSelect: 'none',
          pointerEvents: 'none',
          filter: isHurt
            ? 'brightness(2.2) drop-shadow(0 0 10px rgba(255,59,70,0.9))'
            : currentMode === 'death'
            ? 'drop-shadow(0 0 12px rgba(224,37,46,0.6))'
            : currentMode === 'spawn'
            ? 'drop-shadow(0 0 16px rgba(224,37,46,0.8))'
            : currentMode === 'claw'
            ? 'drop-shadow(0 0 12px rgba(255,59,70,0.7)) drop-shadow(0 4px 8px rgba(0,0,0,0.7))'
            : currentMode === 'dive'
            ? 'drop-shadow(0 0 12px rgba(255,59,70,0.6)) drop-shadow(0 4px 8px rgba(0,0,0,0.7))'
            : 'drop-shadow(0 0 8px rgba(224,37,46,0.3)) drop-shadow(0 4px 6px rgba(0,0,0,0.6))',
        }}
      />
    </div>
  );
}
