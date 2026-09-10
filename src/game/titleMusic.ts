// Title menu background soundtrack manager for Shadow of the Red Moon

let audioInstance: HTMLAudioElement | null = null;
let hasUserInteracted = false;
let currentVolume = 0.55;
let fadeTimer: number | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioInstance) {
    audioInstance = new Audio();
    // Use the copied mp3/mpeg source for reliable streaming & looping
    audioInstance.src = '/audio/title_menu_track.mp3';
    audioInstance.loop = true;
    audioInstance.volume = currentVolume;
    audioInstance.preload = 'auto';

    // Guarantee infinite looping: if ended event ever fires, restart immediately
    audioInstance.addEventListener('ended', () => {
      if (audioInstance) {
        audioInstance.currentTime = 0;
        audioInstance.play().catch(() => {});
      }
    });
  }
  return audioInstance;
}

export const titleMusic = {
  setVolume(volume: number) {
    currentVolume = Math.max(0, Math.min(1, volume));
    if (audioInstance) {
      audioInstance.volume = currentVolume;
    }
  },

  getVolume(): number {
    return currentVolume;
  },

  fadeTo(targetVolume: number, durationMs: number = 300) {
    if (typeof window === 'undefined') return;
    const audio = getAudio();
    if (fadeTimer !== null) {
      window.clearInterval(fadeTimer);
      fadeTimer = null;
    }
    const startVol = audio.volume;
    const endVol = Math.max(0, Math.min(1, targetVolume));
    const startTime = performance.now();

    fadeTimer = window.setInterval(() => {
      const now = performance.now();
      const progress = Math.min(1, (now - startTime) / durationMs);
      const newVol = startVol + (endVol - startVol) * progress;
      audio.volume = newVol;
      currentVolume = newVol;
      if (progress >= 1) {
        if (fadeTimer !== null) {
          window.clearInterval(fadeTimer);
          fadeTimer = null;
        }
      }
    }, 25);
  },

  play(isMuted: boolean = false, volume?: number) {
    if (typeof window === 'undefined') return;
    if (volume !== undefined) {
      this.setVolume(volume);
    }
    const audio = getAudio();
    audio.muted = isMuted;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented immediate playback; start on first user interaction
        if (!hasUserInteracted) {
          const onInteraction = () => {
            hasUserInteracted = true;
            if (audioInstance) {
              audioInstance.play().catch(() => {});
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
        }
      });
    }
  },

  setMuted(muted: boolean) {
    if (audioInstance) {
      audioInstance.muted = muted;
      if (!muted && audioInstance.paused) {
        audioInstance.play().catch(() => {});
      }
    }
  },

  pause() {
    if (audioInstance && !audioInstance.paused) {
      audioInstance.pause();
    }
  },

  stop() {
    if (audioInstance) {
      audioInstance.pause();
      audioInstance.currentTime = 0;
    }
  },

  isPlaying(): boolean {
    return !!audioInstance && !audioInstance.paused;
  },
};
