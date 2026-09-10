import { RotateCcw, Home, Skull } from 'lucide-react';
import { useRouter } from '@/router';
import { PrimaryButton, SecondaryButton, EmblemMark } from '@/components/Navbar';
import { soundEffects } from '@/game/soundEffects';
import { titleMusic } from '@/game/titleMusic';

export function GameOverPage() {
  const { navigate } = useRouter();

  return (
    <div className="relative w-full min-h-screen overflow-hidden flex flex-col items-center justify-between select-none bg-black pb-8 sm:pb-12">
      {/* Animated Game Over GIF Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src="/assets/gameover/game_over.gif"
          alt="Game Over Background"
          className="w-full h-full object-cover object-center"
        />
        {/* Atmospheric Vignette & Contrast Veil for high text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 50% 45%, rgba(10,0,0,0.2) 0%, rgba(5,7,13,0.68) 70%, rgba(2,3,6,0.92) 100%), linear-gradient(180deg, rgba(8,2,2,0.6) 0%, transparent 40%, rgba(8,2,2,0.8) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12 w-full max-w-lg text-center my-auto">
        {/* Skull emblem */}
        <div className="mb-6 anim-scale-in">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 anim-pulse-ring rounded-full border border-red-accent/40" />
            <div
              className="flex items-center justify-center w-20 h-20 rounded-full backdrop-blur-md shadow-[0_0_30px_rgba(224,37,46,0.35)]"
              style={{ background: 'rgba(224,37,46,0.12)', border: '2px solid rgba(224,37,46,0.6)' }}
            >
              <Skull size={36} className="text-red-accent filter drop-shadow-[0_0_12px_rgba(255,43,54,0.8)]" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center text-center anim-fade-up">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-10 bg-gradient-to-r from-transparent via-red-accent to-red-accent opacity-60" />
            <span className="font-jp text-xs text-red-accent tracking-[0.3em] font-bold">死</span>
            <span className="h-px w-10 bg-gradient-to-l from-transparent via-red-accent to-red-accent opacity-60" />
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-wider text-paper leading-tight drop-shadow-[0_0_25px_rgba(244,233,199,0.2)]">
            THE SHADOW
            <br />
            <span
              className="text-red-accent"
              style={{
                textShadow: '0 0 25px rgba(255,59,70,0.7), 0 0 50px rgba(224,37,46,0.4)',
              }}
            >
              FALLS
            </span>
          </h1>
          <p className="mt-5 text-paper-dim text-sm sm:text-base max-w-md font-serif italic tracking-wide leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            You have to get up; the curse is still going on.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 anim-fade-up" style={{ animationDelay: '0.2s' }}>
          <div className="anim-btn-glow rounded">
            <PrimaryButton
              onClick={() => {
                soundEffects.playMenuSelect();
                titleMusic.play(false, 0.22);
                navigate('game');
              }}
              icon={<RotateCcw size={16} />}
            >
              TRY AGAIN
            </PrimaryButton>
          </div>
          <SecondaryButton
            onClick={() => {
              soundEffects.playMenuHover();
              titleMusic.setVolume(0.55);
              titleMusic.play(false);
              try {
                sessionStorage.removeItem('shadow_opening_seen');
                sessionStorage.removeItem('shadow_boss_checkpoint');
              } catch (_) {}
              navigate('home');
            }}
            icon={<Home size={16} />}
          >
            TITLE MENU
          </SecondaryButton>
        </div>

        {/* Footer emblem */}
        <div className="mt-12 opacity-30">
          <EmblemMark size={24} />
        </div>
      </div>
    </div>
  );
}
