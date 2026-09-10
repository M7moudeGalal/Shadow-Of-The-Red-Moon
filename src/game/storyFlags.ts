// Story flags and narrative progression persistence for Shadow of the Red Moon

import type { StoryChoice } from './types';

export interface StoryFlags {
  hanzo_guardian_reveal_complete: boolean;
  hanzo_met_purple_entity: boolean;
  hanzo_received_extra_soul: boolean;
  hanzo_discovered_guardian_identity: boolean;
  hanzo_choice_made?: StoryChoice | null;
}

const STORAGE_KEY = 'shadow_red_moon_story_flags';

const DEFAULT_FLAGS: StoryFlags = {
  hanzo_guardian_reveal_complete: false,
  hanzo_met_purple_entity: true,        // Lore: Occurred at beginning of Hell in Yunami Jigoku
  hanzo_received_extra_soul: true,       // Lore: Bestowed by mysterious entity
  hanzo_discovered_guardian_identity: false,
  hanzo_choice_made: null,
};

let inMemoryFlags: StoryFlags = { ...DEFAULT_FLAGS };

export function loadStoryFlags(): StoryFlags {
  if (typeof window === 'undefined') return { ...inMemoryFlags };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...inMemoryFlags };
    const parsed = JSON.parse(raw);
    inMemoryFlags = {
      ...DEFAULT_FLAGS,
      ...parsed,
    };
    return { ...inMemoryFlags };
  } catch {
    return { ...inMemoryFlags };
  }
}

export function saveStoryFlags(flags: Partial<StoryFlags>): StoryFlags {
  inMemoryFlags = {
    ...inMemoryFlags,
    ...flags,
  };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryFlags));
    } catch {}
  }
  return { ...inMemoryFlags };
}

export function resetStoryFlags(): StoryFlags {
  inMemoryFlags = { ...DEFAULT_FLAGS };
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }
  return { ...inMemoryFlags };
}
