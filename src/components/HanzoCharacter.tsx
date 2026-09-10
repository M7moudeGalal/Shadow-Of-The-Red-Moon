import { useState, useEffect, useRef } from 'react';
import type { Enemy, HanzoTelegraphType } from '@/game/types';
import { getImage } from '@/game/assetCache';

/**
 * SHADOW OF THE RED MOON — STORY GUARDIAN BOSS: HANZO (半蔵)
 * =========================================================
 * Guardian of the Ancient Portal to Tamashi no Shinden in Chinoike Jigoku.
 * Noticeably taller than the Ninja (approx 210–220cm vs 180cm, ~1.20x scale).
 */

export const HANZO_IDLE_FRAMES = [
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo1.png',
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo2.png',
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo3.png',
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo4.png',
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo5.png',
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo6.png',
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo7.png',
  '/assets/sprites/enemies/hanzo/idle hanzo/idle_hanzo8.png',
] as const;

export const HANZO_RUN_FRAMES = [
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo1.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo2.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo3.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo4.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo5.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo6.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo7.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo8.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo9.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo10.png',
  '/assets/sprites/enemies/hanzo/run hanzo/run_hanzo11.png',
] as const;

export const HANZO_DASH_FRAMES = [
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo1.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo2.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo3.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo4.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo5.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo6.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo7.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo8.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo9.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo10.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo11.png',
  '/assets/sprites/enemies/hanzo/dash hanzo/dash_hanzo12.png',
] as const;

export const HANZO_SPIN_FRAMES = [
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash1.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash2.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash3.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash4.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash5.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash6.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash7.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash8.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash9.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash10.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash11.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash12.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash13.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash14.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash15.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash16.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash17.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash18.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash19.png',
  '/assets/sprites/enemies/hanzo/spin slash/spin_slash20.png',
] as const;

export const HANZO_RISING_FRAMES = [
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash1.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash2.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash3.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash4.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash5.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash6.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash7.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash8.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash9.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash10.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash11.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash12.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash13.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash14.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash15.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash16.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash17.png',
  '/assets/sprites/enemies/hanzo/rising slash/rising_slash18.png',
] as const;

export const HANZO_TELEPORT_FRAMES = [
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike1.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike2.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike3.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike4.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike5.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike6.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike7.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike8.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike9.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike10.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike11.png',
  '/assets/sprites/enemies/hanzo/teleport strike/teleport_strike12.png',
] as const;

export const HANZO_JUMP_FRAMES = [
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_1.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_2.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_3.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_4.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_5.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_6.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_7.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_8.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_9.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_10.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_11.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_12.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_13.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_14.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_15.png',
  '/assets/sprites/enemies/hanzo/jump hanzo/jump_hanzo_16.png',
] as const;

export const HANZO_DAMAGE_FRAMES = [
  '/assets/sprites/enemies/hanzo/damage hanzo/damage_hanzo_1.png',
  '/assets/sprites/enemies/hanzo/damage hanzo/damage_hanzo_2.png',
  '/assets/sprites/enemies/hanzo/damage hanzo/damage_hanzo_3.png',
  '/assets/sprites/enemies/hanzo/damage hanzo/damage_hanzo_4.png',
] as const;

export const HANZO_DEATH_FRAMES = [
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_1.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_2.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_3.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_4.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_5.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_6.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_7.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_8.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_9.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_10.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_11.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_12.png',
  '/assets/sprites/enemies/hanzo/death hanzo/death_hanzo_13.png',
] as const;

export const HANZO_HIT_EFFECT = '/assets/sprites/enemies/hanzo/hit_effect.gif' as const;
export const MASTER_HANZO_SPRITE = '/assets/sprites/enemies/hanzo/master.png' as const;
export const HANZO_SPAWN_EFFECT = '/assets/sprites/enemies/hanzo/Spawn Hazon effect.gif' as const;

export interface HanzoCharacterProps {
  state: Enemy['state'];
  animFrame?: number;
  attackFrame?: number;
  facing?: 1 | -1;
  isHurt?: boolean;
  jumpFrame?: number;
  damageFrame?: number;
  deathFrame?: number;
  telegraph?: HanzoTelegraphType;
  telegraphTimer?: number;
  telegraphMaxTimer?: number;
}

