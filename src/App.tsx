import { RouterProvider, useRouter } from '@/router';
import { HomePage } from '@/pages/HomePage';
import { GameScreen } from '@/pages/GameScreen';
import { HowToPlayPage } from '@/pages/HowToPlayPage';
import { AboutPage } from '@/pages/AboutPage';
import { GameOverPage } from '@/pages/GameOverPage';
import { VictoryPage } from '@/pages/VictoryPage';

function PageRouter() {
  const { page, modal } = useRouter();

  return (
    <div key={page} className="relative w-full min-h-screen overflow-hidden bg-ink-0">
      {page === 'home' && <HomePage />}
      {page === 'game' && <GameScreen />}
      {page === 'howto' && <HowToPlayPage />}
      {page === 'about' && <AboutPage />}
      {page === 'gameover' && <GameOverPage />}
      {page === 'victory' && <VictoryPage />}

      {/* Global Codex Modal Overlay (when triggered from in-game or home) */}
      {modal === 'howto' && <HowToPlayPage isModal />}
      {modal === 'about' && <AboutPage isModal />}
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <PageRouter />
    </RouterProvider>
  );
}

export default App;
