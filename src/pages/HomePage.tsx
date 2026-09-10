import { useState, useEffect, Fragment } from 'react';
import { Play, BookOpen, Scroll, Maximize, Minimize, Volume2, VolumeX } from 'lucide-react';
import { useRouter } from '@/router';
import { soundEffects } from '@/game/soundEffects';
import { titleMusic } from '@/game/titleMusic';
import { resetStoryFlags } from '@/game/storyFlags';

interface MenuItem {
  id: string;
  label: string;
  jp: string;
  icon?: React.ReactNode;
  action: () => void;
}

export function HomePage() {
  const { navigate, openModal, isMuted, toggleMute, isFullscreen, toggleFullscreen } = useRouter();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Play Title Menu Soundtrack and Fire Blaze SFX at full menu volume
  useEffect(() => {
    titleMusic.setVolume(0.55);
    titleMusic.play(isMuted);
    soundEffects.playTitleFireBlaze(isMuted);
    return () => {
      titleMusic.stop();
      soundEffects.stopTitleFireBlaze();
    };
  }, []);

  // Sync mute state with title music and fire blaze
  useEffect(() => {
    titleMusic.setMuted(isMuted);
    soundEffects.setMuted(isMuted);
  }, [isMuted]);

  const menuItems: MenuItem[] = [
    {
      id: 'start',
      label: 'START GAME',
      jp: 'ゲーム開始',
      icon: <Play size={16} />,
      action: () => {
        soundEffects.playMenuSelect();
        soundEffects.stopTitleFireBlaze();
        titleMusic.setVolume(0.22);
        try {
          sessionStorage.removeItem('shadow_opening_seen');
          sessionStorage.removeItem('shadow_boss_checkpoint');
          resetStoryFlags();
        } catch (_) {}
        navigate('game');
      },
    },
    {
      id: 'howto',
      label: 'HOW TO PLAY',
      jp: '操作技術',
      icon: <BookOpen size={16} />,
      action: () => openModal('howto'),
    },
    {
      id: 'about',
      label: 'TEMPLE LORE',
      jp: '寺院の歴史',
      icon: <Scroll size={16} />,
      action: () => openModal('about'),
    },
    {
      id: 'fullscreen',
      label: isFullscreen ? 'WINDOWED' : 'FULLSCREEN',
      jp: isFullscreen ? 'ウィンドウ' : '全画面',
      icon: isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />,
      action: () => {
        soundEffects.playMenuSelect();
        toggleFullscreen();
      },
    },
    {
      id: 'audio',
      label: isMuted ? 'AUDIO: MUTED' : 'AUDIO: ON',
      jp: isMuted ? '消音' : '音量',
      icon: isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />,
      action: () => {
        const nextMuted = toggleMute();
        titleMusic.setMuted(nextMuted);
        soundEffects.setMuted(nextMuted);
        soundEffects.playMenuSelect();
      },
    },
  ];

  // Keyboard navigation for menu (Up / Down / Enter / F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev - 1 + menuItems.length) % menuItems.length;
          soundEffects.playMenuHover();
          return next;
        });
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = (prev + 1) % menuItems.length;
          soundEffects.playMenuHover();
          return next;
        });
      } else if (k === 'enter' || k === ' ') {
        e.preventDefault();
        menuItems[selectedIndex]?.action();
      } else if (k === 'f') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, menuItems, toggleFullscreen]);

  return (
    <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-between select-none bg-black pb-8 sm:pb-12">
      {/* Animated Burning Feudal Village Background GIF */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src="/assets/title/title_menu.gif"
          alt="Shadow of the Red Moon Burning Village Title Background"
          className="w-full h-full object-cover object-center"
        />
        {/* Atmospheric Vignette & Contrast Veil */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.15) 0%, rgba(5,7,13,0.65) 75%, rgba(2,3,6,0.92) 100%), linear-gradient(180deg, rgba(8,2,2,0.55) 0%, transparent 30%, rgba(8,2,2,0.7) 100%)',
          }}
        />
      </div>

      {/* Watermark kanji */}
      <div className="absolute top-12 left-10 font-jp text-7xl sm:text-9xl text-paper opacity-[0.03] select-none pointer-events-none z-0">
        影
      </div>
      <div className="absolute bottom-16 right-10 font-jp text-7xl sm:text-9xl text-paper opacity-[0.03] select-none pointer-events-none z-0">
        月
      </div>

      {/* TOP: Ornate Game Logo & Title (Hollow Knight / Silksong Aesthetic) */}
      <div className="relative z-10 pt-10 sm:pt-14 flex flex-col items-center text-center anim-fade-down">
        {/* Top filigree crest */}
        <div className="flex items-center gap-3 mb-2 opacity-80">
          <FiligreeLeft />
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full border border-red-accent/50 bg-red-950/40">
            <span className="font-jp text-xs text-red-accent font-bold">影</span>
          </div>
          <FiligreeRight />
        </div>

        {/* Main Game Title with ambient glow */}
        <h1 className="font-display tracking-[0.14em] text-paper uppercase leading-none text-center">
          <span className="block text-4xl sm:text-6xl md:text-7xl font-black drop-shadow-[0_0_35px_rgba(244,233,199,0.25)]">
            SHADOW
          </span>
          <span
            className="block text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.24em] mt-2 text-red-accent"
            style={{
              textShadow: '0 0 25px rgba(255,59,70,0.6), 0 0 50px rgba(224,37,46,0.3)',
            }}
          >
            OF THE RED MOON
          </span>
        </h1>

        {/* Bottom decorative divider with kanji subtitle */}
        <div className="flex items-center gap-3 mt-3">
          <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-r from-transparent via-red-accent to-red-accent opacity-60" />
          <span className="font-jp text-[11px] sm:text-xs text-red-accent tracking-[0.35em] font-medium">
            影の赤月
          </span>
          <span className="h-[1px] w-12 sm:w-20 bg-gradient-to-l from-transparent via-red-accent to-red-accent opacity-60" />
        </div>
      </div>

      {/* MIDDLE: Interactive Game Menu */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto w-full max-w-lg px-6">
        {/* Console-Style Vertical Menu List with Shuriken Dividers */}
        <div className="w-full flex flex-col items-center gap-1.5 anim-fade-up" style={{ animationDelay: '0.15s' }}>
          {menuItems.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <Fragment key={item.id}>
                {/* Decorative Shuriken Divider between menu items */}
                {idx > 0 && (
                  <div className="flex items-center justify-center gap-3 w-48 opacity-75 my-0.5 pointer-events-none">
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                    <img
                      src="/assets/effects/shuriken/shuriken_01.png"
                      alt="✦"
                      className="w-4 h-4 object-contain filter drop-shadow-[0_0_8px_rgba(255,43,54,0.7)]"
                    />
                    <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent" />
                  </div>
                )}

                <button
                  onClick={item.action}
                  onMouseEnter={() => {
                    if (selectedIndex !== idx) {
                      setSelectedIndex(idx);
                      soundEffects.playMenuHover();
                    }
                  }}
                  className={`group relative flex items-center justify-center w-full max-w-xs py-2 px-4 transition-all duration-200 ${
                    isSelected
                      ? 'text-paper scale-105'
                      : 'text-paper-dim/70 hover:text-paper hover:scale-102'
                  }`}
                >
                  {/* Active Menu Highlight Background & Ornaments */}
                  {isSelected && (
                    <div
                      className="absolute inset-0 -z-10 rounded border transition-all duration-200"
                      style={{
                        background: 'radial-gradient(ellipse at center, rgba(224,37,46,0.22) 0%, rgba(17,23,38,0.5) 70%, transparent 100%)',
                        borderColor: 'rgba(224,37,46,0.45)',
                        boxShadow: '0 0 24px rgba(224,37,46,0.3)',
                      }}
                    />
                  )}

                  {/* Left Shuriken Pointer */}
                  <img
                    src="/assets/effects/shuriken/shuriken_01.png"
                    alt=""
                    className={`w-5 h-5 object-contain mr-3 transition-all duration-200 filter drop-shadow-[0_0_8px_rgba(255,43,54,0.85)] ${
                      isSelected ? 'opacity-100 translate-x-0 rotate-45' : 'opacity-0 translate-x-2 rotate-0'
                    }`}
                  />

                  {/* Menu Text */}
                  <div className="flex flex-col items-center leading-tight">
                    <span
                      className={`font-display text-sm sm:text-base tracking-[0.2em] font-bold transition-colors ${
                        isSelected
                          ? 'text-paper drop-shadow-[0_0_10px_rgba(239,230,210,0.6)]'
                          : 'text-paper-dim/80'
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      className={`font-jp text-[9px] tracking-[0.25em] transition-colors mt-0.5 ${
                        isSelected ? 'text-red-accent' : 'text-paper-dim/40'
                      }`}
                    >
                      {item.jp}
                    </span>
                  </div>

                  {/* Right Shuriken Pointer */}
                  <img
                    src="/assets/effects/shuriken/shuriken_01.png"
                    alt=""
                    className={`w-5 h-5 object-contain ml-3 transition-all duration-200 filter drop-shadow-[0_0_8px_rgba(255,43,54,0.85)] ${
                      isSelected ? 'opacity-100 translate-x-0 -rotate-45' : 'opacity-0 -translate-x-2 rotate-0'
                    }`}
                  />
                </button>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* Ornate decorative SVG flourishes */

function FiligreeLeft() {
  return (
    <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="text-red-accent opacity-70">
      <path d="M40,6 L15,6 C8,6 2,4 0,0 C4,8 10,12 18,12 C28,12 36,8 40,6 Z" fill="currentColor" />
    </svg>
  );
}

function FiligreeRight() {
  return (
    <svg width="40" height="12" viewBox="0 0 40 12" fill="none" className="text-red-accent opacity-70">
      <path d="M0,6 L25,6 C32,6 38,4 40,0 C36,8 30,12 22,12 C12,12 4,8 0,6 Z" fill="currentColor" />
    </svg>
  );
}
