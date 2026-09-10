import { useState } from 'react';
import { ArrowLeft, Move, Footprints, Swords, Zap, Shield, ShieldAlert, Coins, Flag, Award, X, Target } from 'lucide-react';
import { useRouter } from '@/router';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { soundEffects } from '@/game/soundEffects';

interface HowToPlayProps {
  isModal?: boolean;
}

export function HowToPlayPage({ isModal }: HowToPlayProps) {
  const { navigate, closeModal } = useRouter();
  const [tab, setTab] = useState<'controls' | 'bestiary' | 'objectives'>('controls');

  const handleBack = () => {
    soundEffects.playMenuHover();
    if (isModal) {
      closeModal();
    } else {
      navigate('home');
    }
  };

  const handleTabChange = (t: 'controls' | 'bestiary' | 'objectives') => {
    soundEffects.playMenuHover();
    setTab(t);
  };

  const content = (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col max-h-[90vh] sm:max-h-[85vh] rounded-lg overflow-hidden border border-red-accent/30 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-ink-2/95 backdrop-blur-xl anim-scale-in">
      {/* Scroll Header Ornament */}
      <div className="relative px-6 py-4 border-b border-ink flex items-center justify-between bg-gradient-to-r from-ink-0 via-ink-1 to-ink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded border border-red-accent/40 bg-red-950/40 text-red-accent font-jp text-sm font-bold">
            忍
          </div>
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold tracking-widest text-paper">
              SCROLL OF THE SHINOBI
            </h2>
            <div className="font-jp text-[10px] text-red-accent tracking-[0.25em]">忍の奥義書</div>
          </div>
        </div>

        {/* Close / ESC Button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-ink text-paper-dim hover:text-paper hover:border-red-accent transition-all text-xs font-mono tracking-wider bg-white/5"
        >
          <X size={14} />
          <span className="hidden sm:inline">CLOSE [ESC]</span>
        </button>
      </div>

      {/* Tab Navigation (Game Style) */}
      <div className="flex items-center border-b border-ink bg-ink-0/60 px-6 gap-2">
        <TabButton
          active={tab === 'controls'}
          onClick={() => handleTabChange('controls')}
          label="SHINOBI ARTS (CONTROLS)"
          jp="基本操作"
        />
        <TabButton
          active={tab === 'bestiary'}
          onClick={() => handleTabChange('bestiary')}
          label="TEMPLE BESTIARY"
          jp="出現敵"
        />
        <TabButton
          active={tab === 'objectives'}
          onClick={() => handleTabChange('objectives')}
          label="OBJECTIVES & RANKS"
          jp="任務目標"
        />
      </div>

      {/* Tab Content Area (Scrollable) */}
      <div className="p-6 overflow-y-auto space-y-6 scrollbar-thin">
        {tab === 'controls' && <ControlsTab />}
        {tab === 'bestiary' && <BestiaryTab />}
        {tab === 'objectives' && <ObjectivesTab />}
      </div>

      {/* Footer Return Bar */}
      <div className="px-6 py-3 border-t border-ink bg-ink-0/80 flex items-center justify-between text-xs font-mono text-paper-dim">
        <div className="flex items-center gap-2">
          <span className="text-red-accent">❖</span>
          <span>MASTER THE ART OF SILENT STRIKES</span>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-paper hover:text-red-accent transition-colors font-bold"
        >
          <ArrowLeft size={14} />
          <span>RETURN</span>
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
      <AtmosphericBackground parallax={0.15} variant="menu" moonTop="10vh" />
      <div className="relative z-10 w-full flex items-center justify-center py-8">{content}</div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  jp,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  jp: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative py-3 px-4 transition-all duration-150 flex flex-col items-center leading-none ${
        active ? 'text-paper font-bold' : 'text-paper-dim/60 hover:text-paper-dim'
      }`}
    >
      <span className="font-display text-xs sm:text-sm tracking-wider">{label}</span>
      <span className={`font-jp text-[9px] mt-1 ${active ? 'text-red-accent' : 'opacity-40'}`}>
        {jp}
      </span>
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-accent shadow-[0_0_8px_var(--red-bright)]" />
      )}
    </button>
  );
}

function ControlsTab() {
  const controls = [
    {
      icon: <Move size={24} className="text-jade" />,
      primaryKey: 'A / D',
      altKey: '← / →',
      title: 'Movement (Left / Right)',
      jp: '左右移動',
      desc: 'Press A to run left and D to run right across the temple grounds. Build momentum for long jump arcs.',
    },
    {
      icon: <Footprints size={24} className="text-paper" />,
      primaryKey: 'W / SPACE',
      altKey: '↑',
      title: 'Shinobi Leap & Double Jump',
      jp: '二段跳躍',
      desc: 'Press W or Space to leap upwards. Press Space again while airborne to perform an acrobatic 360° Double Jump flip!',
    },
    {
      icon: <Swords size={24} className="text-red-accent" />,
      primaryKey: 'MOUSE LEFT',
      altKey: 'J',
      title: 'Katana Slash (3-Hit Combo)',
      jp: '刀撃',
      desc: 'Left-click mouse or press J to perform a swift sword strike combo (1 -> 2 -> 3). Cleaves enemy samurai and spirits within close range.',
    },
    {
      icon: <Zap size={24} className="text-red-accent" />,
      primaryKey: 'SHIFT + J',
      altKey: 'DASH + ATTACK',
      title: 'Shadow Dash Strike',
      jp: '影閃撃',
      desc: 'Press Shift + Attack to surge forward as a blurred shadow, slashing through enemies with ghost afterimages.',
    },
    {
      icon: <Swords size={24} className="text-red-accent" />,
      primaryKey: 'W + J',
      altKey: 'UP + ATTACK',
      title: 'Crimson Slash Combo',
      jp: '紅蓮連撃',
      desc: 'Press W + Attack (or Up + Attack) to unleash a rapid multi-hit sword barrage advancing into enemy ranks.',
    },
    {
      icon: <Target size={24} className="text-red-accent" />,
      primaryKey: 'C',
      altKey: 'KEY C',
      title: 'Crimson Blade Wave',
      jp: '紅刃波',
      desc: 'Press C to release a piercing crimson crescent projectile wave that travels across the screen.',
    },
    {
      icon: <Swords size={24} className="text-red-accent" />,
      primaryKey: 'HOLD J',
      altKey: 'CHARGE ATTACK',
      title: 'Blood Spin Slash',
      jp: '血風円斬',
      desc: 'Hold Attack (J or Left-Click) to charge and release a devastating 360° circular whirlwind slash, decimating surrounding enemies from all angles.',
    },
    {
      icon: <Zap size={24} className="text-gold" />,
      primaryKey: 'SHIFT',
      altKey: 'K',
      title: 'Shadow Dash (Evade)',
      jp: '瞬歩',
      desc: 'Press Shift or K to dash forward with crimson smoke trails and shadow clones. Consumes 50 stamina (2 dashes on full gauge; fully recharges in 5s). Grants complete invulnerability.',
    },
    {
      icon: <Target size={24} className="text-red-accent" />,
      primaryKey: 'MOUSE RIGHT',
      altKey: 'X',
      title: 'Shuriken Throw (Ranged)',
      jp: '手裏剣投擲',
      desc: 'Right-click mouse or press X to throw a spinning shuriken. Flies horizontally across the level to strike and pierce distant enemies.',
    },
    {
      icon: <Shield size={24} className="text-paper" />,
      primaryKey: 'HOLD CTRL',
      altKey: '',
      title: 'Blade Guard / Parry (Defend & Counter)',
      jp: '刀構え / 防御 / 反撃',
      desc: 'Hold CTRL to defend with stationary blade (works on ground and in mid-air). Deflects enemy strikes for 0 damage, triggering a dynamic parry deflection swing! Press Attack (J/Left-Click) while guarding to unleash an immediate counter-attack, or Jump/Dash to cancel guard.',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {controls.map((c) => (
        <div
          key={c.title}
          className="p-4 rounded border border-ink bg-white/[0.02] hover:border-red-accent/40 transition-colors relative flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-black/40 border border-white/10">{c.icon}</div>
                <div>
                  <h4 className="font-display text-sm font-bold text-paper tracking-wide">{c.title}</h4>
                  <span className="font-jp text-[10px] text-red-accent">{c.jp}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="px-2 py-1 rounded bg-red-950/60 border border-red-accent/40 text-red-accent font-mono text-xs font-bold">
                  {c.primaryKey}
                </span>
                {c.altKey && (
                  <span className="px-1.5 py-1 rounded bg-black/40 border border-white/10 text-paper-dim font-mono text-[10px]">
                    {c.altKey}
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-paper-dim leading-relaxed">{c.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BestiaryTab() {
  const beasts = [
    {
      name: 'Corrupted Samurai',
      jp: '呪われた侍',
      hp: '3 HP',
      threat: 'HIGH (GROUND)',
      desc: 'Heavily armored guards that patrol platforms. When alerted, they charge and deliver punishing katana strikes. Time your slash or dash behind them.',
    },
    {
      name: 'Shadow Spirit',
      jp: '幽霊',
      hp: '2 HP',
      threat: 'MEDIUM (AERIAL)',
      desc: 'Floating ethereal specters that hunt players from above. They bob through obstacles and swoop down aggressively. Strike them out of the air.',
    },
    {
      name: 'Temple Spike Traps',
      jp: '血の棘',
      hp: 'FATAL (2 DMG)',
      threat: 'HAZARD',
      desc: 'Ancient floor spikes lining the gaps between temple grounds. Step over them using careful jumping or dash across.',
    },
  ];

  return (
    <div className="space-y-3">
      {beasts.map((b) => (
        <div key={b.name} className="p-4 rounded border border-ink bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h4 className="font-display text-sm font-bold text-paper tracking-wider">{b.name}</h4>
              <span className="font-jp text-[10px] text-red-accent">{b.jp}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/60 border border-red-accent/40 text-red-accent">
                {b.hp}
              </span>
            </div>
            <p className="text-xs text-paper-dim leading-relaxed">{b.desc}</p>
          </div>
          <div className="shrink-0 text-right">
            <span className="text-[10px] font-mono text-gold px-2 py-1 rounded bg-black/40 border border-gold/30">
              {b.threat}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ObjectivesTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded border border-ink bg-white/[0.02] flex flex-col items-center text-center">
          <Flag size={24} className="text-gold mb-2" />
          <h5 className="font-display text-xs font-bold text-paper tracking-wider mb-1">REACH THE TORII GATE</h5>
          <p className="text-[11px] text-paper-dim">Pass through the golden exit gate at the end of the courtyard to escape with your life.</p>
        </div>
        <div className="p-4 rounded border border-ink bg-white/[0.02] flex flex-col items-center text-center">
          <Coins size={24} className="text-gold mb-2" />
          <h5 className="font-display text-xs font-bold text-paper tracking-wider mb-1">COLLECT TEMPLE COINS</h5>
          <p className="text-[11px] text-paper-dim">Gather glowing coins scattered across high platforms to earn bonuses and achieve S-Rank.</p>
        </div>
        <div className="p-4 rounded border border-ink bg-white/[0.02] flex flex-col items-center text-center">
          <Award size={24} className="text-jade mb-2" />
          <h5 className="font-display text-xs font-bold text-paper tracking-wider mb-1">ACTIVATE CHECKPOINT</h5>
          <p className="text-[11px] text-paper-dim">Touch the mystical jade lantern midway through the temple to save your respawn point.</p>
        </div>
      </div>

      {/* Rank criteria */}
      <div className="p-4 rounded border border-ink bg-black/30">
        <h5 className="font-display text-xs font-bold text-paper tracking-widest mb-2 text-center">
          SHINOBI RANK EVALUATION
        </h5>
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className="p-2 rounded bg-gold/10 border border-gold/40 text-gold font-bold">
            S-RANK<br /><span className="text-[10px] font-normal text-paper-dim">&gt; 3500 PTS</span>
          </div>
          <div className="p-2 rounded bg-paper/10 border border-paper/40 text-paper font-bold">
            A-RANK<br /><span className="text-[10px] font-normal text-paper-dim">&gt; 2800 PTS</span>
          </div>
          <div className="p-2 rounded bg-jade/10 border border-jade/40 text-jade font-bold">
            B-RANK<br /><span className="text-[10px] font-normal text-paper-dim">&gt; 2000 PTS</span>
          </div>
          <div className="p-2 rounded bg-white/5 border border-white/20 text-paper-dim font-bold">
            C-RANK<br /><span className="text-[10px] font-normal text-paper-dim">SURVIVED</span>
          </div>
        </div>
      </div>
    </div>
  );
}
