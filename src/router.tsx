import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { soundEffects } from '@/game/soundEffects';

export type Page = 'home' | 'game' | 'howto' | 'about' | 'gameover' | 'victory';
export type CodexModal = 'howto' | 'about' | null;

interface GameResult {
  score: number;
  coins: number;
  time: number;
  rank?: string;
}

interface RouterContextType {
  page: Page;
  navigate: (page: Page) => void;
  lastResult: GameResult | null;
  setLastResult: (r: GameResult | null) => void;
  modal: CodexModal;
  openModal: (modal: CodexModal) => void;
  closeModal: () => void;
  isMuted: boolean;
  toggleMute: () => boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => Promise<void>;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('home');
  const [modal, setModal] = useState<CodexModal>(null);
  const [lastResult, setLastResult] = useState<GameResult | null>(null);
  const [isMuted, setIsMuted] = useState(() => soundEffects.isMuted());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sync fullscreen state across the entire document
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err);
    }
  }, []);

  const navigate = useCallback((next: Page) => {
    setModal(null);
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const openModal = useCallback((m: CodexModal) => {
    soundEffects.playMenuSelect();
    setModal(m);
  }, []);

  const closeModal = useCallback(() => {
    soundEffects.playMenuHover();
    setModal(null);
  }, []);

  const toggleMute = useCallback(() => {
    const next = soundEffects.toggleMute();
    setIsMuted(next);
    return next;
  }, []);

  // Global keyboard shortcuts (F for Fullscreen, ESC for modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        toggleFullscreen();
      } else if (e.key === 'Escape' && modal) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modal, closeModal, toggleFullscreen]);

  return (
    <RouterContext.Provider
      value={{
        page,
        navigate,
        lastResult,
        setLastResult,
        modal,
        openModal,
        closeModal,
        isMuted,
        toggleMute,
        isFullscreen,
        toggleFullscreen,
      }}
    >
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