export function HanzoCharacter({
  state,
  animFrame,
  attackFrame,
  facing = 1,
  isHurt = false,
  jumpFrame,
  damageFrame,
  deathFrame,
  telegraph = 'none',
  telegraphTimer = 0,
  telegraphMaxTimer = 12,
}: HanzoCharacterProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const prevStateRef = useRef(state);

  // If Hanzo has completely dissolved and transitioned to 'dead', do not render sprite
  if (state === 'dead') {
    return null;
  }

  // Determine active frame group and timing cadence
  let frames: readonly string[] = HANZO_IDLE_FRAMES;
  let intervalMs = 110;
  let loop = true;

  switch (state) {
    case 'patrol':
    case 'chase':
      frames = HANZO_RUN_FRAMES;
      intervalMs = 80;
      loop = true;
      break;
    case 'dash':
      frames = HANZO_DASH_FRAMES;
      intervalMs = 45;
      loop = false;
      break;
    case 'spin_attack':
    case 'attack':
      frames = HANZO_SPIN_FRAMES;
      intervalMs = 42;
      loop = false;
      break;
    case 'rising_attack':
      frames = HANZO_RISING_FRAMES;
      intervalMs = 45;
      loop = false;
      break;
    case 'jump':
      frames = HANZO_JUMP_FRAMES;
      intervalMs = 58;
      loop = false;
      break;
    case 'teleport_attack':
      frames = HANZO_TELEPORT_FRAMES;
      intervalMs = 55;
      loop = false;
      break;
    case 'hurt':
      frames = HANZO_DAMAGE_FRAMES;
      intervalMs = 70;
      loop = false;
      break;
    case 'death':
      frames = HANZO_DEATH_FRAMES;
      intervalMs = 100;
      loop = false;
      break;
    case 'idle':
    default:
      frames = HANZO_IDLE_FRAMES;
      intervalMs = 110;
      loop = true;
      break;
  }

  // Reset frame index on state transitions
  useEffect(() => {
    if (prevStateRef.current !== state) {
      setFrameIndex(0);
      prevStateRef.current = state;
    }
  }, [state]);

  // Frame ticker (only active if engine does not supply animFrame)
  useEffect(() => {
    if (animFrame !== undefined) return;

    const timer = setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length) {
          return loop ? 0 : frames.length - 1;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [frames, intervalMs, loop, animFrame]);

  // Determine current frame with strict priority and death hold frame integrity
  let currentFrame: string;
  if (state === 'death') {
    // Final cutscene hold on death_hanzo_4 (index 3) unless deathFrame specifies continuation
    const dFrame = deathFrame !== undefined ? Math.min(deathFrame, HANZO_DEATH_FRAMES.length - 1) : 3;
    currentFrame = HANZO_DEATH_FRAMES[dFrame];
  } else if (state === 'hurt') {
    const dFrame = damageFrame !== undefined ? Math.min(damageFrame, HANZO_DAMAGE_FRAMES.length - 1) : 0;
    currentFrame = HANZO_DAMAGE_FRAMES[dFrame];
  } else if (state === 'jump') {
    const jFrame = jumpFrame !== undefined ? Math.min(jumpFrame, HANZO_JUMP_FRAMES.length - 1) : 0;
    currentFrame = HANZO_JUMP_FRAMES[jFrame];
  } else if (state === 'spin_attack') {
    const sFrame = attackFrame !== undefined ? Math.min(attackFrame, HANZO_SPIN_FRAMES.length - 1) : (animFrame !== undefined ? animFrame % HANZO_SPIN_FRAMES.length : frameIndex % HANZO_SPIN_FRAMES.length);
    currentFrame = HANZO_SPIN_FRAMES[sFrame];
  } else if (state === 'rising_attack') {
    const rFrame = attackFrame !== undefined ? Math.min(attackFrame, HANZO_RISING_FRAMES.length - 1) : (animFrame !== undefined ? animFrame % HANZO_RISING_FRAMES.length : frameIndex % HANZO_RISING_FRAMES.length);
    currentFrame = HANZO_RISING_FRAMES[rFrame];
  } else if (state === 'dash') {
    const dFrame = animFrame !== undefined ? Math.min(animFrame, HANZO_DASH_FRAMES.length - 1) : Math.min(frameIndex, HANZO_DASH_FRAMES.length - 1);
    currentFrame = HANZO_DASH_FRAMES[dFrame];
  } else if (state === 'teleport_attack') {
    const tFrame = animFrame !== undefined ? Math.min(animFrame, HANZO_TELEPORT_FRAMES.length - 1) : Math.min(frameIndex, HANZO_TELEPORT_FRAMES.length - 1);
    currentFrame = HANZO_TELEPORT_FRAMES[tFrame];
  } else if (state === 'chase' || state === 'patrol') {
    const rFrame = animFrame !== undefined ? animFrame % HANZO_RUN_FRAMES.length : frameIndex % HANZO_RUN_FRAMES.length;
    currentFrame = HANZO_RUN_FRAMES[rFrame];
  } else {
    const iFrame = animFrame !== undefined ? animFrame % HANZO_IDLE_FRAMES.length : frameIndex % HANZO_IDLE_FRAMES.length;
    currentFrame = HANZO_IDLE_FRAMES[iFrame];
  }

  // Consistent character scale calculation relative to raw image pixel dimensions
  const cachedImg = getImage(currentFrame);
  const natH = (cachedImg && cachedImg.naturalHeight > 0) ? cachedImg.naturalHeight : 378;
  const natW = (cachedImg && cachedImg.naturalWidth > 0) ? cachedImg.naturalWidth : 350;
  const spriteH = Math.round(natH * 0.217);
  const spriteW = Math.round(natW * 0.217);

  const isTelegraphing = Boolean(telegraph && telegraph !== 'none' && state !== 'death' && !isHurt);
  const teleportProgress = isTelegraphing && telegraph === 'teleport'
    ? Math.min(1, Math.max(0, 1 - telegraphTimer / (telegraphMaxTimer || 12)))
    : 0;
  const teleportOpacity = isTelegraphing && telegraph === 'teleport'
    ? Math.max(0, 1 - teleportProgress * 1.5)
    : 1;

  let filterStyle = 'drop-shadow(0 0 8px rgba(140,20,255,0.45)) drop-shadow(0 4px 6px rgba(0,0,0,0.8))';
  if (isHurt) {
    filterStyle = 'brightness(2.4) drop-shadow(0 0 16px rgba(255,43,54,0.95)) drop-shadow(0 0 25px rgba(180,0,255,0.7))';
  } else if (state === 'death') {
    filterStyle = 'drop-shadow(0 0 18px rgba(160,32,240,0.95)) drop-shadow(0 0 32px rgba(100,0,180,0.85)) drop-shadow(0 4px 10px rgba(0,0,0,0.9))';
  } else if (isTelegraphing) {
    if (telegraph === 'rising') {
      filterStyle = 'drop-shadow(0 0 16px rgba(192,132,252,0.95)) drop-shadow(0 0 28px rgba(147,51,234,0.85)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))';
    } else if (telegraph === 'spin') {
      filterStyle = 'drop-shadow(0 0 20px rgba(168,85,247,0.95)) drop-shadow(0 0 34px rgba(126,34,206,0.85)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))';
    } else if (telegraph === 'teleport') {
      filterStyle = 'drop-shadow(0 0 22px rgba(147,51,234,0.95)) drop-shadow(0 0 36px rgba(88,28,135,0.9))';
    }
  }

  const transformStyle = isTelegraphing && telegraph === 'rising'
    ? `translateX(-47px) translateY(-19px) ${facing === -1 ? 'scaleX(-1)' : 'scaleX(1)'} scaleY(0.95)`
    : `translateX(-47px) translateY(-22px) ${facing === -1 ? 'scaleX(-1)' : 'scaleX(1)'}`;

  return (
    <div
      className="relative pointer-events-none select-none will-change-transform"
      style={{
        width: '130px',
        height: '82px',
        transform: transformStyle,
        transformOrigin: 'bottom center',
        filter: filterStyle,
        opacity: teleportOpacity,
        transition: isTelegraphing ? 'filter 0.08s ease, transform 0.1s ease' : 'filter 0.1s ease',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <img
        src={currentFrame}
        alt="Hanzo Boss"
        className="pointer-events-none select-none"
        style={{
          width: `${spriteW}px`,
          height: `${spriteH}px`,
          maxWidth: 'none',
          maxHeight: 'none',
          objectFit: 'contain',
          objectPosition: 'bottom center',
          imageRendering: 'auto',
          display: 'block',
        }}
        draggable={false}
      />

      {/* RISING SLASH TELEGRAPH OVERLAYS: Intense glowing eyes & sword energy aura */}
      {isTelegraphing && telegraph === 'rising' && (
        <>
          {/* Intense Purple Eye Flare (centered on Hanzo's face) */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '24px',
              left: '60px',
              zIndex: 14,
            }}
          >
            <div
              style={{
                width: '4px',
                height: '3px',
                borderRadius: '50%',
                backgroundColor: '#f5d0fe',
                boxShadow: '0 0 6px #e879f9, 0 0 14px #c084fc, 0 0 22px #9333ea',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '1px',
                left: '-10px',
                width: '24px',
                height: '1.5px',
                background: 'linear-gradient(90deg, transparent, rgba(232,121,249,0.95), transparent)',
                boxShadow: '0 0 8px #d946ef',
              }}
            />
          </div>

          {/* Subtle Katana Edge Violet Shimmer */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '20px',
              left: '42px',
              width: '2.5px',
              height: '34px',
              transform: 'rotate(22deg)',
              background: 'linear-gradient(to top, transparent, rgba(216,180,254,0.95), transparent)',
              filter: 'blur(0.5px)',
              boxShadow: '0 0 10px rgba(192,132,252,0.9)',
              zIndex: 13,
            }}
          />
        </>
      )}

      {/* SPIN SLASH TELEGRAPH OVERLAYS: Sword gleam & concentrated energy pulse */}
      {isTelegraphing && telegraph === 'spin' && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: '28px',
            left: '38px',
            width: '3px',
            height: '30px',
            transform: 'rotate(32deg)',
            background: 'linear-gradient(to top, transparent, rgba(192,132,252,0.95), transparent)',
            filter: 'blur(0.5px)',
            boxShadow: '0 0 14px rgba(168,85,247,0.95)',
            zIndex: 13,
          }}
        />
      )}
    </div>
  );
}
