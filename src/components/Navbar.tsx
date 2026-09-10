import { useState } from 'react';
import { Menu, X, Play } from 'lucide-react';
import { useRouter, type Page } from '@/router';

const LINKS: { label: string; page: Page }[] = [
  { label: 'PLAY', page: 'game' },
  { label: 'HOW TO PLAY', page: 'howto' },
  { label: 'ABOUT', page: 'about' },
];

export function Navbar() {
  const { navigate, page } = useRouter();
  const [open, setOpen] = useState(false);

  const go = (p: Page) => {
    setOpen(false);
    navigate(p);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className="border-b"
        style={{
          borderColor: 'rgba(239,230,210,0.08)',
          background: 'linear-gradient(180deg, rgba(5,7,13,0.92) 0%, rgba(10,14,23,0.78) 100%)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <nav className="mx-auto max-w-7xl px-5 sm:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button onClick={() => go('home')} className="flex items-center gap-2.5 group">
            <EmblemMark />
            <div className="flex flex-col items-start leading-none">
              <span className="font-display text-[15px] font-bold tracking-widest text-paper">
                SHADOW
              </span>
              <span className="font-jp text-[10px] text-red-accent tracking-[0.2em] mt-0.5">
                影の月
              </span>
            </div>
          </button>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {LINKS.map((l) => (
              <button
                key={l.page}
                onClick={() => go(l.page)}
                className={`relative px-4 py-2 text-[13px] font-medium tracking-widest transition-colors ${
                  page === l.page ? 'text-moon' : 'text-paper-dim hover:text-paper'
                }`}
              >
                {l.label}
                {page === l.page && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-px bg-red-accent" />
                )}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:block">
            <PrimaryButton onClick={() => go('game')} icon={<Play size={14} />}>
              PLAY NOW
            </PrimaryButton>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="md:hidden p-2 text-paper"
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-b anim-fade-in"
          style={{
            borderColor: 'rgba(239,230,210,0.08)',
            background: 'rgba(5,7,13,0.96)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="px-5 py-4 flex flex-col gap-1">
            {LINKS.map((l) => (
              <button
                key={l.page}
                onClick={() => go(l.page)}
                className={`text-left px-3 py-3 text-sm font-medium tracking-widest transition-colors ${
                  page === l.page ? 'text-moon' : 'text-paper-dim'
                }`}
              >
                {l.label}
              </button>
            ))}
            <div className="mt-2">
              <PrimaryButton onClick={() => go('game')} icon={<Play size={14} />} full>
                PLAY NOW
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function PrimaryButton({
  children,
  onClick,
  icon,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 ${
        full ? 'w-full' : ''
      } px-6 py-3 overflow-hidden transition-transform active:scale-95`}
      style={{
        background: 'linear-gradient(135deg, var(--red) 0%, var(--red-deep) 100%)',
        border: '1px solid rgba(255,59,70,0.4)',
        borderRadius: '4px',
        boxShadow: '0 0 0 1px rgba(239,230,210,0.06), 0 4px 16px rgba(122,19,24,0.4)',
      }}
    >
      {/* Sheen */}
      <span
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)' }}
      />
      <span className="relative font-display text-[13px] font-bold tracking-[0.18em] text-paper">
        {icon}
        {children}
      </span>
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  icon,
  full,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  icon?: React.ReactNode;
  full?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-2 ${
        full ? 'w-full' : ''
      } px-6 py-3 transition-transform active:scale-95`}
      style={{
        background: 'rgba(239,230,210,0.04)',
        border: '1px solid rgba(239,230,210,0.18)',
        borderRadius: '4px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <span className="relative font-display text-[13px] font-bold tracking-[0.18em] text-paper group-hover:text-moon transition-colors">
        {icon}
        {children}
      </span>
    </button>
  );
}

export function EmblemMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="13" stroke="rgba(239,230,210,0.25)" strokeWidth="1" />
      <circle cx="14" cy="14" r="9" fill="rgba(224,37,46,0.12)" />
      <path
        d="M14,5 C10,9 10,19 14,23 C18,19 18,9 14,5 Z"
        fill="var(--red)"
        opacity="0.9"
      />
      <circle cx="14" cy="14" r="2" fill="var(--red-bright)" />
    </svg>
  );
}
