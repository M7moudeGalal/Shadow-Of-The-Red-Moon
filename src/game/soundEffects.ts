// Web Audio API procedural sound synthesizer for Shadow of the Red Moon

let audioCtx: AudioContext | null = null;
let isMutedState = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      loadSfxBuffers();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

let hanzoIntroAudio: HTMLAudioElement | null = null;
let hanzoBattleAudio: HTMLAudioElement | null = null;
let runningAudio: HTMLAudioElement | null = null;
let isRunningAudioPlaying = false;
let titleFireAudio: HTMLAudioElement | null = null;
let isTitleFirePlaying = false;
let bloodRainAudio: HTMLAudioElement | null = null;
let isBloodRainPlaying = false;
let cinematicDroneOsc: OscillatorNode | null = null;
let cinematicDroneGain: GainNode | null = null;

export type SfxKey = 'jump' | 'doubleJump' | 'dash' | 'hanzoTeleport' | 'shurikenThrow';

// Audio buffers for zero-latency Web Audio API playback
const sfxBuffers: { [key in SfxKey]: AudioBuffer | null } = {
  jump: null,
  doubleJump: null,
  dash: null,
  hanzoTeleport: null,
  shurikenThrow: null,
};

const sfxUrls: { [key in SfxKey]: string } = {
  jump: '/audio/jump_ninja_sfx.mp3',
  doubleJump: '/audio/double_jump_ninja_sfx.mp3',
  dash: '/audio/dash_ninja_sfx.mp3',
  hanzoTeleport: '/audio/teleport_hanzo.mp3',
  shurikenThrow: '/audio/Whip_SFX_Pack_mp3_1710999340.mp3',
};

// Fallback HTMLAudioElement pools
const sfxPools: { [key in SfxKey]?: HTMLAudioElement[] } = {};
const poolIndices: { [key in SfxKey]: number } = {
  jump: 0,
  doubleJump: 0,
  dash: 0,
  hanzoTeleport: 0,
  shurikenThrow: 0,
};

function getAudioPool(key: SfxKey): HTMLAudioElement[] {
  if (!sfxPools[key]) {
    const url = sfxUrls[key];
    sfxPools[key] = [
      new Audio(url),
      new Audio(url),
      new Audio(url),
      new Audio(url),
    ];
    sfxPools[key]!.forEach((a) => {
      a.preload = 'auto';
      a.muted = isMutedState;
    });
  }
  return sfxPools[key]!;
}

function loadSfxBuffers() {
  if (typeof window === 'undefined') return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const entries: { key: SfxKey; url: string }[] = [
    { key: 'jump', url: sfxUrls.jump },
    { key: 'doubleJump', url: sfxUrls.doubleJump },
    { key: 'dash', url: sfxUrls.dash },
    { key: 'hanzoTeleport', url: sfxUrls.hanzoTeleport },
    { key: 'shurikenThrow', url: sfxUrls.shurikenThrow },
  ];

  for (const { key, url } of entries) {
    if (sfxBuffers[key]) continue;
    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((ab) => ctx.decodeAudioData(ab))
      .then((decoded) => {
        sfxBuffers[key] = decoded;
      })
      .catch(() => {});
  }
}

function playSfx(key: SfxKey, volume: number) {
  if (isMutedState) return;
  const ctx = getAudioContext();
  if (ctx) {
    const buf = sfxBuffers[key];
    if (buf) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        src.connect(gain);
        gain.connect(ctx.destination);
        src.start(0);
        return;
      } catch {}
    }
  }

  // Fallback to HTMLAudioElement pool
  if (typeof window !== 'undefined') {
    try {
      const pool = getAudioPool(key);
      const audio = pool[poolIndices[key] % pool.length];
      poolIndices[key] = (poolIndices[key] + 1) % pool.length;
      audio.currentTime = 0;
      audio.volume = volume;
      audio.muted = isMutedState;
      audio.play().catch(() => {});
    } catch {}
  }
}

function getRunningAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!runningAudio) {
    runningAudio = new Audio('/audio/fast_running_ninja_sfx.mp3');
    runningAudio.loop = true;
    runningAudio.volume = 0.38;
    runningAudio.preload = 'auto';
    runningAudio.muted = isMutedState;
    runningAudio.addEventListener('ended', () => {
      if (runningAudio && isRunningAudioPlaying && !isMutedState) {
        runningAudio.currentTime = 0;
        runningAudio.play().catch(() => {});
      }
    });
  }
  return runningAudio;
}

function getTitleFireAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!titleFireAudio) {
    titleFireAudio = new Audio('/audio/fire_blaze.mp3');
    titleFireAudio.loop = true;
    titleFireAudio.volume = 0.45;
    titleFireAudio.preload = 'auto';
    titleFireAudio.muted = isMutedState;
    titleFireAudio.addEventListener('ended', () => {
      if (titleFireAudio && isTitleFirePlaying && !isMutedState) {
        titleFireAudio.currentTime = 0;
        titleFireAudio.play().catch(() => {});
      }
    });
  }
  return titleFireAudio;
}

function getBloodRainAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!bloodRainAudio) {
    bloodRainAudio = new Audio('/audio/Water_Drops_In_Tunnel_mp3_1702362428.mp3');
    bloodRainAudio.loop = true;
    bloodRainAudio.volume = 0.45;
    bloodRainAudio.preload = 'auto';
    bloodRainAudio.muted = isMutedState;
    bloodRainAudio.addEventListener('ended', () => {
      if (bloodRainAudio && isBloodRainPlaying && !isMutedState) {
        bloodRainAudio.currentTime = 0;
        bloodRainAudio.play().catch(() => {});
      }
    });
  }
  return bloodRainAudio;
}

function getHanzoIntroAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!hanzoIntroAudio) {
    hanzoIntroAudio = new Audio('/audio/Japanese_Intro_mp3.mp3');
    hanzoIntroAudio.volume = 0.88;
    hanzoIntroAudio.preload = 'auto';
  }
  return hanzoIntroAudio;
}

function getHanzoBattleAudio(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  if (!hanzoBattleAudio) {
    hanzoBattleAudio = new Audio('/audio/The Dragon Awakens.mp3');
    hanzoBattleAudio.loop = true;
    hanzoBattleAudio.volume = 0.85;
    hanzoBattleAudio.preload = 'auto';

    // Guaranteed looping playback
    hanzoBattleAudio.addEventListener('ended', () => {
      if (hanzoBattleAudio) {
        hanzoBattleAudio.currentTime = 0;
        hanzoBattleAudio.play().catch(() => {});
      }
    });
  }
  return hanzoBattleAudio;
}

