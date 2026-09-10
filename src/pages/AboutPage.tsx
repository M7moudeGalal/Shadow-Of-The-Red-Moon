import { ArrowLeft, Play, X, Swords, Sparkles, BookOpen } from 'lucide-react';
import { useRouter } from '@/router';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { NinjaCharacter } from '@/components/NinjaCharacter';
import { soundEffects } from '@/game/soundEffects';

interface AboutProps {
  isModal?: boolean;
}

export function AboutPage({ isModal }: AboutProps) {
  const { navigate, closeModal } = useRouter();

  const handleBack = () => {
    soundEffects.playMenuHover();
    if (isModal) {
      closeModal();
    } else {
      navigate('home');
    }
  };

  const handleStart = () => {
    soundEffects.playMenuSelect();
    closeModal();
    navigate('game');
  };

  const content = (
    <div className="relative w-full max-w-3xl mx-auto flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-lg overflow-hidden border border-red-accent/30 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-ink-2/95 backdrop-blur-xl anim-scale-in">
      {/* Header */}
      <div className="relative px-6 py-4 border-b border-ink flex items-center justify-between bg-gradient-to-r from-ink-0 via-ink-1 to-ink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded border border-red-accent/40 bg-red-950/40 text-red-accent font-jp text-sm font-bold">
            歴
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-widest text-paper">
              TEMPLE CHRONICLES
            </h2>
            <div className="font-jp text-[10px] text-red-accent tracking-[0.25em]">寺院の記録</div>
          </div>
        </div>

        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink text-paper-dim hover:text-paper hover:border-red-accent transition-all text-xs font-mono tracking-wider bg-white/5"
        >
          <X size={14} />
          <span className="hidden sm:inline">CLOSE [ESC]</span>
        </button>
      </div>

      {/* Scroll Content */}
      <div className="p-6 sm:p-8 overflow-y-auto space-y-6 scrollbar-thin">
        {/* Ancient Poem / Proclamation */}
        <div className="text-center py-2 border-y border-red-accent/20">
          <p className="font-jp-light text-base sm:text-lg text-paper italic">
            「夜と共に歩み、気配なく断つ。」
          </p>
          <p className="font-display text-xs text-paper-dim tracking-[0.2em] mt-1">
            "MOVE WITH THE NIGHT. STRIKE WITHOUT WARNING."
          </p>
        </div>

        {/* Narrative Lore */}
        <div className="space-y-4 text-xs sm:text-sm text-paper-dim leading-relaxed">
          <p>
            Beneath the ominous glow of the bleeding moon, a lone master of the shadow arts enters
            the gates of the <span className="text-red-accent font-semibold">Cursed Temple</span>. Long abandoned by mortal monks, the sacred grounds are now held captive by ancient samurai specters and wandering spirits.
          </p>
          <p>
            Before dawn arrives and the curse consumes all who linger, you must navigate through the
            perilous bamboo courtyards, leap across bottomless spike chasms, and reach the sacred Torii Exit Gate.
          </p>
        </div>

        {/* Character & Katana Showcase */}
        <div className="p-4 rounded border border-ink bg-black/40 flex flex-col sm:flex-row items-center gap-6">
          <div className="scale-125 shrink-0 py-2">
            <NinjaCharacter anim="idle" facing={1} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Swords size={16} className="text-red-accent" />
              <h4 className="font-display text-sm font-bold text-paper tracking-wider">
                THE CRIMSON SHINOBI
              </h4>
            </div>
            <p className="text-xs text-paper-dim leading-relaxed">
              Armed with the forged Crescent Katana and cloaked in a protective wind scarf. Capable of shadow dashing through enemy ranks and chaining aerial strikes with lethal swiftness.
            </p>
          </div>
        </div>
      </div>

      {/* Footer Return & Play CTA */}
      <div className="px-6 py-4 border-t border-ink bg-ink-0/80 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-xs font-mono text-paper-dim hover:text-paper transition-colors font-bold"
        >
          <ArrowLeft size={14} />
          <span>RETURN [ESC]</span>
        </button>

        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-5 py-2 rounded bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-paper font-display text-xs font-bold tracking-widest shadow-[0_0_20px_rgba(224,37,46,0.5)] transition-all"
        >
          <Play size={14} />
          <span>ENTER TEMPLE</span>
        </button>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md anim-fade-in">
        {content}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-ink-0">
      <AtmosphericBackground parallax={0.2} variant="menu" moonTop="12vh" />
      <div className="relative z-10 w-full flex items-center justify-center py-8">{content}</div>
    </div>
  );
}
