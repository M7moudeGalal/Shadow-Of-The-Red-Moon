import { RotateCcw, Home, Coins, Clock, Award, CheckCircle } from 'lucide-react';
import { useRouter } from '@/router';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { NinjaCharacter } from '@/components/NinjaCharacter';
import { PrimaryButton, SecondaryButton, EmblemMark } from '@/components/Navbar';
import { soundEffects } from '@/game/soundEffects';
import { titleMusic } from '@/game/titleMusic';

export function VictoryPage() {
  const { navigate, lastResult } = useRouter();

  const time = lastResult ? formatTime(lastResult.time) : '0:00.00';
  const score = lastResult?.score ?? 0;
  const coins = lastResult?.coins ?? 0;
  const rank = lastResult?.rank ?? 'C';

  const rankColor = rank === 'S' ? 'var(--red-bright)' : rank === 'A' ? 'var(--gold)' : rank === 'B' ? 'var(--jade)' : 'var(--paper-dim)';
  const rankGlow = rank === 'S' ? '0 0 40px rgba(255,59,70,0.5)' : rank === 'A' ? '0 0 30px rgba(233,196,106,0.5)' : '0 0 20px rgba(95,179,154,0.4)';

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AtmosphericBackground parallax={0.25} variant="menu" moonTop="8vh" />

      {/* Golden victory tint */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(233,196,106,0.06) 0%, transparent 60%)' }}
      />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 pt-20 pb-12">
        {/* Check emblem */}
        <div className="mb-5 anim-scale-in">
          <div className="relative">
            <div className="absolute inset-0 anim-pulse-ring rounded-full border opacity-40" style={{ borderColor: 'var(--gold)' }} />
            <div
              className="flex items-center justify-center w-20 h-20 rounded-full"
              style={{ background: 'rgba(233,196,106,0.1)', border: '2px solid var(--gold)' }}
            >
              <CheckCircle size={36} className="text-gold" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col items-center text-center anim-fade-up">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8 bg-gold opacity-60" />
            <span className="font-jp text-xs text-gold tracking-[0.3em]">任務完了</span>
            <span className="h-px w-8 bg-gold opacity-60" />
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-black tracking-wider text-paper leading-tight">
            MISSION
            <br />
            <span className="text-gold" style={{ textShadow: '0 0 30px rgba(233,196,106,0.4)' }}>COMPLETE</span>
          </h1>
          <p className="mt-4 text-paper-dim text-sm max-w-sm">
            The gate is crossed. The curse breaks at dawn. The shadow walks free.
          </p>
        </div>

        {/* Rank reveal */}
        <div className="my-8 anim-rank flex flex-col items-center">
          <span className="font-display text-xs tracking-widest text-paper-dim mb-2">RANK</span>
          <div
            className="relative flex items-center justify-center"
            style={{ width: '100px', height: '100px' }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ border: `3px solid ${rankColor}`, boxShadow: rankGlow }}
            />
            <span
              className="font-display text-5xl font-black"
              style={{ color: rankColor, textShadow: rankGlow }}
            >
              {rank}
            </span>
          </div>
        </div>

        {/* Ninja by the moon */}
        <div className="relative mb-8 anim-victory-rise flex items-end justify-center" style={{ height: '80px' }}>
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-24 h-3 rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)' }} />
          <div className="scale-[1.4]">
            <NinjaCharacter anim="idle" facing={1} />
          </div>
        </div>

        {/* Stats */}
        <div className="w-full max-w-sm anim-fade-up" style={{ animationDelay: '0.3s' }}>
          <div
            className="p-6 rounded-lg space-y-4"
            style={{
              background: 'rgba(17,23,38,0.6)',
              border: '1px solid rgba(233,196,106,0.2)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <StatRow icon={<Award size={18} />} label="SCORE" value={score.toString()} color="text-paper" />
            <Divider />
            <StatRow icon={<Coins size={18} />} label="COINS" value={`${coins}`} color="text-gold" />
            <Divider />
            <StatRow icon={<Clock size={18} />} label="TIME" value={time} color="text-moon" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 anim-fade-up" style={{ animationDelay: '0.5s' }}>
          <div className="anim-btn-glow rounded">
            <PrimaryButton
              onClick={() => {
                soundEffects.playMenuSelect();
                titleMusic.play(false, 0.22);
                navigate('game');
              }}
              icon={<RotateCcw size={16} />}
            >
              PLAY AGAIN
            </PrimaryButton>
          </div>
          <SecondaryButton
            onClick={() => {
              soundEffects.playMenuHover();
              titleMusic.setVolume(0.55);
              titleMusic.play(false);
              navigate('home');
            }}
            icon={<Home size={16} />}
          >
            TITLE MENU
          </SecondaryButton>
        </div>

        {/* Footer emblem */}
        <div className="mt-10 opacity-30">
          <EmblemMark size={24} />
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className={color}>{icon}</span>
        <span className="font-display text-xs tracking-widest text-paper-dim">{label}</span>
      </div>
      <span className={`font-mono text-lg ${color} tabular-nums`}>{value}</span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-gold opacity-15" />;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}