export const soundEffects = {
  isMuted(): boolean {
    return isMutedState;
  },

  toggleMute(): boolean {
    isMutedState = !isMutedState;
    this.applyMuteState();
    return isMutedState;
  },

  setMuted(muted: boolean): void {
    isMutedState = muted;
    this.applyMuteState();
  },

  applyMuteState(): void {
    if (hanzoIntroAudio) hanzoIntroAudio.muted = isMutedState;
    if (hanzoBattleAudio) hanzoBattleAudio.muted = isMutedState;
    if (runningAudio) {
      runningAudio.muted = isMutedState;
      if (isMutedState && !runningAudio.paused) {
        runningAudio.pause();
      } else if (!isMutedState && isRunningAudioPlaying && runningAudio.paused) {
        runningAudio.play().catch(() => {});
      }
    }
    if (titleFireAudio) {
      titleFireAudio.muted = isMutedState;
      if (isMutedState && !titleFireAudio.paused) {
        titleFireAudio.pause();
      } else if (!isMutedState && isTitleFirePlaying && titleFireAudio.paused) {
        titleFireAudio.play().catch(() => {});
      }
    }
    if (bloodRainAudio) {
      bloodRainAudio.muted = isMutedState;
      if (isMutedState && !bloodRainAudio.paused) {
        bloodRainAudio.pause();
      } else if (!isMutedState && isBloodRainPlaying && bloodRainAudio.paused) {
        bloodRainAudio.play().catch(() => {});
      }
    }
    for (const key of ['jump', 'doubleJump', 'dash', 'hanzoTeleport', 'shurikenThrow'] as const) {
      const pool = sfxPools[key];
      if (pool) {
        pool.forEach((a) => { a.muted = isMutedState; });
      }
    }
  },

  /** Menu navigation hover chime (wooden/metallic resonance) */
  playMenuHover(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // Audio context might be restricted before user gesture
    }
  },

  /** Menu confirm / activate (katana unsheath + taiko thump) */
  playMenuSelect(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Katana metallic ring
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.08); // D6

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.25);

      // Low bass thud
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(120, ctx.currentTime);
      bass.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.2);

      bassGain.gain.setValueAtTime(0.2, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      bass.connect(bassGain);
      bassGain.connect(ctx.destination);

      bass.start();
      bass.stop(ctx.currentTime + 0.2);
    } catch {}
  },

  /** Menu navigation selection tick (alias for playMenuHover) */
  playSelect(): void {
    this.playMenuHover();
  },

  /** Menu / Choice confirm sound (alias for playMenuSelect) */
  playConfirm(): void {
    this.playMenuSelect();
  },

  /** Sword attack slash whoosh */
  playAttack(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const bufferSize = ctx.sampleRate * 0.12;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);
      filter.Q.setValueAtTime(3, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      whiteNoise.start();
    } catch {}
  },

  playSlash(): void {
    this.playAttack();
  },

  /** Execution blade slice sound (sharp metallic edge cut) */
  playSlice(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) {
      this.playSlash();
      return;
    }
    try {
      // Metallic blade edge glint
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.18);
      oscGain.gain.setValueAtTime(0.22, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);

      // White noise blade rush
      this.playSlash();
    } catch {
      this.playSlash();
    }
  },

  /** Start looping ninja fast running sound (Fast_Running ninja sfx) */
  startRunning(): void {
    if (isMutedState) return;
    const audio = getRunningAudio();
    if (!audio) return;
    if (isRunningAudioPlaying && !audio.paused) return;
    isRunningAudioPlaying = true;
    audio.muted = isMutedState;
    audio.volume = 0.38;
    const p = audio.play();
    if (p !== undefined) {
      p.catch(() => {});
    }
  },

  /** Stop looping ninja fast running sound */
  stopRunning(): void {
    isRunningAudioPlaying = false;
    if (runningAudio && !runningAudio.paused) {
      runningAudio.pause();
      runningAudio.currentTime = 0;
    }
  },

  /** Play title menu ambient fire blaze SFX (ONLY played on Title Menu) */
  playTitleFireBlaze(muted?: boolean): void {
    if (typeof window === 'undefined') return;
    isTitleFirePlaying = true;
    const audio = getTitleFireAudio();
    if (!audio) return;
    if (muted !== undefined) {
      isMutedState = muted;
    }
    audio.muted = isMutedState;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const onInteraction = () => {
          if (isTitleFirePlaying && titleFireAudio) {
            titleFireAudio.play().catch(() => {});
          }
          window.removeEventListener('click', onInteraction);
          window.removeEventListener('keydown', onInteraction);
          window.removeEventListener('touchstart', onInteraction);
          window.removeEventListener('pointerdown', onInteraction);
        };
        window.addEventListener('click', onInteraction, { once: true });
        window.addEventListener('keydown', onInteraction, { once: true });
        window.addEventListener('touchstart', onInteraction, { once: true });
        window.addEventListener('pointerdown', onInteraction, { once: true });
      });
    }
  },

  /** Stop title menu ambient fire blaze SFX */
  stopTitleFireBlaze(): void {
    isTitleFirePlaying = false;
    if (titleFireAudio) {
      titleFireAudio.pause();
      titleFireAudio.currentTime = 0;
    }
  },

  /** Check if title fire blaze is currently playing */
  isTitleFireBlazePlaying(): boolean {
    return isTitleFirePlaying && !!titleFireAudio && !titleFireAudio.paused;
  },

  /** Atmospheric Supernatural Blood Rain Ambiance (Water_Drops_In_Tunnel_mp3_1702362428.mp3) */
  playBloodRain(volume: number = 0.45): void {
    if (typeof window === 'undefined') return;
    isBloodRainPlaying = true;
    const audio = getBloodRainAudio();
    if (!audio) return;
    audio.volume = volume;
    audio.muted = isMutedState;
    if (isMutedState) return;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const onInteraction = () => {
          if (isBloodRainPlaying && bloodRainAudio && !isMutedState) {
            bloodRainAudio.play().catch(() => {});
          }
          window.removeEventListener('click', onInteraction);
          window.removeEventListener('keydown', onInteraction);
          window.removeEventListener('touchstart', onInteraction);
          window.removeEventListener('pointerdown', onInteraction);
        };
        window.addEventListener('click', onInteraction, { once: true });
        window.addEventListener('keydown', onInteraction, { once: true });
        window.addEventListener('touchstart', onInteraction, { once: true });
        window.addEventListener('pointerdown', onInteraction, { once: true });
      });
    }
  },

  /** Stop Blood Rain Ambiance */
  stopBloodRain(): void {
    isBloodRainPlaying = false;
    if (bloodRainAudio) {
      bloodRainAudio.pause();
      bloodRainAudio.currentTime = 0;
    }
  },

  /** Pause Blood Rain Ambiance without resetting time position */
  pauseBloodRain(): void {
    if (bloodRainAudio) {
      bloodRainAudio.pause();
    }
  },

  /** Check if Blood Rain Ambiance is currently playing */
  isBloodRainPlaying(): boolean {
    return isBloodRainPlaying && !!bloodRainAudio && !bloodRainAudio.paused;
  },

  /** Ninja running footstep audio */
  playFootstep(): void {
    this.startRunning();
  },

  /** Swift shadow dash (dash ninja sfx) */
  playDash(): void {
    playSfx('dash', 0.55);
  },

  /** Jump sound (jump ninja sfx) */
  playJump(): void {
    playSfx('jump', 0.50);
  },

  /** Ninja double jump (double jump ninja sfx) */
  playDoubleJump(): void {
    playSfx('doubleJump', 0.55);
  },

  /** Enemy hit metal clink & impact */
  playHit(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.14);

      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {}
  },

  /** Samurai blade parry / guard deflection (crisp metallic clash & ringing steel) */
  playParry(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. High metallic clash clang (dual resonant tones)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const toneGain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1450, now);
      osc1.frequency.exponentialRampToValueAtTime(920, now + 0.18);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(2180, now);
      osc2.frequency.exponentialRampToValueAtTime(1850, now + 0.25);

      toneGain.gain.setValueAtTime(0.24, now);
      toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc1.connect(toneGain);
      osc2.connect(toneGain);
      toneGain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.25);
      osc2.stop(now + 0.25);

      // 2. Sharp transient spark / friction clink
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'sawtooth';
      snapOsc.frequency.setValueAtTime(3200, now);
      snapOsc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

      snapGain.gain.setValueAtTime(0.2, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);

      snapOsc.start(now);
      snapOsc.stop(now + 0.06);
    } catch {}
  },

  /** Coin pickup shimmer */
  playCoin(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(987.77, ctx.currentTime); // B5
      osc1.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.06); // E6
      osc2.frequency.setValueAtTime(1975.53, ctx.currentTime + 0.06); // B6

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.06);
      osc1.stop(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.22);
    } catch {}
  },

  /** Checkpoint activated (mystical lantern bell) */
  playCheckpoint(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.4);
      });
    } catch {}
  },

  /** Death chime */
  playGameOver(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch {}
  },

  /** Victory temple bell */
  playVictory(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);

        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.6);
      });
    } catch {}
  },

  /** Shuriken throwing whip crack SFX (Whip_SFX_Pack_mp3_1710999340.mp3) */
  playShurikenThrow(volume: number = 0.88): void {
    playSfx('shurikenThrow', volume);
  },

  /** Hanzo Boss Cinematic Intro Soundtrack (Japanese_Intro_mp3.mp3) */
  playHanzoIntro(): void {
    if (isMutedState) return;
    try {
      const audio = getHanzoIntroAudio();
      if (!audio) return;
      audio.muted = isMutedState;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser autoplay policy suspended playback, trigger on next user input gesture
          const onGesture = () => {
            if (audio && !isMutedState) {
              audio.currentTime = 0;
              audio.play().catch(() => {});
            }
            window.removeEventListener('keydown', onGesture);
            window.removeEventListener('click', onGesture);
            window.removeEventListener('pointerdown', onGesture);
          };
          window.addEventListener('keydown', onGesture, { once: true });
          window.addEventListener('click', onGesture, { once: true });
          window.addEventListener('pointerdown', onGesture, { once: true });
        });
      }
    } catch {}
  },

  /** Stop Hanzo intro soundtrack if playing */
  stopHanzoIntro(): void {
    try {
      if (hanzoIntroAudio) {
        hanzoIntroAudio.pause();
        hanzoIntroAudio.currentTime = 0;
      }
    } catch {}
  },

  /** Hanzo Boss Battle Soundtrack (The Dragon Awakens.mp3) - Loops along the fight */
  playHanzoBattleMusic(): void {
    if (isMutedState) return;
    try {
      const audio = getHanzoBattleAudio();
      if (!audio) return;
      audio.muted = isMutedState;
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // If browser policy deferred playback, play on next user interaction
          const onGesture = () => {
            if (audio && !isMutedState) {
              audio.play().catch(() => {});
            }
            window.removeEventListener('keydown', onGesture);
            window.removeEventListener('click', onGesture);
            window.removeEventListener('pointerdown', onGesture);
          };
          window.addEventListener('keydown', onGesture, { once: true });
          window.addEventListener('click', onGesture, { once: true });
          window.addEventListener('pointerdown', onGesture, { once: true });
        });
      }
    } catch {}
  },

  /** Stop Hanzo Battle Soundtrack */
  stopHanzoBattleMusic(): void {
    try {
      if (hanzoBattleAudio) {
        hanzoBattleAudio.pause();
        hanzoBattleAudio.currentTime = 0;
      }
    } catch {}
  },

  /** Hanzo Telegraph: Rising Slash (subtle rising violet energy cue, ~180ms) */
  playHanzoTelegraphRising(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(190, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(460, ctx.currentTime + 0.18);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.065, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.19);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.19);
    } catch {}
  },

  /** Hanzo Telegraph: Spin Slash (subtle low circular resonant energy cue, ~170ms) */
  playHanzoTelegraphSpin(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(175, ctx.currentTime + 0.09);
      osc.frequency.linearRampToValueAtTime(105, ctx.currentTime + 0.17);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(260, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.07, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } catch {}
  },

  /** Hanzo Telegraph: Teleport Strike (subtle void shadow whisper cue, ~190ms) */
  playHanzoTelegraphTeleport(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.19);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.19);

      gain.gain.setValueAtTime(0.065, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  },

  /** Hanzo Signature Teleport (teleport Hanzo.mp3) */
  playHanzoTeleport(volume: number = 0.9): void {
    playSfx('hanzoTeleport', volume);
  },

  /** Ninja Combo Hit (Ascending pitch harmonic chime) */
  playComboHit(comboCount: number): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const pitch = Math.min(880, 320 + Math.min(comboCount, 25) * 22);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(pitch, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 1.25, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  },

  /** Finisher Ready Alert (Mystical Katana Shimmer) */
  playFinisherReady(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.18); // A5

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  },

  /** Finisher Strike (Cinematic Sub-bass Drop + Blade Rip) */
  playFinisherStrike(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      // Sub-bass impact drop
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.setValueAtTime(95, ctx.currentTime);
      bass.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.45);

      bassGain.gain.setValueAtTime(0.28, ctx.currentTime);
      bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      bass.connect(bassGain);
      bassGain.connect(ctx.destination);
      bass.start();
      bass.stop(ctx.currentTime + 0.45);

      // Razor steel whoosh
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  },

  /** Trophy Unlocked Fanfare (Major Triad Ascending Chime) */
  playTrophyUnlocked(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.08;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.15, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });
    } catch {}
  },

  /** Secret Legacy Unlocked (Mystical Pentatonic Fanfare) */
  playSecretUnlocked(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const notes = [587.33, 698.46, 783.99, 880.0, 1174.66]; // D5, F5, G5, A5, D6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.09;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.16, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch {}
  },

  /** Fade out Hanzo Battle Soundtrack smoothly over duration */
  fadeHanzoBattleMusic(durationMs: number = 1000): void {
    try {
      if (!hanzoBattleAudio) return;
      const audio = hanzoBattleAudio;
      const initialVol = audio.volume;
      const steps = 15;
      const stepTime = durationMs / steps;
      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const factor = Math.max(0, 1 - currentStep / steps);
        audio.volume = initialVol * factor;
        if (currentStep >= steps) {
          clearInterval(timer);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = initialVol;
        }
      }, stepTime);
    } catch {
      this.stopHanzoBattleMusic();
    }
  },

  /** Deep atmospheric ambient Hell drone for cinematic tension */
  playCinematicAmbientDrone(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      this.stopCinematicAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(46, ctx.currentTime); // Low abyssal sub-harmonic

      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      cinematicDroneOsc = osc;
      cinematicDroneGain = gain;
    } catch {}
  },

  /** Ethereal chime for purple memory flashback in Shot 6 */
  playMemoryFlashbackChime(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const frequencies = [880, 1108.73, 1318.51, 1760]; // A5, C#6, E6, A6 (mystical celestial chord)
      frequencies.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.14, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 1.2);
      });
    } catch {}
  },

  /** Supernatural resonant energy pulse for Hellbound Cycle tether in Shot 9 */
  playEtherealTetherPulse(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(165, ctx.currentTime + 0.8);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.4);
    } catch {}
  },

  /** Dramatic cinematic heartbeat pulse ("You cannot destroy what you are") */
  playTensionPulse(): void {
    if (isMutedState) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(65, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.24, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {}
  },

  /** Stop cinematic ambient audio and drones */
  stopCinematicAudio(): void {
    try {
      if (cinematicDroneGain && audioCtx) {
        cinematicDroneGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
      }
      setTimeout(() => {
        try {
          if (cinematicDroneOsc) {
            cinematicDroneOsc.stop();
            cinematicDroneOsc.disconnect();
            cinematicDroneOsc = null;
          }
          if (cinematicDroneGain) {
            cinematicDroneGain.disconnect();
            cinematicDroneGain = null;
          }
        } catch {}
      }, 350);
    } catch {}
  },
};
