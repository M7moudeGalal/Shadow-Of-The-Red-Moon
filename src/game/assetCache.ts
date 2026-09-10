/**
 * SHADOW OF THE RED MOON — CENTRALIZED ASSET & IMAGE CACHE
 * ========================================================
 * Prevents continuous network request storms, cancels, and duplicate Image instantiation.
 * Holds strong references to every loaded HTMLImageElement in a Map<string, HTMLImageElement>.
 * Preloads all unique game animation frames once on startup.
 */

import {
  IDLE_FRAMES,
  RUN_FRAMES,
  JUMP_FRAMES,
  DOUBLE_JUMP_FRAMES,
  FALL_FRAMES,
  LAND_FRAMES,
  DASH_FRAMES,
  ATTACK_FRAMES,
  DOWN_ATTACK_FRAMES,
  CRIMSON_SLASH_COMBO_FRAMES,
  CRIMSON_BLADE_WAVE_FRAMES,
  BLOOD_SPIN_SLASH_FRAMES,
  SHADOW_DASH_STRIKE_FRAMES,
  AERIAL_KICK_FRAMES,
  DAMAGE_FRAMES,
  DEATH_FRAMES,
  THROW_FRAMES,
  SHURIKEN_FRAMES,
  PARRY_FRAMES,
  MASTER_PLAYER_REFERENCE,
  SHURIKEN_HIT_EFFECT,
  NINJA_RESPAWN_EFFECT,
  PARRY_EFFECT,
} from '@/components/NinjaCharacter';

import {
  HANZO_IDLE_FRAMES,
  HANZO_RUN_FRAMES,
  HANZO_DASH_FRAMES,
  HANZO_SPIN_FRAMES,
  HANZO_RISING_FRAMES,
  HANZO_TELEPORT_FRAMES,
  HANZO_JUMP_FRAMES,
  HANZO_DAMAGE_FRAMES,
  HANZO_DEATH_FRAMES,
  HANZO_HIT_EFFECT,
  MASTER_HANZO_SPRITE,
  HANZO_SPAWN_EFFECT,
} from '@/components/HanzoCharacter';

import {
  SAMURAI_IDLE_FRAMES,
  SAMURAI_WALK_FRAMES,
  SAMURAI_CHASE_FRAMES,
  SAMURAI_JUMP_FRAMES,
  SAMURAI_ATTACK_FRAMES,
  SAMURAI_DAMAGE_FRAMES,
  SAMURAI_DEATH_FRAMES,
} from '@/components/CorruptedSamuraiCharacter';

import {
  BAT_IDLE_FRAMES,
  BAT_FLY_FRAMES,
  BAT_DIVE_FRAMES,
  BAT_CLAW_FRAMES,
  BAT_DEATH_FRAMES,
  BAT_SPAWN_FRAMES,
  MASTER_BAT_REFERENCE,
} from '@/components/CorruptedBatCharacter';

import {
  MASTER_SAMURAI_REFERENCE,
} from '@/game/types';

// Persistent singleton cache holding strong references to all HTMLImageElement instances
const imageCache = new Map<string, HTMLImageElement>();
const failedPaths = new Set<string>();
let preloadingPromise: Promise<void> | null = null;

/**
 * Returns the cached HTMLImageElement for the given source path.
 * If not already in cache, creates a single Image instance once, stores it, and returns it.
 */
export function getImage(src: string): HTMLImageElement | null {
  if (typeof window === 'undefined' || !src) return null;

  const existing = imageCache.get(src);
  if (existing) {
    return existing;
  }

  const img = new Image();
  img.src = src;
  img.onload = () => {
    imageCache.set(src, img);
  };
  img.onerror = () => {
    if (!failedPaths.has(src)) {
      failedPaths.add(src);
      console.warn(`[AssetCache] Animation asset failed to load: ${src}`);
    }
  };
  imageCache.set(src, img);
  return img;
}

/**
 * Check if an asset is already loaded and ready in memory.
 */
export function isImageLoaded(src: string): boolean {
  if (typeof window === 'undefined' || !src) return false;
  const img = imageCache.get(src);
  return Boolean(img && img.complete && img.naturalWidth > 0);
}

/**
 * Preload an array of asset paths into memory cache in a controlled batch.
 */
export function preloadAssets(paths: readonly string[]): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();

  const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
  const promises = uniquePaths.map((src) => {
    return new Promise<void>((resolve) => {
      const existing = imageCache.get(src);
      if (existing && existing.complete) {
        resolve();
        return;
      }
      const img = existing || new Image();
      if (!existing) {
        img.src = src;
        imageCache.set(src, img);
      }
      if (img.complete) {
        resolve();
        return;
      }
      img.onload = () => resolve();
      img.onerror = () => {
        if (!failedPaths.has(src)) {
          failedPaths.add(src);
          console.warn(`[AssetCache] Preload failed: ${src}`);
        }
        resolve(); // Continue even if one fails
      };
    });
  });

  return Promise.all(promises).then(() => undefined);
}

/**
 * Collect all unique game animation frames and assets across all characters.
 */
export function getAllGameAssetPaths(): string[] {
  const allPaths = new Set<string>([
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

    MASTER_HANZO_SPRITE,
    ...HANZO_IDLE_FRAMES,
    ...HANZO_RUN_FRAMES,
    ...HANZO_DASH_FRAMES,
    ...HANZO_SPIN_FRAMES,
    ...HANZO_RISING_FRAMES,
    ...HANZO_TELEPORT_FRAMES,
    ...HANZO_JUMP_FRAMES,
    ...HANZO_DAMAGE_FRAMES,
    ...HANZO_DEATH_FRAMES,
    HANZO_HIT_EFFECT,
    HANZO_SPAWN_EFFECT,

    MASTER_SAMURAI_REFERENCE,
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

    MASTER_BAT_REFERENCE,
    ...BAT_IDLE_FRAMES,
    ...BAT_FLY_FRAMES,
    ...BAT_DIVE_FRAMES,
    ...BAT_CLAW_FRAMES,
    ...BAT_DEATH_FRAMES,
    ...BAT_SPAWN_FRAMES,
  ]);

  return Array.from(allPaths).filter(Boolean);
}

/**
 * Preload all game animation assets once during initial boot.
 * Guarantees that assets are fetched once, stored in imageCache, and never re-requested.
 */
export function preloadAllGameAssets(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (!preloadingPromise) {
    const allPaths = getAllGameAssetPaths();
    preloadingPromise = preloadAssets(allPaths);
  }
  return preloadingPromise;
}
