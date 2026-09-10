import { useEffect, useRef, useState, useCallback, memo } from 'react';
import {
  Pause,
  Play,
  RotateCcw,
  Home,
  BookOpen,
  Heart,
  ChevronLeft,
  ChevronRight,
  Swords,
  Zap,
  Shield,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useGameEngine } from '@/game/useGameEngine';
import { useRouter } from '@/router';
import { NinjaCharacter, SHURIKEN_FRAMES, SHURIKEN_HIT_EFFECT, DASH_FRAMES, PARRY_EFFECT } from '@/components/NinjaCharacter';
import { CorruptedSamuraiCharacter } from '@/components/CorruptedSamuraiCharacter';
import { CorruptedBatCharacter } from '@/components/CorruptedBatCharacter';
import { HanzoCharacter, HANZO_HIT_EFFECT } from '@/components/HanzoCharacter';
import { AtmosphericBackground } from '@/components/AtmosphericBackground';
import { PrimaryButton, SecondaryButton, EmblemMark } from '@/components/Navbar';
import { soundEffects } from '@/game/soundEffects';
import { titleMusic } from '@/game/titleMusic';
import type { GameResultData, VisualEffect, ShurikenProjectile, BladeWaveProjectile, ShurikenHitEffect, RespawnEffect, DashGhost, ParryHitEffect, CollectibleShuriken, StoryLocation, Rect, HanzoHitEffect, HanzoGhost, StoryChoice, CinematicDialogueLine } from '@/game/types';

const NINJA_RESPAWN_EFFECT = '/assets/sprites/player/effects/respawn_effect.gif' as const;

const VIEWPORT_W = 800;
const VIEWPORT_H = 450;
const SCALE_RATIO = VIEWPORT_W / 800;

export function GameScreen() {
  const { navigate, setLastResult, openModal, isMuted, toggleMute, isFullscreen, toggleFullscreen } = useRouter();
  const {
    render,
    reset,
    loadStoryLocation,
    pause,
    resume,
    setInput,
    advanceStoryCinematic,
    skipStoryCinematic,
    skipBossIntro,
    selectStoryChoice,
    navigateStoryChoice,
    stayInYunami,
    proceedToChinoike,
    triggerExecutionBlow,
  } = useGameEngine(VIEWPORT_W, VIEWPORT_H);
  const [scale, setScale] = useState(1);
  const [showPause, setShowPause] = useState(false);
  const endedRef = useRef(false);
  const [runId, setRunId] = useState(0);

  // Cinematic Keyboard Navigation: Space/Enter to advance, Arrows for choice, Esc to skip/exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Yunami Ancient Portal Trial Dialog Keyboard Controls
      if (render.portalPrompt?.open) {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          stayInYunami();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          if (render.portalPrompt.hasBonusSkill) {
            proceedToChinoike();
          } else {
            stayInYunami();
          }
          return;
        }
      }

      // Boss Intro splash skip (Only allow explicit Escape or Enter to skip, never gameplay keys!)
      if (render.bossIntroTimer > 0) {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          skipBossIntro();
          return;
        }
      }

      const sc = render.storyCinematic;
      if (sc?.active) {
        if (sc.phase === 'dlc_teaser') {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            navigate('home');
          }
          return;
        }

        if (sc.phase === 'choice_waiting') {
          if (e.key === 'ArrowUp' || e.code === 'KeyW' || e.key.toLowerCase() === 'w') {
            e.preventDefault();
            e.stopPropagation();
            navigateStoryChoice(-1);
          } else if (e.key === 'ArrowDown' || e.code === 'KeyS' || e.key.toLowerCase() === 's') {
            e.preventDefault();
            e.stopPropagation();
            navigateStoryChoice(1);
          } else if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            selectStoryChoice(sc.selectedChoiceIndex === 1 ? 'spare' : 'kill');
          } else if (e.key === ' ') {
            // SPACE must NOT accidentally confirm the choice!
            e.preventDefault();
            e.stopPropagation();
          }
          return;
        }

        if (sc.phase === 'hanzo_execution_pending') {
          if (
            e.key === ' ' ||
            e.key === 'Enter' ||
            e.code === 'Space' ||
            e.code === 'KeyJ' ||
            e.key.toLowerCase() === 'j' ||
            e.key.toLowerCase() === 'z' ||
            e.key.toLowerCase() === 'x' ||
            e.key.toLowerCase() === 'c' ||
            e.key.toLowerCase() === 'q'
          ) {
            e.preventDefault();
            e.stopPropagation();
            triggerExecutionBlow();
          }
          return;
        }

        if (sc.phase === 'opening_dialogue' || sc.phase === 'final_dialogue') {
          if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            skipStoryCinematic();
          } else if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            advanceStoryCinematic();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [render.storyCinematic, render.bossIntroTimer, render.portalPrompt, skipStoryCinematic, skipBossIntro, advanceStoryCinematic, selectStoryChoice, navigateStoryChoice, stayInYunami, proceedToChinoike, triggerExecutionBlow, navigate]);

  // Responsive scaling
  useEffect(() => {
    const update = () => {
      const isFull = !!document.fullscreenElement;
      const winW = window.innerWidth;
      const winH = window.innerHeight;

      if (isFull) {
        // In true fullscreen, utilize maximum monitor space
        const s = Math.min(winW / VIEWPORT_W, winH / VIEWPORT_H);
        setScale(Math.max(s, 0.4));
      } else {
        // In standard window mode, fill available space beneath header
        const availW = Math.max(winW - 32, 320);
        const availH = Math.max(winH - 60, 280);
        const s = Math.min(availW / VIEWPORT_W, availH / VIEWPORT_H);
        setScale(Math.max(s, 0.4));
      }
    };

    update();
    soundEffects.stopTitleFireBlaze();
    window.addEventListener('resize', update);
    document.addEventListener('fullscreenchange', update);
    return () => {
      window.removeEventListener('resize', update);
      document.removeEventListener('fullscreenchange', update);
      soundEffects.stopHanzoBattleMusic();
      soundEffects.stopRunning();
      soundEffects.stopTitleFireBlaze();
      soundEffects.stopBloodRain();
    };
  }, []);

  // Atmospheric Supernatural Blood Rain Sound in Chinoike Jigoku
  useEffect(() => {
    if (render.storyLocation === 'chinoike-jigoku' && !render.storyCinematic?.active && render.status !== 'dead') {
      soundEffects.playBloodRain(0.48);
    } else {
      soundEffects.stopBloodRain();
    }
    return () => {
      soundEffects.stopBloodRain();
    };
  }, [render.storyLocation, render.storyCinematic?.active, render.status, isMuted]);

  // Play background music at lowered in-game volume (0.22) so hitting, jumping, and running sound effects are prominent
  // Pause during active cutscenes so cinematic dialogue and ambient drone audio are prominent
  useEffect(() => {
    if (!render.storyCinematic?.active && !render.bossIntroTriggered && !render.inBossArena) {
      titleMusic.play(isMuted, 0.22);
    } else {
      titleMusic.pause();
    }
    return () => {
      titleMusic.pause();
    };
  }, [render.storyCinematic?.active, render.bossIntroTriggered, render.inBossArena, isMuted]);

  useEffect(() => {
    titleMusic.setMuted(isMuted);
  }, [isMuted]);

  // Handle status transitions
  useEffect(() => {
    if (render.status === 'dead' && !endedRef.current) {
      endedRef.current = true;
      const time = Math.floor(render.time);
      const result: GameResultData = {
        score: render.score,
        coins: render.coinsCollected,
        time,
        rank: '',
      };
      setLastResult(result);
      setTimeout(() => navigate('gameover'), 1400);
    } else if (render.status === 'won' && !endedRef.current) {
      endedRef.current = true;
      const time = Math.floor(render.time);
      const rank = computeRank(render.score, time, render.coinsCollected, render.totalCoins);
      const result: GameResultData = {
        score: render.score,
        coins: render.coinsCollected,
        time,
        rank,
      };
      setLastResult(result);
      setTimeout(() => navigate('victory'), 1200);
    }
  }, [render.status, render.score, render.coinsCollected, render.time, render.totalCoins, navigate, setLastResult]);

  // Pause overlay sync
  useEffect(() => {
    setShowPause(render.status === 'paused');
  }, [render.status]);

  const handlePause = () => {
    pause();
    setShowPause(true);
  };
  const handleResume = () => {
    resume();
    setShowPause(false);
  };
  const handleRestart = () => {
    endedRef.current = false;
    setShowPause(false);
    setRunId((r) => r + 1);
    reset();
  };
  const goHome = () => {
    titleMusic.setVolume(0.55);
    navigate('home');
  };

  const parallax = render.cameraX / 3200;
  const shake = render.shake;
  const shakeStyle = shake > 0
    ? { transform: `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)` }
    : undefined;

  const vpWidth = Math.round(VIEWPORT_W * scale);
  const vpHeight = Math.round(VIEWPORT_H * scale);

  return (
    <div
      className={`relative w-full flex flex-col items-center justify-center select-none ${isFullscreen
        ? 'fixed inset-0 z-50 bg-[#05070d] h-screen overflow-hidden p-0 cursor-none'
        : 'min-h-[calc(100vh-4rem)] pt-4 pb-4 px-2 sm:px-4'
        }`}
    >
      {/* Game viewport */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: vpWidth,
          height: vpHeight,
        }}
      >
        <div
          onClick={() => {
            if (render.storyCinematic?.phase === 'hanzo_execution_pending') {
              triggerExecutionBlow();
            }
          }}
          className={`relative overflow-hidden ink-clip ${isFullscreen ? 'cursor-none' : ''}`}
          style={{
            width: vpWidth,
            height: vpHeight,
            background: 'var(--ink-0)',
            boxShadow: isFullscreen
              ? '0 0 0 1px rgba(239,230,210,0.08), 0 0 60px rgba(0,0,0,0.9)'
              : '0 0 0 1px rgba(239,230,210,0.08), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Inner scaled stage */}
          <div
            style={{
              width: VIEWPORT_W,
              height: VIEWPORT_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'relative',
            }}
          >
            {/* Atmospheric background (parallax) */}
            <div className="absolute inset-0" style={shakeStyle}>
              <AtmosphericBackground parallax={parallax} variant="game" moonTop="6%" storyLocation={render.storyLocation} />

              {/* Level world with GPU hardware-accelerated transform and cinematic camera zoom */}
              <div
                className="absolute inset-0 will-change-transform"
                style={{
                  transform: `scale(${render.cameraZoom || 1.0})`,
                  transformOrigin: '50% 50%',
                  transition: 'transform 0.1s ease-out',
                }}
              >
                <div
                  className="absolute top-0 left-0 will-change-transform"
                  style={{
                    transform: `translate3d(${-render.cameraX}px, ${-render.cameraY}px, 0)`,
                    width: render.levelWidth,
                    height: render.levelHeight,
                  }}
                >
                {/* Environmental Props & Hazards */}
                {render.storyLocation === 'chinoike-jigoku' ? (
                  <>
                    <ChinoikeEnvironmentDetails levelWidth={render.levelWidth} />
                    <BloodPondsView bloodPonds={render.bloodPonds} />
                    <ChinoikeHazardsView />
                  </>
                ) : (
                  <>
                    <LevelEnvironmentDecorations levelWidth={render.levelWidth} />
                    <HellChasmPitsView />
                    <YunamiEnvironmentDetails />
                  </>
                )}

                {/* Platforms */}
                {render.platforms.map((pl, i) => (
                  <PlatformView key={i} plat={pl} />
                ))}

                {/* Spikes */}
                {render.spikes.map((sp, i) => (
                  <SpikeView key={`sp${i}`} spike={sp} />
                ))}

                {/* Coins */}
                {render.coins.filter((c) => !c.collected).map((c, i) => (
                  <CoinView key={`c${i}`} coin={c} />
                ))}

                {/* Checkpoint */}
                <CheckpointView checkpoint={render.checkpoint} />

                {/* Collectible Shurikens in Yunami Jigoku */}
                {render.collectibleShurikens?.filter((cs) => !cs.collected).map((cs) => (
                  <CollectibleShurikenView key={`cs-${cs.id}`} shuriken={cs} />
                ))}

                {/* Ancient Supernatural Torii Portal (End of Yunami Jigoku) */}
                <CursedToriiPortalView exit={render.exit} />

                {/* Cursed Kekkai Barrier (Seals Hanzo Boss Arena entrance at X = 6100 until Hanzo is killed) */}
                {render.storyLocation === 'chinoike-jigoku' && render.bossIntroTriggered && !render.hanzoDefeated && (
                  <CursedKekkaiBarrierView />
                )}

                {/* Enemies */}
                {render.enemies.map((e) => (
                  <EnemyView
                    key={e.id}
                    enemy={e}
                    bossIntroTriggered={render.bossIntroTriggered}
                    storyLocation={render.storyLocation}
                  />
                ))}

                {/* Speed Dash Ghost Afterimages (残像) */}
                {render.dashGhosts.map((g) => (
                  <DashGhostView key={g.id} ghost={g} />
                ))}

                {/* Hanzo Shadow Afterimages (残像) */}
                {render.hanzoGhosts.map((g) => (
                  <HanzoGhostView key={g.id} ghost={g} />
                ))}

                {/* Hanzo Teleport Telegraph Shadow Marker (Layer: world-space at predicted teleport destination) */}
                {render.enemies.map((e) => {
                  if (e.type === 'hanzo' && e.telegraph === 'teleport' && e.telegraphTargetX !== undefined) {
                    return (
                      <HanzoTeleportShadowMarker
                        key={`teleport-marker-${e.id}`}
                        targetX={e.telegraphTargetX}
                        targetY={e.telegraphTargetY ?? (280 - e.h)}
                        timer={e.telegraphTimer || 0}
                        maxTimer={e.telegraphMaxTimer || 12}
                        width={e.w}
                        height={e.h}
                      />
                    );
                  }
                  return null;
                })}

                {/* Opening Cutscene: UNKNOWN Character in World */}
                {render.storyCinematic?.unknownActor && (
                  <UnknownCutsceneCharacterView actor={render.storyCinematic.unknownActor} />
                )}

                {/* Opening Cutscene: Torii Gate of Chinoike Jigoku */}
                {render.storyLocation === 'yunami-jigoku' && render.storyCinematic?.active && render.storyCinematic.phase.startsWith('opening_') && (
                  <ChinoikeToriiGateView x={490} y={470} />
                )}

                {/* Opening Cutscene: Floating Spirit Orb */}
                {render.storyCinematic?.spiritOrb?.active && (
                  <SpiritTransferOrbView orb={render.storyCinematic.spiritOrb} />
                )}

                {/* Player */}
                <PlayerView player={render.player} />

                {/* Shuriken Projectiles (Layer: above player & enemies) */}
                {render.shurikens.map((s) => (
                  <ShurikenView key={s.id} shuriken={s} />
                ))}

                {/* Crimson Blade Waves (Layer: above player & enemies) */}
                {render.bladeWaves?.map((bw) => (
                  <BladeWaveView key={bw.id} wave={bw} />
                ))}

                {/* Combat & Movement Visual Effects (Slash, Impact, Dust) */}
                {render.effects.map((eff) => (
                  <CombatEffectView key={eff.id} effect={eff} />
                ))}

                {/* Shuriken Hit Effects (Layer: above combat sprites at exact collision point) */}
                {render.shurikenHits.map((hit) => (
                  <ShurikenHitView key={hit.id} hit={hit} />
                ))}

                {/* Parry Hit Effects (Layer: plays at exact blade clash point on parry success) */}
                {render.parryHits.map((hit) => (
                  <ParryHitView key={hit.id} hit={hit} />
                ))}

                {/* Ninja Respawn Effect after Death (Layer: envelopes the resurrected ninja) */}
                {render.respawnEffect && (
                  <RespawnEffectView effect={render.respawnEffect} />
                )}

                {/* Hanzo Attack Impact Effect (Layer: plays hit effect hanzo.gif on successful contact) */}
                {render.hanzoHitEffect && (
                  <HanzoHitEffectView effect={render.hanzoHitEffect} />
                )}

                {/* Supernatural Purple Energy Tether (Shot 9: The Hellbound Cycle) */}
                {render.storyCinematic?.energyTetherActive && (
                  <SupernaturalEnergyTether render={render} />
                )}
              </div>
            </div>

              {/* Chinoike Jigoku Atmospheric Supernatural Blood Rain */}
              {render.storyLocation === 'chinoike-jigoku' && (
                <BloodRainWeather />
              )}

              {/* Damage flash overlay */}
              {render.damageFlash > 0 && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `rgba(224,37,46,${render.damageFlash * 0.3})` }}
                />
              )}

              {/* Death fade */}
              {render.status === 'dead' && (
                <div
                  className="absolute inset-0 pointer-events-none anim-fade-in"
                  style={{ background: 'rgba(5,7,13,0.7)' }}
                />
              )}

              {/* Victory flash */}
              {render.status === 'won' && (
                <div
                  className="absolute inset-0 pointer-events-none anim-fade-in"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(233,196,106,0.3) 0%, transparent 70%)' }}
                />
              )}

              {/* Phase 6 Cinematic Boss Death Atmosphere Overlay */}
              {render.hanzoDeathCinematic && (
                <div
                  className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                  style={{
                    zIndex: 22,
                    background: 'radial-gradient(ellipse at 50% 55%, rgba(45, 10, 60, 0.42) 0%, rgba(15, 0, 25, 0.78) 100%)',
                    backdropFilter: 'contrast(1.15) saturate(1.1)',
                  }}
                />
              )}
            </div>

            {/* Story Intro Banner (Slowmotion Animation) — Only plays after opening cutscene finishes or when cutscene is not active */}
            {!render.storyCinematic?.active && (
              <StoryIntroBanner
                key={`${render.storyLocation}-${runId}-${render.storyCinematic?.isComplete ? 'post_cutscene' : 'normal'}`}
                locationName={render.levelName}
                jpName={render.levelJpName}
              />
            )}

            {/* Cinematic Finisher Letterbox (Slow motion time dilation) */}
            <CinematicLetterbox slowMotion={render.slowMotion} />

            {/* Trophy / Exploration Secret / Missed Guidance Banner */}
            <TrophyBannerView notification={render.trophyNotification} />

            {/* Cinematic Boss Letterbox Bars (Animate into view during Hanzo Duel) */}
            <div
              className={`absolute top-0 left-0 right-0 h-7 sm:h-9 bg-black/95 border-b border-red-accent/40 z-30 pointer-events-none transition-transform duration-700 ease-out flex items-center justify-between px-6 ${
                render.inBossArena && !render.storyCinematic?.active ? 'translate-y-0 shadow-[0_5px_20px_rgba(0,0,0,0.9)]' : '-translate-y-full'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-accent animate-ping" />
                <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.3em] text-red-accent uppercase font-bold">
                  INFERNAL DUEL // 決戦
                </span>
              </div>
              <span className="font-jp text-[9px] text-paper-dim/70 tracking-[0.2em]">
                血の池地獄 最終守護者
              </span>
            </div>
            <div
              className={`absolute bottom-0 left-0 right-0 h-7 sm:h-9 bg-black/95 border-t border-red-accent/40 z-30 pointer-events-none transition-transform duration-700 ease-out flex items-center justify-between px-6 ${
                render.inBossArena && !render.storyCinematic?.active ? 'translate-y-0 shadow-[0_-5px_20px_rgba(0,0,0,0.9)]' : 'translate-y-full'
              }`}
            >
              <span className="font-display text-[8px] sm:text-[9px] tracking-[0.35em] text-paper-dim/80 uppercase font-semibold">
                TAMASHI NO SHINDEN GATE GUARDIAN
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-accent animate-pulse" />
                <span className="font-mono text-[8px] sm:text-[9px] tracking-[0.22em] text-red-accent font-bold uppercase">
                  結界発動 // ARENA SEALED — DEFEAT HANZO TO ESCAPE
                </span>
              </div>
            </div>

            {/* Cinematic Boss Intro Splash Banner */}
            {render.bossIntroTimer > 0 && (
              <BossIntroBanner timer={render.bossIntroTimer} />
            )}

            {/* Story Cutscene System */}
            {render.storyCinematic?.active && (
              <StoryCinematicOverlay
                cinematic={render.storyCinematic}
                onAdvance={advanceStoryCinematic}
                onSkip={skipStoryCinematic}
                onSelectChoice={selectStoryChoice}
                onNavigateChoice={navigateStoryChoice}
                onExecuteBlow={triggerExecutionBlow}
              />
            )}

            {/* HUD */}
            <HUD
              render={render}
              onPause={handlePause}
              onToggleFullscreen={toggleFullscreen}
              isFullscreen={isFullscreen}
              isMuted={isMuted}
              onToggleMute={toggleMute}
            />
          </div>
        </div>

        {/* Yunami Jigoku Ancient Portal Trial Confirmation Modal */}
        {render.portalPrompt?.open && (
          <YunamiPortalPromptModal
            prompt={render.portalPrompt}
            onStay={stayInYunami}
            onProceed={proceedToChinoike}
          />
        )}

        {/* Mission Complete Overlay (Final Chapter 2 Cleared) */}
        {render.status === 'mission_complete' && (
          <MissionCompleteOverlay
            onRestart={() => {
              loadStoryLocation('yunami-jigoku');
              setRunId((r) => r + 1);
            }}
            onHome={goHome}
          />
        )}

        {/* Pause overlay */}
        {showPause && (
          <PauseOverlay
            onResume={handleResume}
            onRestart={handleRestart}
            onToggleFullscreen={toggleFullscreen}
            isFullscreen={isFullscreen}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            onHome={goHome}
            onHowTo={() => openModal('howto')}
            onLore={() => openModal('about')}
          />
        )}
      </div>

      {/* Touch controls */}
      <TouchControls setInput={setInput} />
    </div>
  );
}

/* ---------- HUD ---------- */

function HUD({
  render,
  onPause,
  onToggleFullscreen,
  isFullscreen,
  isMuted,
  onToggleMute,
}: {
  render: ReturnType<typeof useGameEngine>['render'];
  onPause: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  isMuted: boolean;
  onToggleMute: () => void;
}) {
  if (render.storyCinematic?.active) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-40" style={{ width: VIEWPORT_W, height: VIEWPORT_H }}>
      {/* Top bar */}
      <div className={`absolute top-0 left-0 right-0 flex items-start justify-between px-4 transition-all duration-500 ${render.inBossArena ? 'pt-10' : 'py-3'}`}>
        {/* Health + Extra Spirit Life + Stamina Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <EmblemMark size={18} />
              <div className="flex gap-1 items-center">
                {Array.from({ length: render.player.maxHp }).map((_, i) => {
                  const isFull = render.player.hp >= i + 1;
                  const isHalf = !isFull && render.player.hp >= i + 0.5;
                  return (
                    <div key={i} className="relative w-3.5 h-3.5 flex items-center justify-center">
                      {/* Empty Heart Base */}
                      <Heart size={14} className="opacity-20 text-paper-dim" />
                      {/* Full Heart */}
                      {isFull && (
                        <Heart
                          size={14}
                          className="absolute inset-0 text-red-accent"
                          style={{ fill: 'var(--red)', filter: 'drop-shadow(0 0 3px rgba(224,37,46,0.6))' }}
                        />
                      )}
                      {/* Half Heart (50% clip) */}
                      {isHalf && (
                        <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                          <Heart
                            size={14}
                            className="text-red-accent max-w-none"
                            style={{ fill: 'var(--red)', filter: 'drop-shadow(0 0 3px rgba(224,37,46,0.6))' }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Extra Spirit (Resurrection Chance) */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded"
              style={{
                background: render.extraLives > 0 ? 'rgba(95,179,154,0.18)' : 'rgba(239,230,210,0.05)',
                border: render.extraLives > 0 ? '1px solid rgba(95,179,154,0.45)' : '1px solid rgba(239,230,210,0.12)',
                boxShadow: render.extraLives > 0 ? '0 0 8px rgba(95,179,154,0.25)' : 'none',
              }}
              title={render.extraLives > 0 ? 'Extra Spirit: Checkpoint Revive Ready' : 'Final Life: No Revives Remaining'}
            >
              <span
                className={`font-jp text-[11px] font-bold ${render.extraLives > 0 ? 'text-jade' : 'text-paper-dim opacity-40'}`}
                style={render.extraLives > 0 ? { filter: 'drop-shadow(0 0 4px rgba(95,179,154,0.8))' } : {}}
              >
                魂
              </span>
              <span className={`font-mono text-xs font-bold ${render.extraLives > 0 ? 'text-jade' : 'text-paper-dim opacity-40'}`}>
                +{render.extraLives}
              </span>
            </div>

            {/* Shuriken Ammo Counter */}
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded"
              style={{
                background: render.player.shurikenCount > 0 ? 'rgba(239,230,210,0.12)' : 'rgba(224,37,46,0.2)',
                border: render.player.shurikenCount > 0 ? '1px solid rgba(239,230,210,0.28)' : '1px solid rgba(224,37,46,0.45)',
                boxShadow: render.player.shurikenCount > 0 ? '0 0 6px rgba(239,230,210,0.15)' : 'none',
              }}
              title="Shuriken Ammo (Right Click / X)"
            >
              {/* Shuriken 4-point star SVG */}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={render.player.shurikenCount > 0 ? 'text-paper' : 'text-red-accent'}>
                <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill="currentColor" />
                <circle cx="12" cy="12" r="2.5" fill="#0c0d12" />
              </svg>
              <span className={`font-mono text-xs font-bold ${render.player.shurikenCount > 0 ? 'text-paper' : 'text-red-accent'}`}>
                ×{render.player.shurikenCount}
              </span>
            </div>
          </div>

          {/* Dash Stamina Gauge (5s full recharge) */}
          <div className="flex items-center gap-2 pl-6">
            <div className="flex items-center gap-1">
              <Zap
                size={11}
                className={render.player.stamina >= 50 ? 'text-gold' : 'text-paper-dim opacity-40'}
                style={render.player.stamina >= 50 ? { filter: 'drop-shadow(0 0 4px rgba(233,196,106,0.8))' } : {}}
              />
              <span className="font-display text-[9px] tracking-wider text-paper-dim font-bold">
                STAMINA
              </span>
            </div>

            {/* Segmented Stamina Bar (2 Dash charges, 50% each, 5.0s full recharge) */}
            <div
              className="relative w-28 h-2 rounded overflow-hidden"
              style={{
                background: 'rgba(5, 7, 13, 0.85)',
                border: '1px solid rgba(239, 230, 210, 0.25)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.9)',
              }}
            >
              {/* Mid-point divider line for the 2 dashes */}
              <div
                className="absolute top-0 bottom-0 left-1/2 w-[1px] z-10 pointer-events-none"
                style={{ background: 'rgba(239, 230, 210, 0.4)' }}
              />
              {/* Fill bar */}
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${Math.max(0, Math.min(100, render.player.stamina))}%`,
                  background:
                    render.player.stamina >= 50
                      ? 'linear-gradient(90deg, #d4a34b 0%, #e9c46a 50%, #5fb39a 100%)'
                      : 'linear-gradient(90deg, #7a1318 0%, #e0252e 100%)',
                  boxShadow:
                    render.player.stamina >= 50
                      ? '0 0 8px rgba(233, 196, 106, 0.6)'
                      : '0 0 6px rgba(224, 37, 46, 0.5)',
                }}
              />
            </div>

            {/* Dash ready indicator text */}
            <span
              className={`font-mono text-[9px] font-bold tracking-tight ${
                render.player.stamina >= 50 ? 'text-gold' : 'text-red-accent animate-pulse'
              }`}
            >
              {render.player.stamina >= 100
                ? 'DASH ×2'
                : render.player.stamina >= 50
                ? 'DASH ×1'
                : 'RECHARGING'}
            </span>
          </div>
        </div>

        {/* Hanzo Story Guardian Boss Health Bar (Appears strictly after the two intros finish) */}
        {(() => {
          if (!render.inBossArena || !render.bossIntroTriggered || render.bossIntroTimer > 0) return null;
          const hanzo = render.enemies.find((e) => e.type === 'hanzo');
          if (!hanzo || !hanzo.alive || hanzo.state === 'death' || hanzo.state === 'dead') return null;
          const hpPercent = Math.max(0, Math.min(100, (hanzo.hp / hanzo.maxHp) * 100));
          const isEnraged = hanzo.isEnraged || hanzo.hp <= hanzo.maxHp / 2;

          return (
            <div className="flex flex-col items-center select-none pointer-events-none anim-fade-in mx-auto px-4 z-40">
              {/* Boss Title & Phase Status Header */}
              <div className="flex items-center gap-2 mb-1">
                <span className="font-jp text-[10px] text-red-accent font-bold tracking-[0.2em]">
                  {isEnraged ? '覚醒' : '怨霊'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="font-display text-[12px] sm:text-[13px] font-black tracking-[0.28em] text-paper uppercase"
                    style={{
                      textShadow: isEnraged
                        ? '0 0 12px rgba(255,43,54,1), 0 0 24px rgba(255,100,0,0.8)'
                        : '0 0 10px rgba(255,43,54,0.9), 0 0 20px rgba(180,0,255,0.7)',
                    }}
                  >
                    HANZO — PORTAL GUARDIAN
                  </span>
                  {isEnraged && (
                    <span className="px-1.5 py-0.2 text-[8px] font-display font-black rounded bg-red-accent/30 text-amber-300 border border-red-accent animate-pulse tracking-widest">
                      UNLEASHED
                    </span>
                  )}
                </div>
                <span className="font-jp text-[10px] text-red-accent font-bold tracking-[0.2em]">半蔵</span>
              </div>

              {/* Ornate Boss HP Container with Japanese-style framing */}
              <div className="relative w-64 sm:w-80 md:w-96">
                {/* Frame Corner Accents */}
                <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 border-l-2 border-t-2 border-red-accent" />
                <div className="absolute -right-1.5 -top-1 w-2.5 h-2.5 border-r-2 border-t-2 border-red-accent" />
                <div className="absolute -left-1.5 -bottom-1 w-2.5 h-2.5 border-l-2 border-b-2 border-red-accent" />
                <div className="absolute -right-1.5 -bottom-1 w-2.5 h-2.5 border-r-2 border-b-2 border-red-accent" />

                {/* HP Track */}
                <div
                  className={`w-full h-3 sm:h-3.5 rounded-sm bg-black/90 border p-[1.5px] relative overflow-hidden ${
                    isEnraged
                      ? 'border-red-500 shadow-[0_0_20px_rgba(255,43,54,0.8)]'
                      : 'border-red-accent/60 shadow-[0_0_15px_rgba(255,43,54,0.5)]'
                  }`}
                >
                  {/* Phase 2 Threshold Marker at 50% */}
                  <div
                    className="absolute top-0 bottom-0 w-[1.5px] bg-red-400/80 z-10"
                    style={{ left: '50%' }}
                    title={`Phase 2 Enraged Threshold (${Math.floor((hanzo.maxHp || 70) / 2)} hits)`}
                  />

                  {/* Segment dividers dynamically mapped to Hanzo maxHp (70 hits: 10-hit major, 5-hit medium) */}
                  {Array.from({ length: Math.max(1, (hanzo.maxHp || 70) - 1) }).map((_, idx) => {
                    const hitNum = idx + 1;
                    const maxHits = hanzo.maxHp || 70;
                    const isMajor = hitNum % 10 === 0;
                    const isMedium = hitNum % 5 === 0;
                    return (
                      <div
                        key={idx}
                        className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
                          isMajor ? 'w-[1px] bg-white/45' : isMedium ? 'w-[0.8px] bg-white/25' : 'w-[0.5px] bg-white/10'
                        }`}
                        style={{ left: `${(hitNum / maxHits) * 100}%` }}
                      />
                    );
                  })}

                  {/* Health Bar Fill */}
                  <div
                    className="h-full transition-all duration-150 rounded-sm"
                    style={{
                      width: `${hpPercent}%`,
                      background: isEnraged
                        ? 'linear-gradient(90deg, #66060c 0%, #ff2b36 40%, #ff8800 100%)'
                        : 'linear-gradient(90deg, #66060c 0%, #ff2b36 50%, #bf40bf 100%)',
                      boxShadow: isEnraged
                        ? '0 0 14px rgba(255,80,0,0.9), inset 0 0 6px rgba(255,255,255,0.4)'
                        : '0 0 10px rgba(255,43,54,0.8), inset 0 0 5px rgba(255,255,255,0.3)',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })()}

        {/* Top-Right Minimal Controls (Audio Mute, Fullscreen, Pause) */}
        <div className="flex items-center gap-1.5 pointer-events-auto opacity-40 hover:opacity-100 transition-opacity">
          {/* Audio Mute Button */}
          <button
            onClick={onToggleMute}
            className="w-7 h-7 rounded flex items-center justify-center border border-ink/40 text-paper-dim hover:text-paper hover:border-red-accent transition-colors cursor-pointer"
            style={{ background: 'rgba(5, 7, 13, 0.75)', backdropFilter: 'blur(4px)' }}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="w-7 h-7 rounded flex items-center justify-center border border-ink/40 text-paper-dim hover:text-paper hover:border-red-accent transition-colors cursor-pointer"
            style={{ background: 'rgba(5, 7, 13, 0.75)', backdropFilter: 'blur(4px)' }}
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
          </button>

          {/* Pause Button */}
          <button
            onClick={onPause}
            className="h-7 px-2 rounded flex items-center gap-1 border border-ink/40 text-paper-dim hover:text-paper hover:border-red-accent transition-colors cursor-pointer"
            style={{ background: 'rgba(5, 7, 13, 0.75)', backdropFilter: 'blur(4px)' }}
            title="Pause Game (ESC / P)"
          >
            <Pause size={13} />
            <span className="font-mono text-[9px] font-semibold tracking-widest hidden sm:inline">PAUSE</span>
          </button>
        </div>
      </div>

      {/* Ninja Combo Counter (Kanji rank, hit count, 5s decay gauge, finisher alert) */}
      <NinjaComboCounterView combo={render.combo} />

      {/* Ninja Techniques Hotbar (Skill statuses & hotkeys) */}
      <NinjaTechniquesHotbar unlockedSkills={render.unlockedSkills} combo={render.combo} />
    </div>
  );
}

/* ---------- Pause Overlay (Console / Game Style) ---------- */

function PauseOverlay({
  onResume,
  onRestart,
  onHome,
  onHowTo,
  onLore,
  onToggleFullscreen,
  isFullscreen,
  isMuted,
  onToggleMute,
}: {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  onHowTo: () => void;
  onLore?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}) {
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center anim-fade-in cursor-auto"
      style={{ background: 'rgba(5,7,13,0.92)', backdropFilter: 'blur(8px)' }}
    >
      <div className="flex flex-col items-center gap-4 anim-scale-in p-6 rounded-lg border border-red-accent/30 bg-ink-2/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] max-w-xs w-full">
        {/* Title */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-red-accent">❖</span>
            <h2 className="font-display text-xl font-bold tracking-[0.2em] text-paper">GAME PAUSED</h2>
            <span className="text-red-accent">❖</span>
          </div>
          <div className="font-jp text-[10px] text-red-accent tracking-[0.3em]">一時停止</div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full mt-2">
          <PrimaryButton onClick={onResume} icon={<Play size={14} />}>
            RESUME GAME
          </PrimaryButton>
          <SecondaryButton onClick={onRestart} icon={<RotateCcw size={14} />}>
            RESTART LEVEL
          </SecondaryButton>
          <SecondaryButton onClick={onHowTo} icon={<BookOpen size={14} />}>
            SCROLL OF TECHNIQUES
          </SecondaryButton>
          {onLore && (
            <SecondaryButton onClick={onLore} icon={<BookOpen size={14} />}>
              TEMPLE LORE
            </SecondaryButton>
          )}
          {onToggleFullscreen && (
            <SecondaryButton onClick={onToggleFullscreen} icon={isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}>
              {isFullscreen ? 'WINDOWED' : 'FULLSCREEN'}
            </SecondaryButton>
          )}
          {onToggleMute && (
            <SecondaryButton onClick={onToggleMute} icon={isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}>
              {isMuted ? 'AUDIO: MUTED' : 'AUDIO: ON'}
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onHome} icon={<Home size={14} />}>
            TITLE MENU
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}

/* ---------- Touch Controls ---------- */

function TouchControls({ setInput }: { setInput: (k: 'left' | 'right' | 'jump' | 'attack' | 'dash' | 'throw' | 'parry', v: boolean) => void }) {
  const hold = (key: 'left' | 'right' | 'jump' | 'attack' | 'dash' | 'throw' | 'parry') => ({
    onPointerDown: (e: React.PointerEvent) => { e.preventDefault(); setInput(key, true); },
    onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); setInput(key, false); },
    onPointerLeave: () => setInput(key, false),
    onPointerCancel: () => setInput(key, false),
  });

  return (
    <div className="md:hidden mt-4 w-full max-w-4xl flex items-center justify-between gap-4 select-none">
      {/* Left: movement */}
      <div className="flex gap-2">
        <TouchBtn label="LEFT" icon={<ChevronLeft size={20} />} {...hold('left')} />
        <TouchBtn label="RIGHT" icon={<ChevronRight size={20} />} {...hold('right')} />
      </div>
      {/* Right: actions */}
      <div className="flex gap-2">
        <TouchBtn label="PARRY" icon={<Shield size={18} />} small {...hold('parry')} />
        <TouchBtn label="DASH" icon={<Zap size={18} />} small {...hold('dash')} />
        <TouchBtn label="SHURIKEN" icon={<span className="font-bold text-xs">X</span>} small {...hold('throw')} />
        <TouchBtn label="ATK" icon={<Swords size={18} />} small {...hold('attack')} />
        <TouchBtn label="JUMP" icon={<ChevronLeft size={18} className="rotate-90" />} {...hold('jump')} />
      </div>
    </div>
  );
}

function TouchBtn({
  label, icon, small, ...handlers
}: {
  label: string;
  icon: React.ReactNode;
  small?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onPointerLeave?: () => void;
  onPointerCancel?: () => void;
}) {
  return (
    <button
      {...handlers}
      className={`flex flex-col items-center justify-center ${small ? 'w-14 h-14' : 'w-16 h-16'
        } rounded-full transition-transform active:scale-90`}
      style={{
        background: 'rgba(239,230,210,0.06)',
        border: '1px solid rgba(239,230,210,0.18)',
        backdropFilter: 'blur(4px)',
        touchAction: 'none',
      }}
    >
      <span className="text-paper">{icon}</span>
      <span className="font-display text-[8px] tracking-widest text-paper-dim mt-0.5">{label}</span>
    </button>
  );
}

/* ---------- Entity Views ---------- */

/* ---------- Entity Views & Environmental Props ---------- */

const LevelEnvironmentDecorations = memo(function LevelEnvironmentDecorations({ levelWidth }: { levelWidth: number }) {
  // Placement of stone lanterns, banners, torii gates, and chains along the 6600px level
  const lanterns = [
    { x: 140, y: 600 },
    { x: 740, y: 600 },
    { x: 1300, y: 600 },
    { x: 1420, y: 600 },
    { x: 1960, y: 600 },
    { x: 2500, y: 600 },
    { x: 2620, y: 600 },
    { x: 3220, y: 600 },
    { x: 3560, y: 600 },
    { x: 4200, y: 600 },
    { x: 4320, y: 600 },
    { x: 4880, y: 600 },
    { x: 5120, y: 600 },
    { x: 5400, y: 600 },
    { x: 5740, y: 600 },
    { x: 6120, y: 600 },
    { x: 6420, y: 600 },
  ];

  const banners = [
    { x: 240, y: 440, height: 65 },
    { x: 780, y: 535, height: 65 },
    { x: 1980, y: 535, height: 65 },
    { x: 2640, y: 535, height: 65 },
    { x: 3580, y: 535, height: 65 },
    { x: 4340, y: 535, height: 65 },
    { x: 5100, y: 535, height: 65 },
    { x: 5640, y: 535, height: 65 },
    { x: 6080, y: 535, height: 65 },
    { x: 6440, y: 535, height: 65 },
  ];

  const toriiPortals = [
    { x: 690, y: 505, scale: 0.85 },
    { x: 1920, y: 500, scale: 0.95 },
    { x: 4280, y: 500, scale: 0.95 },
    { x: 5060, y: 495, scale: 0.95 },
    { x: 6020, y: 490, scale: 1.05 },
  ];

  const hangingChains = [
    { x: 1140, y: 440, h: 55 },
    { x: 1640, y: 460, h: 45 },
    { x: 2280, y: 420, h: 60 },
    { x: 3080, y: 320, h: 70 },
    { x: 4680, y: 320, h: 65 },
    { x: 5360, y: 390, h: 75 },
    { x: 5700, y: 380, h: 65 },
    { x: 6300, y: 410, h: 80 },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none select-none" style={{ width: levelWidth, height: 720 }}>
      {/* Hanging Cursed Iron Chains swinging slowly */}
      {hangingChains.map((ch, i) => (
        <div
          key={`chain-${i}`}
          className="absolute pointer-events-none opacity-65"
          style={{
            left: ch.x,
            top: ch.y,
            width: '6px',
            height: `${ch.h}px`,
            background:
              'repeating-linear-gradient(180deg, #2a0b10 0, #2a0b10 4px, #421219 4px, #421219 8px, #120406 8px, #120406 12px)',
            boxShadow: '0 0 6px rgba(0,0,0,0.8), 0 0 4px rgba(255,43,54,0.2)',
            transformOrigin: 'top center',
            animation: `float-gentle ${4 + (i % 3) * 0.8}s ease-in-out infinite alternate`,
          }}
        />
      ))}

      {/* Corrupted Torii Gate Portals at Major Transitions */}
      {toriiPortals.map((t, i) => (
        <div
          key={`torii-${i}`}
          className="absolute pointer-events-none opacity-55"
          style={{
            left: t.x,
            top: t.y,
            transform: `scale(${t.scale})`,
            transformOrigin: 'bottom center',
          }}
        >
          <svg width="120" height="110" viewBox="0 0 120 110" fill="none">
            {/* Top Kasagi curved lintel with burned charred wood */}
            <path d="M0,16 Q60,4 120,16 L118,24 Q60,14 2,24 Z" fill="#2d0a0e" stroke="rgba(255,43,54,0.6)" strokeWidth="1.2" />
            <rect x="15" y="30" width="90" height="7" fill="#1b0508" />
            {/* Hashira pillars wrapped with demonic curse glow */}
            <rect x="26" y="22" width="9" height="88" fill="#100305" stroke="rgba(255,43,54,0.5)" strokeWidth="1" />
            <rect x="85" y="22" width="9" height="88" fill="#100305" stroke="rgba(255,43,54,0.5)" strokeWidth="1" />
            <rect x="56" y="22" width="8" height="16" fill="#22070a" />
            {/* Demon Talisman Seal */}
            <circle cx="60" cy="30" r="3.5" fill="#ff2b36" opacity="0.85" filter="drop-shadow(0 0 4px #ff2b36)" />
          </svg>
        </div>
      ))}

      {/* Swaying Cursed Temple Banners (Nobori) */}
      {banners.map((b, i) => (
        <div
          key={`banner-${i}`}
          className="absolute anim-banner-sway pointer-events-none"
          style={{ left: b.x, top: b.y }}
        >
          <div style={{ width: '3px', height: `${b.height + 14}px`, background: '#260c10', position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: '-2px', width: '22px', height: '3px', background: '#3b1218' }} />
            <div
              style={{
                position: 'absolute',
                top: '3px',
                left: '2px',
                width: '16px',
                height: `${b.height}px`,
                background: 'linear-gradient(180deg, #991b1b 0%, #7f1d1d 70%, #300606 100%)',
                borderLeft: '1px solid rgba(255,100,100,0.3)',
                borderRight: '1px solid rgba(0,0,0,0.6)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 6px rgba(255,43,54,0.3)',
                clipPath: 'polygon(0 0, 100% 0, 100% 90%, 50% 100%, 0 90%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                paddingTop: '4px',
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1px solid rgba(255,120,80,0.8)', opacity: 0.9 }} />
              <div style={{ width: '2px', height: '14px', background: 'rgba(255,120,80,0.6)', marginTop: '4px' }} />
            </div>
          </div>
        </div>
      ))}

      {/* Stone Lanterns (Tōrō) with Corrupted Crimson Flame Radiance */}
      {lanterns.map((l, i) => (
        <div
          key={`lantern-${i}`}
          className="absolute flex flex-col items-center pointer-events-none"
          style={{ left: l.x, top: l.y - 42 }}
        >
          <div className="relative flex items-center justify-center">
            {/* Ominous crimson flame glow aura */}
            <div
              className="absolute anim-lantern-flicker pointer-events-none rounded-full"
              style={{
                width: '34px',
                height: '34px',
                background: 'radial-gradient(circle, rgba(255,43,54,0.7) 0%, rgba(180,15,25,0.3) 45%, transparent 72%)',
                filter: 'blur(6px)',
              }}
            />
            <svg width="24" height="42" viewBox="0 0 24 42" fill="none">
              <circle cx="12" cy="3.5" r="2.8" fill="#2d0f15" />
              <path d="M1,11 Q12,5 23,11 L21,13.5 Q12,10 3,13.5 Z" fill="#220a0e" />
              <rect x="7" y="13.5" width="10" height="9" fill="#0d0305" stroke="#2d0f15" strokeWidth="0.8" />
              {/* Dim crimson flame interior */}
              <rect x="9" y="15.5" width="6" height="5" fill="#ff2b36" className="anim-lantern-flicker" filter="drop-shadow(0 0 3px #ff2b36)" />
              <rect x="5" y="22.5" width="14" height="3" fill="#220a0e" />
              <rect x="9" y="25.5" width="6" height="11" fill="#150508" />
              <rect x="4" y="36.5" width="16" height="5.5" rx="1" fill="#220a0e" />
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
});

const PlatformView = memo(function PlatformView({ plat }: { plat: { x: number; y: number; w: number; h: number; type?: string } }) {
  if (plat.type === 'wall') return null;
  const isGround = plat.type === 'ground';

  if (isGround) {
    return (
      <div
        className="absolute overflow-hidden"
        style={{
          left: plat.x,
          top: plat.y,
          width: plat.w,
          height: plat.h,
          background: 'linear-gradient(180deg, #10060a 0%, #070305 35%, #020102 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,43,54,0.35), 0 10px 30px rgba(0,0,0,0.9)',
        }}
      >
        {/* Scorched volcanic basalt cap with glowing magma edge */}
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{
            background: 'linear-gradient(180deg, #22080e 0%, #130408 100%)',
            borderTop: '1px solid rgba(255,43,54,0.7)',
            borderBottom: '1px solid rgba(0,0,0,0.8)',
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1 opacity-70"
            style={{
              backgroundImage:
                'repeating-linear-gradient(90deg, rgba(255,43,54,0.8) 0, rgba(255,43,54,0.8) 4px, transparent 4px, transparent 20px)',
            }}
          />
        </div>
        {/* Volcanic basalt block joints with deep magma vein glow */}
        <div
          className="absolute top-3 left-0 right-0 bottom-0 opacity-25"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(255,43,54,0.35) 0, rgba(255,43,54,0.35) 1px, transparent 1px, transparent 52px)',
          }}
        />
      </div>
    );
  }

  // Floating platform (ancient cracked infernal basalt slab)
  return (
    <div
      className="absolute rounded-sm"
      style={{
        left: plat.x,
        top: plat.y,
        width: plat.w,
        height: plat.h,
        background: 'linear-gradient(180deg, #1f080e 0%, #120408 50%, #080204 100%)',
        border: '1px solid rgba(255,43,54,0.25)',
        borderTop: '1.5px solid rgba(255,43,54,0.85)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.95), 0 0 10px rgba(255,43,54,0.25)',
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-sm opacity-80"
        style={{
          background:
            'linear-gradient(90deg, transparent 5%, rgba(255,43,54,0.9) 25%, rgba(255,100,60,0.95) 50%, rgba(255,43,54,0.9) 75%, transparent 95%)',
        }}
      />
      {/* Charred timber bracket anchors underneath with subtle lava heat */}
      <div
        className="absolute -bottom-2 left-3 w-2.5 h-2"
        style={{ background: '#120407', borderBottom: '1px solid rgba(255,43,54,0.4)' }}
      />
      <div
        className="absolute -bottom-2 right-3 w-2.5 h-2"
        style={{ background: '#120407', borderBottom: '1px solid rgba(255,43,54,0.4)' }}
      />
    </div>
  );
});

const SpikeView = memo(function SpikeView({ spike }: { spike: { x: number; y: number; w: number; h: number } }) {
  const count = Math.max(1, Math.floor(spike.w / 14));
  return (
    <div className="absolute pointer-events-none" style={{ left: spike.x, top: spike.y, width: spike.w, height: spike.h }}>
      <svg width={spike.w} height={spike.h} viewBox={`0 0 ${spike.w} ${spike.h}`} preserveAspectRatio="none">
        {Array.from({ length: count }).map((_, i) => (
          <g key={i}>
            <polygon
              points={`${i * 14},${spike.h} ${i * 14 + 7},0 ${i * 14 + 14},${spike.h}`}
              fill="#520c10"
              stroke="#e0252e"
              strokeWidth="0.8"
            />
            <polygon
              points={`${i * 14 + 4},${spike.h} ${i * 14 + 7},3 ${i * 14 + 10},${spike.h}`}
              fill="#8a141a"
              opacity="0.75"
            />
          </g>
        ))}
        {/* Blood-red glowing base ground line */}
        <rect x="0" y={spike.h - 2} width={spike.w} height="2" fill="var(--red-bright)" opacity="0.8" />
      </svg>
    </div>
  );
});

const CoinView = memo(function CoinView({ coin }: { coin: { x: number; y: number; w: number; h: number } }) {
  return (
    <div
      className="absolute anim-coin flex items-center justify-center pointer-events-none"
      style={{ left: coin.x, top: coin.y, width: coin.w, height: coin.h }}
    >
      <div
        className="rounded-full flex items-center justify-center"
        style={{
          width: '18px',
          height: '18px',
          background: 'radial-gradient(circle at 35% 35%, #fff3b0 0%, #e9c46a 55%, #996e1a 100%)',
          boxShadow: '0 0 10px rgba(233,196,106,0.7), 0 0 20px rgba(233,196,106,0.3)',
          border: '1px solid #ffe082',
        }}
      >
        <div style={{ width: '6px', height: '6px', border: '1px solid #785210', borderRadius: '1px' }} />
      </div>
    </div>
  );
});

const CheckpointView = memo(function CheckpointView({ checkpoint }: { checkpoint: { x: number; y: number; w: number; h: number; activated: boolean } }) {
  const { activated } = checkpoint;
  return (
    <div
      className="absolute pointer-events-none select-none flex flex-col items-center justify-end"
      style={{
        left: checkpoint.x - 14,
        top: checkpoint.y - 18,
        width: 58,
        height: checkpoint.h + 18,
        zIndex: 14,
      }}
    >
      {/* Skyward Spirit Pillar / Aura when activated */}
      {activated && (
        <div
          className="absolute -top-28 left-1/2 -translate-x-1/2 w-7 h-40 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(95,179,154,0.4) 0%, rgba(95,179,154,0.08) 60%, transparent 100%)',
            filter: 'blur(5px)',
            animation: 'pulse 2.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Atmospheric Spirit Glow Halo */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-3 rounded-full pointer-events-none transition-all duration-700"
        style={{
          width: activated ? 100 : 36,
          height: activated ? 100 : 36,
          background: activated
            ? 'radial-gradient(circle, rgba(95,179,154,0.5) 0%, rgba(30,120,95,0.18) 50%, transparent 75%)'
            : 'radial-gradient(circle, rgba(74,92,130,0.2) 0%, transparent 70%)',
          filter: activated ? 'blur(6px)' : 'none',
        }}
      />

      {/* Traditional Japanese Stone Lantern (Tōrō / 石灯籠) */}
      <div className="relative w-full flex flex-col items-center">
        {/* 1. Hōju (Sacred Jewel Finial on top of Kasagi roof) */}
        <div className="relative flex flex-col items-center z-10">
          <div
            className="w-2.5 h-3.5 rounded-full border border-stone-800 shadow-sm"
            style={{
              background: activated
                ? 'radial-gradient(circle at 35% 35%, #b4f7e2 0%, #5fb39a 60%, #1e4539 100%)'
                : 'radial-gradient(circle at 35% 35%, #5a667a 0%, #2f394a 60%, #171d27 100%)',
              boxShadow: activated ? '0 0 10px rgba(95,179,154,0.8)' : 'none',
            }}
          />
          <div className="w-4 h-1 bg-[#1a212e] rounded-sm -mt-0.5 border-b border-black/50" />
        </div>

        {/* 2. Kasagi (Curved Japanese Shrine Roof with Upward-swept Eaves) */}
        <div className="relative w-12 h-3.5 z-10 -mt-0.5">
          <svg viewBox="0 0 48 14" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <path
              d="M 2 13 Q 8 8, 24 3 Q 40 8, 46 13 L 43 14 Q 24 6, 5 14 Z"
              fill="#242c3b"
              stroke="#131922"
              strokeWidth="0.8"
            />
            <path
              d="M 6 12 Q 24 5, 42 12"
              fill="none"
              stroke="rgba(239,230,210,0.18)"
              strokeWidth="0.6"
            />
          </svg>
        </div>

        {/* 3. Hibukuro (Carved Fire Chamber / Lantern Housing with Lattice Windows) */}
        <div
          className="relative w-8 h-8 rounded-sm flex items-center justify-center border border-[#131924] shadow-inner -mt-0.5"
          style={{
            background: '#181f2b',
            boxShadow: activated ? 'inset 0 0 14px rgba(95,179,154,0.6)' : 'inset 0 0 8px rgba(0,0,0,0.8)',
          }}
        >
          {/* Internal Spirit Flame / Fire Core */}
          <div
            className={`relative rounded-full flex items-center justify-center transition-all duration-500 ${
              activated ? 'animate-pulse' : ''
            }`}
            style={{
              width: activated ? 18 : 10,
              height: activated ? 20 : 10,
              background: activated
                ? 'radial-gradient(circle at 40% 40%, #ffffff 0%, #7ee8cb 30%, #3ca085 70%, #0d4234 100%)'
                : 'radial-gradient(circle at 40% 40%, #52637f 0%, #293448 65%, #121824 100%)',
              boxShadow: activated
                ? '0 0 16px rgba(126,232,203,0.95), 0 0 28px rgba(95,179,154,0.6)'
                : 'none',
              filter: activated ? 'drop-shadow(0 0 8px #7ee8cb)' : 'none',
            }}
          >
            {activated && (
              <span className="font-jp text-[8px] text-[#0d4234] font-black opacity-80 select-none">
                灯
              </span>
            )}
          </div>

          {/* Wooden / Stone Lattice Cross Grille */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[1.5px] h-full bg-[#131822] shadow-sm" />
            <div className="absolute h-[1.5px] w-full bg-[#131822] shadow-sm" />
          </div>

          {/* Floating Sacred Embers when activated */}
          {activated && (
            <>
              <span className="absolute -top-1 -right-1 w-1 h-1 rounded-full bg-[#7ee8cb] animate-ping opacity-75" />
              <span className="absolute -bottom-1 -left-1 w-1 h-1 rounded-full bg-[#5fb39a] animate-pulse" />
            </>
          )}
        </div>

        {/* 4. Chūdai (Middle Platform Ledge with Lotus Petal Carvings) */}
        <div className="w-10 h-2 bg-[#283243] rounded-sm border-t border-b border-[#131924] shadow-md flex items-center justify-around px-1">
          <div className="w-1 h-0.5 bg-[#171e2a] rounded" />
          <div className="w-1 h-0.5 bg-[#171e2a] rounded" />
          <div className="w-1 h-0.5 bg-[#171e2a] rounded" />
        </div>

        {/* 5. Sao (Hexagonal Stone Pillar bound by Sacred Shimenawa Straw Rope & Shide Talismans) */}
        <div className="relative w-5 h-8 bg-gradient-to-b from-[#252f3f] to-[#1c2432] border-x border-[#121721] flex flex-col items-center justify-between py-1 shadow-inner">
          {/* Shimenawa (Sacred Braided Straw Rope wrapped around column) */}
          <div className="w-6 h-1.5 bg-[#8a724d] rounded-sm border border-[#4a3b22] shadow-sm relative -mt-0.5 flex items-center justify-around px-0.5">
            <div className="w-1 h-1 bg-[#d4b47a] rounded-full" />
            <div className="w-1 h-1 bg-[#d4b47a] rounded-full" />
            <div className="w-1 h-1 bg-[#d4b47a] rounded-full" />
            {/* Shide (Zig-zag white paper talismans hanging from rope) */}
            <div className="absolute top-1.5 left-1 w-1 h-2 bg-[#efe6d2] shadow-sm transform -rotate-6" />
            <div className="absolute top-1.5 right-1 w-1 h-2 bg-[#efe6d2] shadow-sm transform rotate-6" />
          </div>

          {/* Central Sacred Ward Kanji Rune */}
          <span
            className={`font-jp text-[8px] font-bold select-none transition-colors duration-500 ${
              activated ? 'text-[#7ee8cb]' : 'text-[#414d63]'
            }`}
            style={activated ? { textShadow: '0 0 6px rgba(126,232,203,0.9)' } : {}}
          >
            守
          </span>

          <div className="w-full h-0.5 bg-[#141a24]" />
        </div>

        {/* 6. Kiso (Stepped Hexagonal Stone Foundation Base) */}
        <div className="flex flex-col items-center w-full">
          <div className="w-8 h-2 bg-[#222b3a] rounded-t-sm border-t border-[#131922] shadow-sm" />
          <div className="w-11 h-2.5 bg-[#19212d] rounded-sm border-t border-black/60 shadow-md flex items-center justify-center">
            <span
              className={`font-mono text-[7px] tracking-widest font-black uppercase transition-colors duration-500 ${
                activated ? 'text-jade' : 'text-paper-dim/40'
              }`}
            >
              {activated ? 'RESPAWN SET' : 'SHRINE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ---------- Ninja Combo Counter View (Kanji Ranks & 5s Decay Gauge) ---------- */

const NinjaComboCounterView = memo(function NinjaComboCounterView({
  combo,
}: {
  combo: ReturnType<typeof useGameEngine>['render']['combo'];
}) {
  if (!combo || combo.count <= 0 || combo.timer <= 0) return null;

  const pct = Math.max(0, Math.min(100, (combo.timer / combo.maxTimer) * 100));

  let rankTheme = {
    color: '#e5e7eb',
    glow: 'rgba(255,255,255,0.4)',
    border: 'rgba(255,255,255,0.2)',
    kanjiBg: 'rgba(255,255,255,0.1)',
  };

  if (combo.count >= 20) {
    rankTheme = {
      color: '#fbbf24',
      glow: 'rgba(245,158,11,0.8)',
      border: 'rgba(245,158,11,0.6)',
      kanjiBg: 'linear-gradient(135deg, rgba(245,158,11,0.3) 0%, rgba(220,38,38,0.4) 100%)',
    };
  } else if (combo.count >= 15) {
    rankTheme = {
      color: '#ef4444',
      glow: 'rgba(239,68,68,0.8)',
      border: 'rgba(239,68,68,0.5)',
      kanjiBg: 'linear-gradient(135deg, rgba(239,68,68,0.3) 0%, rgba(153,27,27,0.4) 100%)',
    };
  } else if (combo.count >= 10) {
    rankTheme = {
      color: '#f97316',
      glow: 'rgba(249,115,22,0.7)',
      border: 'rgba(249,115,22,0.4)',
      kanjiBg: 'linear-gradient(135deg, rgba(249,115,22,0.25) 0%, rgba(180,83,9,0.3) 100%)',
    };
  } else if (combo.count >= 5) {
    rankTheme = {
      color: '#a855f7',
      glow: 'rgba(168,85,247,0.7)',
      border: 'rgba(168,85,247,0.4)',
      kanjiBg: 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(107,33,168,0.3) 100%)',
    };
  }

  return (
    <div className="absolute top-14 right-4 flex flex-col items-end pointer-events-none select-none z-30 transition-all duration-150">
      {/* Combo Rank Kanji Banner & Hit Count */}
      <div className="flex items-center gap-2">
        <div
          className="px-2 py-0.5 rounded border flex items-center justify-center shadow-lg"
          style={{
            background: rankTheme.kanjiBg,
            borderColor: rankTheme.border,
            boxShadow: `0 0 14px ${rankTheme.glow}`,
          }}
        >
          <span
            className="font-jp text-[13px] font-black tracking-widest"
            style={{ color: rankTheme.color, textShadow: `0 0 8px ${rankTheme.glow}` }}
          >
            {combo.rank}
          </span>
        </div>

        <div className="flex items-baseline gap-1">
          <span
            className="font-display text-2xl sm:text-3xl font-black italic tracking-tighter"
            style={{
              color: rankTheme.color,
              textShadow: `0 0 16px ${rankTheme.glow}, 0 2px 4px rgba(0,0,0,0.9)`,
            }}
          >
            {combo.count}
          </span>
          <span className="font-display text-[10px] tracking-widest text-paper-dim font-bold uppercase">
            HITS
          </span>
        </div>
      </div>

      {/* 5-Second Decay Gauge */}
      <div className="w-28 h-1 bg-black/80 rounded-full overflow-hidden border border-white/10 mt-1 relative">
        <div
          className="h-full transition-all duration-75 ease-linear rounded-full"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, #dc2626 0%, ${rankTheme.color} 100%)`,
            boxShadow: `0 0 8px ${rankTheme.glow}`,
          }}
        />
      </div>

      {/* Finisher Ready Notification Badge (5+ combo) */}
      {combo.finisherReady && (
        <div
          className="mt-1.5 px-2 py-0.5 rounded border flex items-center gap-1.5 animate-bounce shadow-xl"
          style={{
            background: 'linear-gradient(90deg, rgba(220,38,38,0.9) 0%, rgba(245,158,11,0.9) 100%)',
            borderColor: '#fef08a',
            boxShadow: '0 0 16px rgba(245,158,11,0.9)',
          }}
        >
          <span className="text-[10px] animate-ping">⚡</span>
          <span className="font-mono text-[9px] font-black tracking-widest text-yellow-100 uppercase">
            FINISHER: [SHIFT + ATK]
          </span>
          <span className="font-jp text-[9px] font-bold text-yellow-200">必殺</span>
        </div>
      )}
    </div>
  );
});

/* ---------- Cinematic Letterbox (Slow Motion Finisher) ---------- */

const CinematicLetterbox = memo(function CinematicLetterbox({
  slowMotion,
}: {
  slowMotion: ReturnType<typeof useGameEngine>['render']['slowMotion'];
}) {
  const active = slowMotion?.active;
  return (
    <>
      {/* Top Black Cinema Bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-9 bg-black/95 border-b border-red-500/40 z-35 pointer-events-none transition-transform duration-300 ease-out flex items-center justify-between px-6 ${
          active ? 'translate-y-0 shadow-[0_5px_20px_rgba(0,0,0,0.95)]' : '-translate-y-full'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-accent animate-ping" />
          <span className="font-mono text-[9px] tracking-[0.3em] text-red-400 uppercase font-black">
            CINEMATIC FINISHER // 一撃必殺
          </span>
        </div>
        <span className="font-jp text-[9px] text-paper-dim/80 tracking-[0.25em]">
          影疾空斬・刹那の時空
        </span>
      </div>

      {/* Bottom Black Cinema Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-9 bg-black/95 border-t border-red-500/40 z-35 pointer-events-none transition-transform duration-300 ease-out flex items-center justify-between px-6 ${
          active ? 'translate-y-0 shadow-[0_-5px_20px_rgba(0,0,0,0.95)]' : 'translate-y-full'
        }`}
      >
        <span className="font-display text-[9px] tracking-[0.35em] text-paper-dim/80 uppercase font-semibold">
          TIME DILATION: 0.28x
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono text-[9px] tracking-[0.22em] text-amber-300 font-black uppercase">
            EXECUTION STRIKE
          </span>
        </div>
      </div>

      {/* Chromatic Vignette Flash during finisher slow-mo */}
      {active && (
        <div
          className="absolute inset-0 pointer-events-none z-20 transition-opacity duration-200"
          style={{
            background: 'radial-gradient(circle at center, transparent 40%, rgba(220,38,38,0.2) 75%, rgba(0,0,0,0.6) 100%)',
          }}
        />
      )}
    </>
  );
});

/* ---------- Trophy Banner Notification View ---------- */

const TrophyBannerView = memo(function TrophyBannerView({
  notification,
}: {
  notification: ReturnType<typeof useGameEngine>['render']['trophyNotification'];
}) {
  if (!notification) return null;

  const isTrophy = notification.type === 'trophy';
  const isMissed = notification.type === 'missed';

  return (
    <div className="absolute top-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4 duration-300">
      <div
        className="p-3.5 rounded-lg border shadow-2xl flex flex-col gap-1 backdrop-blur-md relative overflow-hidden"
        style={{
          background: isTrophy
            ? 'linear-gradient(135deg, rgba(24,20,10,0.95) 0%, rgba(45,28,10,0.98) 100%)'
            : isMissed
            ? 'linear-gradient(135deg, rgba(30,10,12,0.95) 0%, rgba(18,7,9,0.98) 100%)'
            : 'linear-gradient(135deg, rgba(25,12,35,0.95) 0%, rgba(15,7,25,0.98) 100%)',
          borderColor: isTrophy
            ? '#eab308'
            : isMissed
            ? '#ef4444'
            : '#a855f7',
          boxShadow: isTrophy
            ? '0 0 30px rgba(234,179,8,0.5), 0 0 60px rgba(220,38,38,0.3)'
            : isMissed
            ? '0 0 30px rgba(239,68,68,0.5), 0 0 60px rgba(0,0,0,0.9)'
            : '0 0 30px rgba(168,85,247,0.5), 0 0 60px rgba(239,68,68,0.3)',
        }}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">
              {isTrophy ? '🏆' : isMissed ? '⚠️' : '✨'}
            </span>
            <span
              className="font-mono text-[10px] font-black tracking-widest uppercase"
              style={{
                color: isTrophy ? '#fde047' : isMissed ? '#fca5a5' : '#e9d5ff',
              }}
            >
              {notification.title}
            </span>
          </div>
          <span
            className="font-jp text-[10px] font-bold"
            style={{ color: isTrophy ? '#fde047' : isMissed ? '#f87171' : '#c084fc' }}
          >
            {isTrophy ? '免許皆伝' : isMissed ? '注意' : '秘奥義'}
          </span>
        </div>

        {/* Message Content */}
        <p className="font-sans text-[11px] text-paper-dim/95 leading-relaxed tracking-wide mt-0.5">
          {notification.message}
        </p>

        {/* Bottom Glow Accent Line */}
        <div
          className="h-0.5 w-full rounded-full mt-1.5"
          style={{
            background: isTrophy
              ? 'linear-gradient(90deg, transparent 0%, #eab308 50%, transparent 100%)'
              : isMissed
              ? 'linear-gradient(90deg, transparent 0%, #ef4444 50%, transparent 100%)'
              : 'linear-gradient(90deg, transparent 0%, #a855f7 50%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
});

/* ---------- Yunami Jigoku Ancient Portal Trial Modal ---------- */

const YunamiPortalPromptModal = memo(function YunamiPortalPromptModal({
  prompt,
  onStay,
  onProceed,
}: {
  prompt: NonNullable<ReturnType<typeof useGameEngine>['render']['portalPrompt']>;
  onStay: () => void;
  onProceed: () => void;
}) {
  const isComplete = prompt.hasBonusSkill || prompt.kills >= prompt.requiredKills;
  const remaining = Math.max(0, prompt.requiredKills - prompt.kills);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Outer Glow Tint */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isComplete
            ? 'radial-gradient(ellipse at center, rgba(233,196,106,0.12) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(255,59,70,0.14) 0%, transparent 70%)',
        }}
      />

      <div
        className="relative z-10 w-full max-w-lg p-6 sm:p-8 rounded-2xl border shadow-2xl flex flex-col items-center text-center overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, rgba(20,26,42,0.96) 0%, rgba(10,13,22,0.98) 100%)',
          borderColor: isComplete ? 'rgba(233,196,106,0.4)' : 'rgba(255,59,70,0.45)',
          boxShadow: isComplete
            ? '0 0 50px rgba(0,0,0,0.9), 0 0 30px rgba(233,196,106,0.2)'
            : '0 0 50px rgba(0,0,0,0.9), 0 0 30px rgba(255,59,70,0.25)',
        }}
      >
        {/* Pulsing Icon Ring */}
        <div className="mb-4">
          <div className="relative">
            <div
              className="absolute inset-0 anim-pulse-ring rounded-full border opacity-50"
              style={{ borderColor: isComplete ? 'var(--gold)' : 'var(--red-bright)' }}
            />
            <div
              className="flex items-center justify-center w-16 h-16 rounded-full shadow-inner"
              style={{
                background: isComplete ? 'rgba(233,196,106,0.12)' : 'rgba(255,59,70,0.12)',
                border: `2px solid ${isComplete ? 'var(--gold)' : 'var(--red-bright)'}`,
              }}
            >
              {isComplete ? (
                <CheckCircle size={32} className="text-gold" />
              ) : (
                <AlertTriangle size={32} className="text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Japanese Subtitle Ribbon */}
        <div className="flex items-center gap-3 mb-2">
          <span className="h-px w-8 bg-gold opacity-60" />
          <span className="font-jp text-xs text-gold tracking-[0.3em]">
            {isComplete ? '試練達成・免許皆伝' : '試練未達・血風の伝承'}
          </span>
          <span className="h-px w-8 bg-gold opacity-60" />
        </div>

        {/* Main Title */}
        <h2 className="font-display text-2xl sm:text-3xl font-black tracking-wider text-paper leading-tight">
          {isComplete ? (
            <>
              BONUS SKILL <span className="text-gold" style={{ textShadow: '0 0 25px rgba(233,196,106,0.5)' }}>UNLOCKED</span>
            </>
          ) : (
            <>
              TRIAL <span className="text-red-400" style={{ textShadow: '0 0 25px rgba(255,59,70,0.5)' }}>INCOMPLETE</span>
            </>
          )}
        </h2>

        {/* Descriptive Text matching user's trial message */}
        <p className="mt-3 text-paper-dim text-xs sm:text-[13px] max-w-md leading-relaxed">
          {isComplete
            ? `Mastery of Yunami Jigoku (${prompt.kills}/10 Kills achieved)! You have awakened the sacred Blood Spin Slash. Hold [Attack] to execute a 360° sweeping crimson vortex!`
            : `You defeated only ${prompt.kills}/10 enemies in Yunami Jigoku! The sacred Blood Spin Slash remained sealed. This attack would be vital against Hanzo in the abyss!`}
        </p>

        {/* Stats & Progress Box */}
        <div
          className="w-full my-4 p-4 rounded-xl space-y-3"
          style={{
            background: 'rgba(11,15,25,0.7)',
            border: `1px solid ${isComplete ? 'rgba(233,196,106,0.25)' : 'rgba(255,59,70,0.25)'}`,
            backdropFilter: 'blur(6px)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Swords size={15} className={isComplete ? 'text-gold' : 'text-red-400'} />
              <span className="font-display text-[11px] tracking-widest text-paper-dim">ENEMIES SLAIN</span>
            </div>
            <span className={`font-mono text-sm sm:text-base font-bold tabular-nums ${isComplete ? 'text-gold' : 'text-red-400'}`}>
              {prompt.kills} / {prompt.requiredKills}
            </span>
          </div>

          {/* Kill Progress Bar */}
          <div className="w-full h-2 rounded-full bg-black/70 overflow-hidden border border-white/10 relative">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (prompt.kills / prompt.requiredKills) * 100)}%`,
                background: isComplete
                  ? 'linear-gradient(90deg, #ca8a04 0%, #eab308 50%, #fde047 100%)'
                  : 'linear-gradient(90deg, #991b1b 0%, #ef4444 60%, #f87171 100%)',
                boxShadow: isComplete
                  ? '0 0 12px rgba(234,179,8,0.7)'
                  : '0 0 12px rgba(239,68,68,0.7)',
              }}
            />
          </div>

          <div className="h-px bg-gold opacity-15" />

          <div className="flex items-center justify-between text-left">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-gold" />
              <span className="font-display text-[11px] tracking-widest text-paper-dim">TECHNIQUE</span>
            </div>
            <span className="font-display text-[11px] font-bold text-paper">
              BLOOD SPIN SLASH (360° VORTEX)
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-paper-dim/80 font-sans">Condition:</span>
            <span className={isComplete ? 'text-gold font-bold' : 'text-amber-400 font-medium'}>
              {isComplete ? '✓ Trial Complete' : `Defeat ${remaining} more ${remaining === 1 ? 'enemy' : 'enemies'} in Yunami`}
            </span>
          </div>
        </div>

        {/* Question Prompt */}
        <p className="text-paper text-xs sm:text-sm font-semibold tracking-wide mb-5">
          {isComplete
            ? 'Do you want to descend into CHINOIKE JIGOKU, or stay in YUNAMI JIGOKU?'
            : 'Do you want to stay in YUNAMI JIGOKU to get the bonus skill, or proceed to CHINOIKE JIGOKU?'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={onStay}
            className="flex-1 w-full py-3 px-4 rounded font-display text-xs font-bold tracking-[0.16em] flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer shadow-lg hover:brightness-110"
            style={{
              background: !isComplete
                ? 'linear-gradient(135deg, rgba(233,196,106,0.22) 0%, rgba(233,196,106,0.08) 100%)'
                : 'rgba(255,255,255,0.06)',
              border: !isComplete
                ? '2px solid var(--gold)'
                : '1px solid rgba(239,230,210,0.25)',
              color: !isComplete ? 'var(--gold)' : 'var(--paper-dim)',
              boxShadow: !isComplete ? '0 0 20px rgba(233,196,106,0.3)' : 'none',
            }}
          >
            <RotateCcw size={15} />
            STAY IN YUNAMI JIGOKU
          </button>

          <button
            onClick={onProceed}
            className="flex-1 w-full py-3 px-4 rounded font-display text-xs font-bold tracking-[0.16em] flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer shadow-lg hover:brightness-110"
            style={{
              background: isComplete
                ? 'linear-gradient(135deg, var(--gold) 0%, #ca8a04 100%)'
                : 'linear-gradient(135deg, var(--red) 0%, var(--red-deep) 100%)',
              border: isComplete
                ? '1px solid rgba(253,224,71,0.6)'
                : '1px solid rgba(255,59,70,0.5)',
              color: isComplete ? '#0a0d16' : 'var(--paper)',
              boxShadow: isComplete
                ? '0 0 20px rgba(234,179,8,0.4)'
                : '0 4px 16px rgba(122,19,24,0.4)',
            }}
          >
            <ArrowRight size={15} />
            {isComplete ? 'ENTER CHINOIKE JIGOKU' : 'PROCEED ANYWAY'}
          </button>
        </div>

        {/* Footer Emblem */}
        <div className="mt-4 opacity-40">
          <EmblemMark size={20} />
        </div>
      </div>
    </div>
  );
});

/* ---------- Ninja Techniques Hotbar ---------- */

const NinjaTechniquesHotbar = memo(function NinjaTechniquesHotbar({
  unlockedSkills,
  combo,
}: {
  unlockedSkills: ReturnType<typeof useGameEngine>['render']['unlockedSkills'];
  combo: ReturnType<typeof useGameEngine>['render']['combo'];
}) {
  return (
    <div className="absolute bottom-2 left-4 flex items-center gap-2 pointer-events-none select-none z-30">
      {/* Skill 1: Crimson Slash Combo */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/75 border border-white/10 shadow-md">
        <span className="px-1 py-0.2 rounded bg-white/10 font-mono text-[8px] font-bold text-yellow-400">
          W+ATK
        </span>
        <span className="font-display text-[8px] font-bold tracking-wider text-paper-dim">
          SLASH COMBO
        </span>
      </div>

      {/* Skill 2: Finisher Shadow Dash Strike */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded border shadow-md transition-all duration-200 ${
          combo.finisherReady
            ? 'bg-red-950/90 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse'
            : 'bg-black/75 border-white/10 opacity-60'
        }`}
      >
        <span className={`px-1 py-0.2 rounded font-mono text-[8px] font-black ${combo.finisherReady ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/60'}`}>
          SHIFT+ATK
        </span>
        <span className="font-display text-[8px] font-bold tracking-wider text-paper">
          FINISHER
        </span>
        {combo.finisherReady ? (
          <span className="font-jp text-[8px] font-bold text-amber-300">必殺</span>
        ) : (
          <span className="font-mono text-[7px] text-paper-dim/60">(5+ COMBO)</span>
        )}
      </div>

      {/* Skill 3: Blood Spin Slash */}
      <div
        className={`flex items-center gap-1.5 px-2 py-1 rounded border shadow-md transition-all duration-200 ${
          unlockedSkills.bloodSpinSlash
            ? 'bg-black/75 border-red-500/50 text-paper'
            : 'bg-black/50 border-white/5 opacity-40'
        }`}
      >
        <span className={`px-1 py-0.2 rounded font-mono text-[8px] font-bold ${unlockedSkills.bloodSpinSlash ? 'bg-red-500/20 text-red-300' : 'bg-white/5 text-white/40'}`}>
          HOLD ATK
        </span>
        <span className="font-display text-[8px] font-bold tracking-wider text-paper-dim">
          {unlockedSkills.bloodSpinSlash ? 'BLOOD SPIN' : 'LOCKED (10 KILLS)'}
        </span>
      </div>

      {/* Skill 4: Crimson Blade Wave */}
      {unlockedSkills.crimsonBladeWave && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/75 border border-purple-500/60 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
          <span className="px-1 py-0.2 rounded bg-purple-500/20 font-mono text-[8px] font-bold text-purple-300">
            C
          </span>
          <span className="font-display text-[8px] font-bold tracking-wider text-paper">
            BLADE WAVE
          </span>
          <span className="font-jp text-[8px] font-bold text-purple-300">秘奥</span>
        </div>
      )}

      {/* Skill: Aerial Kick (Anti-Air Wyvern Strike) */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-black/75 border border-cyan-500/50 shadow-md">
        <span className="px-1 py-0.2 rounded bg-cyan-500/20 font-mono text-[8px] font-bold text-cyan-300">
          Q
        </span>
        <span className="font-display text-[8px] font-bold tracking-wider text-paper-dim">
          AERIAL KICK
        </span>
      </div>
    </div>
  );
});

/* ---------- Collectible Shuriken (Floating 4-Point Steel Star) ---------- */

const CollectibleShurikenView = memo(function CollectibleShurikenView({ shuriken }: { shuriken: CollectibleShuriken }) {
  return (
    <div
      className="absolute pointer-events-none select-none flex items-center justify-center"
      style={{
        left: shuriken.x,
        top: shuriken.y,
        width: shuriken.w,
        height: shuriken.h,
        zIndex: 5,
      }}
    >
      {/* Soft ethereal glowing halo */}
      <div
        className="absolute w-8 h-8 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(255, 60, 70, 0.45) 0%, rgba(239, 230, 210, 0.2) 50%, transparent 75%)',
          filter: 'blur(4px)',
          animation: 'pulse 1.8s ease-in-out infinite alternate',
        }}
      />

      {/* Hovering & Spinning 4-Point Ninja Shuriken */}
      <div
        className="w-full h-full flex items-center justify-center"
        style={{
          animation: 'spin 3s linear infinite',
          filter: 'drop-shadow(0 0 6px rgba(255, 70, 80, 0.9)) drop-shadow(0 0 10px rgba(239, 230, 210, 0.4))',
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
          {/* 4 Curved razor blades */}
          <path
            d="M12 2 L14 8.5 L20.5 6 L15.5 12 L22 14 L15.5 16 L17 22 L12 17 L8.5 22 L9.5 15.5 L3 14 L9.5 12 L4 8.5 L10.5 9.5 Z"
            fill="url(#collectibleShurikenGrad)"
            stroke="#ffffff"
            strokeWidth="0.6"
          />
          {/* Center ring */}
          <circle cx="12" cy="12" r="3.5" fill="#150508" stroke="#ff4d4d" strokeWidth="0.8" />
          <circle cx="12" cy="12" r="1.8" fill="#000000" />
          <defs>
            <linearGradient id="collectibleShurikenGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#e8e8ea" />
              <stop offset="70%" stopColor="#9a9aa2" />
              <stop offset="100%" stopColor="#ff5555" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Floating Sparkle / Blade Glint */}
      <div
        className="absolute -top-1 right-0 w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-75"
        style={{ animationDuration: '2.5s' }}
      />
    </div>
  );
});

/* ---------- Hell Chasm Pits (Volcanic Chasms, Molten Lava & Infernal Flames) ---------- */

interface HellPitConfig {
  id: number;
  x: number;
  w: number;
  intensity: 'early' | 'mid' | 'late' | 'abyssal';
  flameCount: number;
  label: string;
}

const HELL_PITS: HellPitConfig[] = [
  { id: 1, x: 620, w: 140, intensity: 'early', flameCount: 4, label: 'Temple Approach Chasm' },
  { id: 2, x: 1320, w: 100, intensity: 'early', flameCount: 3, label: 'Mastaba Descent Gap' },
  { id: 3, x: 1840, w: 120, intensity: 'early', flameCount: 4, label: 'Ascent Trench' },
  { id: 5, x: 3240, w: 320, intensity: 'mid', flameCount: 9, label: 'The Great Temple Abyss' },
  { id: 6, x: 4220, w: 100, intensity: 'mid', flameCount: 4, label: 'Sanctum Threshold Pit' },
  { id: 7, x: 4920, w: 160, intensity: 'late', flameCount: 6, label: 'Volcanic Sanctum Hell Pit' },
  { id: 8, x: 5540, w: 80, intensity: 'late', flameCount: 3, label: 'Basalt Pillars Deep Gap' },
  { id: 9, x: 5860, w: 200, intensity: 'abyssal', flameCount: 8, label: 'The Abyssal Rift of Shinoki' },
];

const HellChasmPitsView = memo(function HellChasmPitsView() {
  return (
    <>
      {HELL_PITS.map((pit) => (
        <SingleHellPitView key={`hell-pit-${pit.id}`} pit={pit} />
      ))}
    </>
  );
});

const SingleHellPitView = memo(function SingleHellPitView({ pit }: { pit: HellPitConfig }) {
  const { x, w, intensity, flameCount } = pit;

  // Flame sizing & positioning based on intensity
  const flameBaseH =
    intensity === 'early' ? 26 : intensity === 'mid' ? 34 : intensity === 'late' ? 42 : 50;

  const lavaDepthH =
    intensity === 'early' ? 28 : intensity === 'mid' ? 34 : intensity === 'late' ? 38 : 44;

  const glowOpacity =
    intensity === 'early' ? 0.35 : intensity === 'mid' ? 0.5 : intensity === 'late' ? 0.7 : 0.85;

  const wallW = Math.min(22, Math.max(14, Math.floor(w * 0.15)));

  return (
    <div
      className="absolute pointer-events-none select-none overflow-visible"
      style={{
        left: x,
        top: 598,
        width: w,
        height: 122,
        zIndex: 2,
      }}
    >
      {/* 1. Upward Infernal Light Spill onto underside of adjacent platforms */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -45,
          left: -20,
          width: w + 40,
          height: 60,
          background: `radial-gradient(ellipse at bottom center, rgba(255,43,54,${glowOpacity}) 0%, rgba(255,100,40,${glowOpacity * 0.5}) 45%, transparent 75%)`,
          filter: 'blur(10px)',
        }}
      />

      {/* 2. Deep Chasm Abyssal Gradient (Descending into darkness & fire) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(4,1,2,0.92) 0%, rgba(14,2,5,0.7) 35%, rgba(60,6,12,0.85) 75%, rgba(180,20,30,0.95) 100%)',
        }}
      />

      {/* 3. Left Basalt Chasm Wall with Glowing Magma Fissure */}
      <div
        className="absolute top-0 bottom-0 left-0"
        style={{ width: `${wallW}px` }}
      >
        <svg viewBox="0 0 24 122" preserveAspectRatio="none" className="w-full h-full">
          {/* Jagged basalt rock edge */}
          <polygon
            points="0,0 20,0 14,25 22,48 12,72 24,96 16,122 0,122"
            fill="#090204"
          />
          <polygon
            points="0,0 14,0 8,28 16,52 6,76 15,98 8,122 0,122"
            fill="#150508"
          />
          {/* Glowing molten vein running down rock face */}
          <path
            d="M8,2 Q16,35 10,65 Q18,95 12,122"
            stroke="rgba(255,43,54,0.75)"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </div>

      {/* 4. Right Basalt Chasm Wall with Glowing Magma Fissure */}
      <div
        className="absolute top-0 bottom-0 right-0"
        style={{ width: `${wallW}px` }}
      >
        <svg viewBox="0 0 24 122" preserveAspectRatio="none" className="w-full h-full">
          {/* Mirrored jagged basalt rock edge */}
          <polygon
            points="24,0 4,0 10,25 2,48 12,72 0,96 8,122 24,122"
            fill="#090204"
          />
          <polygon
            points="24,0 10,0 16,28 8,52 18,76 9,98 16,122 24,122"
            fill="#150508"
          />
          {/* Glowing molten vein */}
          <path
            d="M16,2 Q8,35 14,65 Q6,95 12,122"
            stroke="rgba(255,43,54,0.75)"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      </div>

      {/* 5. Molten Lava Bed at Chasm Bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{
          height: `${lavaDepthH}px`,
        }}
      >
        {/* Glowing Molten Lava Core with Pulsing Glow */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #ff2332 0%, #ff6822 40%, #ffa528 75%, #ff3b15 100%)',
            boxShadow: '0 0 16px rgba(255,43,54,0.9), inset 0 2px 6px rgba(255,220,100,0.8)',
            animation: 'lava-pulse-glow 3s ease-in-out infinite',
          }}
        />

        {/* Floating Dark Basalt Crust Plates with Lava Cracks */}
        <svg
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full opacity-65 mix-blend-multiply"
        >
          <path
            d="M0,8 Q20,14 40,6 Q60,16 80,8 Q95,12 100,5 L100,40 L0,40 Z"
            fill="#260307"
          />
          {/* Cracks in the crust */}
          <path
            d="M15,10 Q25,25 35,40 M65,8 Q55,24 50,40 M85,10 Q80,22 85,40"
            stroke="#ff3842"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>

        {/* Magma Heat Bubbles */}
        <div
          className="absolute rounded-full"
          style={{
            bottom: '12px',
            left: '30%',
            width: '8px',
            height: '8px',
            background: 'radial-gradient(circle, #ffe082 0%, #ff4d4d 70%, transparent 100%)',
            animation: 'pulse 1.8s ease-in-out infinite alternate',
          }}
        />
        {w > 120 && (
          <div
            className="absolute rounded-full"
            style={{
              bottom: '10px',
              left: '65%',
              width: '10px',
              height: '10px',
              background: 'radial-gradient(circle, #fff3b0 0%, #ff6822 75%, transparent 100%)',
              animation: 'pulse 2.4s ease-in-out 0.8s infinite alternate',
            }}
          />
        )}
      </div>

      {/* 6. Infernal Supernatural Hell Flames (Rising upward from lava) */}
      <div
        className="absolute left-3 right-3 flex items-end justify-around pointer-events-none"
        style={{
          bottom: `${lavaDepthH - 8}px`,
          height: `${flameBaseH + 12}px`,
        }}
      >
        {Array.from({ length: flameCount }).map((_, fi) => {
          const flameH = flameBaseH + ((fi % 3) - 1) * 6;
          const flameW = Math.max(12, Math.min(22, Math.floor(w / (flameCount + 1))));
          const animDelay = (fi * 0.28) % 1.2;

          return (
            <div
              key={`flame-${fi}`}
              className="relative"
              style={{
                width: `${flameW}px`,
                height: `${flameH}px`,
                animation: `hell-flame-flicker ${1.1 + (fi % 3) * 0.25}s ease-in-out ${animDelay}s infinite`,
                transformOrigin: 'bottom center',
              }}
            >
              <svg viewBox="0 0 20 40" preserveAspectRatio="none" className="w-full h-full">
                {/* Outer Crimson Hellfire */}
                <path
                  d="M10,0 Q18,14 17,28 Q15,40 10,40 Q5,40 3,28 Q2,14 10,0 Z"
                  fill="url(#hellFlameGradOuter)"
                  filter="url(#pitFlameGlow)"
                />
                {/* Inner Bright Orange/Yellow Core */}
                <path
                  d="M10,8 Q15,18 14,30 Q13,40 10,40 Q7,40 6,30 Q5,18 10,8 Z"
                  fill="url(#hellFlameGradInner)"
                />
              </svg>
            </div>
          );
        })}
      </div>

      {/* 7. Rising Pit Embers & Sparks */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: Math.min(4, Math.floor(w / 35)) }).map((_, ei) => (
          <span
            key={`pit-ember-${ei}`}
            className="absolute rounded-full"
            style={{
              left: `${15 + (ei * 70) / Math.max(1, Math.floor(w / 35))}%`,
              bottom: `${lavaDepthH}px`,
              width: '2.5px',
              height: '2.5px',
              background: ei % 2 === 0 ? '#ff2b36' : '#ffaa30',
              boxShadow: '0 0 4px #ff3842',
              animation: `pit-ember-rise ${2 + (ei % 2) * 0.7}s ease-out ${ei * 0.6}s infinite`,
              ['--drift' as string]: `${((ei % 2 === 0 ? 1 : -1) * (6 + ei * 3))}px`,
            }}
          />
        ))}

        {/* Rising subtle dark smoke puff */}
        <div
          className="absolute left-1/2 -translate-x-1/2 rounded-full opacity-30"
          style={{
            bottom: `${lavaDepthH + 6}px`,
            width: `${Math.min(50, w * 0.6)}px`,
            height: '35px',
            background: 'radial-gradient(ellipse at center, rgba(60,8,12,0.8) 0%, rgba(20,2,4,0.3) 60%, transparent 80%)',
            filter: 'blur(8px)',
            animation: 'pit-smoke-rise 3.2s ease-out infinite',
          }}
        />
      </div>

      {/* Shared SVG Filters / Gradients definitions */}
      <svg className="absolute w-0 h-0" aria-hidden="true">
        <defs>
          <linearGradient id="hellFlameGradOuter" x1="0" y1="0" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff2030" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#e0121d" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#66050b" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="hellFlameGradInner" x1="0" y1="8" x2="0" y2="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fff099" stopOpacity="1" />
            <stop offset="40%" stopColor="#ff7a20" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ff2b36" stopOpacity="0.8" />
          </linearGradient>
          <filter id="pitFlameGlow" x="-30%" y="-20%" width="160%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
});

/* ---------- Yunami Jigoku Environment (Volcanic Landmarks, Vents & Fissures) ---------- */

const YunamiEnvironmentDetails = memo(function YunamiEnvironmentDetails() {
  // Environmental composition anchors specified across the 6600px hell level
  const landmarks = [
    { x: 340, y: 585, type: 'steam_vent', label: 'Steam Vent' },
    { x: 950, y: 585, type: 'volcanic_crack', label: 'First Volcanic Crack' },
    { x: 1520, y: 585, type: 'corrupted_shrine', label: 'Corrupted Shrine Fissure' },
    { x: 2400, y: 585, type: 'boiling_lava', label: 'Boiling Lava Gap' },
    { x: 3100, y: 585, type: 'ruined_structure', label: 'Ruined Temple Fissure' },
    { x: 4440, y: 585, type: 'hell_fissure', label: 'Large Hell Fissure' },
    { x: 5200, y: 585, type: 'basalt_temple', label: 'Basalt Temple Glyph' },
    { x: 5800, y: 585, type: 'abyssal_rift', label: 'Abyssal Rift Caldera' },
    { x: 6300, y: 585, type: 'portal_approach', label: 'Portal Sanctuary Altar' },
  ];

  return (
    <>
      {landmarks.map((lm, i) => (
        <div
          key={`landmark-${i}`}
          className="absolute pointer-events-none select-none"
          style={{
            left: lm.x - 30,
            top: lm.y - 75,
            width: '60px',
            height: '85px',
            zIndex: 4,
          }}
        >
          {/* Glowing subterranean magma pool / fissure base */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
            style={{
              width: lm.type === 'hell_fissure' || lm.type === 'abyssal_rift' ? '54px' : '36px',
              height: '5px',
              background: 'radial-gradient(ellipse at center, #ff2332 0%, #d41724 50%, #4a0307 90%, transparent 100%)',
              boxShadow:
                lm.type === 'hell_fissure' || lm.type === 'abyssal_rift'
                  ? '0 0 20px rgba(255,43,54,0.95), 0 0 35px rgba(255,80,40,0.7)'
                  : '0 0 12px rgba(255,43,54,0.85), 0 0 20px rgba(220,20,30,0.5)',
            }}
          />

          {/* Rising volcanic steam / smoke column */}
          <div
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-t-full"
            style={{
              width: lm.type === 'hell_fissure' || lm.type === 'abyssal_rift' ? '28px' : '16px',
              height: lm.type === 'hell_fissure' || lm.type === 'abyssal_rift' ? '68px' : '52px',
              background:
                'linear-gradient(0deg, rgba(255,50,60,0.65) 0%, rgba(180,20,30,0.3) 50%, rgba(30,10,15,0.1) 85%, transparent 100%)',
              filter: 'blur(7px)',
              animation: `pulse ${2.2 + (i % 3) * 0.5}s ease-in-out infinite alternate`,
            }}
          />

          {/* Cracked charred basalt rock formation flanking the fissure */}
          <div
            className="absolute bottom-0 -left-1 w-3.5 h-3 rounded-sm opacity-90"
            style={{
              background: 'linear-gradient(135deg, #1f070c 0%, #0d0204 100%)',
              borderTop: '1px solid rgba(255,43,54,0.5)',
            }}
          />
          <div
            className="absolute bottom-0 -right-1 w-3 h-2.5 rounded-sm opacity-90"
            style={{
              background: 'linear-gradient(225deg, #1f070c 0%, #0d0204 100%)',
              borderTop: '1px solid rgba(255,43,54,0.4)',
            }}
          />

          {/* Cursed Demon Rune Seal mark on landmark 5200 (Basalt Temple) and 6300 (Sanctuary) */}
          {(lm.type === 'basalt_temple' || lm.type === 'portal_approach') && (
            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 font-jp text-[8px] font-black text-red-accent select-none animate-pulse"
              style={{
                textShadow: '0 0 6px rgba(255,43,54,0.95)',
                opacity: 0.8,
              }}
            >
              {lm.type === 'basalt_temple' ? '獄' : '冥'}
            </div>
          )}
        </div>
      ))}
    </>
  );
});

/* ---------- Blood Pond (Lethal Supernatural Crimson Abyss Hazard) ---------- */

const BloodPondsView = memo(function BloodPondsView({ bloodPonds }: { bloodPonds: Rect[] }) {
  if (!bloodPonds || bloodPonds.length === 0) return null;

  return (
    <>
      {bloodPonds.map((bp, idx) => (
        <div
          key={`blood-pond-${idx}`}
          className="absolute pointer-events-none select-none overflow-hidden"
          style={{
            left: bp.x,
            top: bp.y,
            width: bp.w,
            height: bp.h,
            zIndex: 6,
          }}
        >
          {/* Deep Viscous Blood Liquid Body */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, #590408 0%, #2e0204 40%, #150002 85%, #050001 100%)',
              boxShadow: 'inset 0 4px 15px rgba(255, 43, 54, 0.7), 0 0 35px rgba(255, 30, 40, 0.5)',
            }}
          />

          {/* Seamless Repeating Glowing Blood Surface Waves (Undulates across entire map) */}
          <div
            className="absolute top-0 left-0 w-full h-8 overflow-hidden pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='32' viewBox='0 0 240 32'%3E%3Cpath d='M0,8 Q60,2 120,8 T240,8 L240,32 L0,32 Z' fill='rgba(255,43,54,0.65)'/%3E%3Cpath d='M0,6 Q60,0 120,6 T240,6' stroke='%23ff8088' stroke-width='2.5' fill='none' opacity='0.85'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat-x',
              backgroundSize: '240px 32px',
              filter: 'drop-shadow(0 0 8px rgba(255,43,54,0.75))',
            }}
          />

          {/* Bubbling Boiling Blood Effervescence across the Blood Sea */}
          {Array.from({ length: 36 }).map((_, bIdx) => (
            <div
              key={`bubble-${bIdx}`}
              className="absolute rounded-full pointer-events-none animate-ping"
              style={{
                left: `${(bIdx * 2.8 + (bIdx % 5) * 0.3)}%`,
                top: `${8 + (bIdx % 4) * 6}px`,
                width: `${4 + (bIdx % 3) * 3}px`,
                height: `${4 + (bIdx % 3) * 3}px`,
                background: 'radial-gradient(circle, #ff6670 0%, #aa0a14 70%, transparent 100%)',
                animationDuration: `${1.4 + (bIdx % 5) * 0.4}s`,
                animationDelay: `${(bIdx * 0.25) % 2}s`,
                opacity: 0.75,
              }}
            />
          ))}

          {/* Rising Supernatural Blood Vapor Plume */}
          <div
            className="absolute top-0 inset-x-0 h-16 pointer-events-none anim-fog-slow"
            style={{
              background: 'linear-gradient(0deg, transparent 0%, rgba(255, 35, 45, 0.35) 60%, transparent 100%)',
              filter: 'blur(10px)',
            }}
          />

          {/* Ominous Abyssal Kanji Glyph floating in the blood center */}
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 font-jp text-4xl font-black text-red-accent/25 select-none pointer-events-none"
            style={{ textShadow: '0 0 20px rgba(255, 43, 54, 0.6)' }}
          >
            血池
          </div>
        </div>
      ))}
    </>
  );
});

/* ---------- Atmospheric Supernatural Blood Rain Weather (Chinoike Jigoku) ---------- */

interface BloodRainDrop {
  id: number;
  left: number;
  top: number;
  height: number;
  width: number;
  opacity: number;
  duration: number;
  delay: number;
  angle: number;
  drift: number;
  blur: number;
  color: string;
}

const BLOOD_RAIN_DROPS: BloodRainDrop[] = Array.from({ length: 75 }).map((_, i) => {
  const seed1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  const rand1 = seed1 - Math.floor(seed1);
  const seed2 = Math.sin((i + 31) * 39.346 + 11.135) * 23421.631;
  const rand2 = seed2 - Math.floor(seed2);
  const seed3 = Math.sin((i + 77) * 71.123 + 45.678) * 54321.987;
  const rand3 = seed3 - Math.floor(seed3);

  const isForeground = i % 3 === 0;
  const isDistant = i % 4 === 0;

  return {
    id: i,
    left: rand1 * 105 - 2.5,
    top: -50 - rand2 * 100,
    height: isForeground ? 32 + rand2 * 28 : isDistant ? 14 + rand2 * 14 : 22 + rand2 * 20,
    width: isForeground ? 2.2 : isDistant ? 1.0 : 1.5,
    opacity: isForeground ? 0.85 + rand3 * 0.15 : isDistant ? 0.35 + rand3 * 0.25 : 0.6 + rand3 * 0.3,
    duration: isForeground ? 0.65 + rand2 * 0.35 : isDistant ? 1.2 + rand2 * 0.6 : 0.85 + rand2 * 0.4,
    delay: -(rand3 * 2.5),
    angle: -14 - rand1 * 6,
    drift: -35 - rand2 * 25,
    blur: isDistant ? 0.8 : 0,
    color: isForeground
      ? 'linear-gradient(180deg, rgba(255, 60, 75, 0) 0%, rgba(220, 20, 40, 0.9) 70%, rgba(255, 90, 110, 1) 100%)'
      : 'linear-gradient(180deg, rgba(180, 20, 30, 0) 0%, rgba(160, 15, 25, 0.75) 75%, rgba(210, 30, 45, 0.9) 100%)',
  };
});

const BloodRainWeather = memo(function BloodRainWeather() {
  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden select-none z-[15]"
      style={{
        maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.4) 100%)',
        WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 85%, rgba(0,0,0,0.4) 100%)',
      }}
    >
      {/* Ambient Crimson Atmospheric Fog Veil */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 30%, rgba(180, 20, 30, 0.08) 0%, rgba(100, 5, 12, 0.18) 100%)',
          mixBlendMode: 'screen',
        }}
      />

      {/* Raining Blood Droplets / Streaks */}
      {BLOOD_RAIN_DROPS.map((drop) => (
        <div
          key={`blood-drop-${drop.id}`}
          className="absolute"
          style={{
            left: `${drop.left}%`,
            top: `${drop.top}px`,
            width: `${drop.width}px`,
            height: `${drop.height}px`,
            background: drop.color,
            borderRadius: '9999px',
            transform: `rotate(${drop.angle}deg)`,
            filter: drop.blur ? `blur(${drop.blur}px)` : 'drop-shadow(0 0 4px rgba(255, 30, 45, 0.8))',
            animation: `blood-rain-fall ${drop.duration}s linear infinite`,
            animationDelay: `${drop.delay}s`,
            ['--rain-op' as any]: drop.opacity,
            ['--rain-drift' as any]: `${drop.drift}px`,
          }}
        />
      ))}
    </div>
  );
});

/* ---------- Chinoike Jigoku Environment Props & Corrupted Japanese Ruins ---------- */

const ChinoikeEnvironmentDetails = memo(function ChinoikeEnvironmentDetails({ levelWidth }: { levelWidth: number }) {
  const lanterns = [
    { x: 140, y: 280 },
    { x: 640, y: 320 },
    { x: 1750, y: 580 },
    { x: 2450, y: 660 },
    { x: 3400, y: 600 },
    { x: 5380, y: 340 },
    { x: 6250, y: 280 },
    { x: 6550, y: 280 },
    { x: 6850, y: 280 },
    { x: 7150, y: 280 },
    { x: 7350, y: 280 },
  ];

  const chains = [
    { x: 2000, y: 520, w: 100, h: 70 },
    { x: 3180, y: 610, w: 70, h: 90 },
    { x: 3720, y: 620, w: 80, h: 80 },
    { x: 4780, y: 450, w: 90, h: 90 },
  ];

  const bloodFalls = [
    { x: 1180, y: 440, h: 140 },
    { x: 2120, y: 580, h: 180 },
    { x: 4720, y: 450, h: 220 },
  ];

  return (
    <>
      {/* Blood Cascades / Waterfalls down the dark stone cliffs */}
      {bloodFalls.map((bf, i) => (
        <div
          key={`blood-fall-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: bf.x,
            top: bf.y,
            width: '12px',
            height: `${bf.h}px`,
            background: 'linear-gradient(180deg, rgba(255,43,54,0.7) 0%, rgba(160,10,20,0.85) 50%, rgba(80,4,8,0.95) 100%)',
            boxShadow: '0 0 10px rgba(255,43,54,0.6)',
            zIndex: 3,
          }}
        >
          <div className="w-full h-full opacity-60 anim-fog-slow bg-gradient-to-b from-white/40 via-transparent to-red-600/40" />
        </div>
      ))}

      {/* Heavy Rusted Iron Chains suspended across the abyss */}
      {chains.map((ch, i) => (
        <svg
          key={`chinoike-chain-${i}`}
          className="absolute pointer-events-none"
          style={{
            left: ch.x,
            top: ch.y,
            width: ch.w,
            height: ch.h,
            zIndex: 4,
          }}
          viewBox={`0 0 ${ch.w} ${ch.h}`}
        >
          <path
            d={`M0,0 Q${ch.w / 2},${ch.h} ${ch.w},${ch.h * 0.6}`}
            stroke="#220a0d"
            strokeWidth="3.5"
            strokeDasharray="6 3"
            fill="none"
          />
          <path
            d={`M0,0 Q${ch.w / 2},${ch.h} ${ch.w},${ch.h * 0.6}`}
            stroke="rgba(255,43,54,0.4)"
            strokeWidth="1"
            fill="none"
          />
        </svg>
      ))}

      {/* Blood-Stained Stone Lanterns (Tōrō) */}
      {lanterns.map((l, i) => (
        <div
          key={`chinoike-lantern-${i}`}
          className="absolute pointer-events-none select-none flex flex-col items-center"
          style={{
            left: l.x - 12,
            top: l.y - 48,
            width: '24px',
            height: '48px',
            zIndex: 5,
          }}
        >
          {/* Lantern Roof */}
          <div className="w-6 h-2 bg-[#1a080c] rounded-t-sm border-t border-red-accent/40 shadow-sm" />
          {/* Fire Chamber with Blood-Red Flame */}
          <div className="w-3.5 h-4 bg-[#0a0304] border border-[#330c10] flex items-center justify-center my-0.5 relative">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{
                background: 'radial-gradient(circle, #ff3b46 0%, #aa0812 70%)',
                boxShadow: '0 0 10px rgba(255, 43, 54, 0.9), 0 0 20px rgba(255, 43, 54, 0.5)',
              }}
            />
          </div>
          {/* Stone Base */}
          <div className="w-4 h-6 bg-gradient-to-b from-[#140609] to-[#080203] border-x border-[#240a0e]" />
          <div className="w-5 h-1.5 bg-[#1a080c] rounded-b-sm border-b border-[#330c10]" />
        </div>
      ))}

      {/* Section 8 Boss Arena Infernal Terrace Atmosphere (6100 - 7500) */}
      <div
        className="absolute pointer-events-none select-none"
        style={{
          left: 6100,
          top: 240,
          width: '1400px',
          height: '40px',
          zIndex: 4,
          background: 'linear-gradient(180deg, transparent 0%, rgba(255, 43, 54, 0.12) 50%, rgba(100, 0, 150, 0.18) 100%)',
        }}
      >
        {/* Animated Ground Mist over Arena Floor */}
        <div
          className="w-full h-full opacity-70 anim-fog-slow"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(255, 43, 54, 0.25) 0%, rgba(130, 10, 30, 0.1) 60%, transparent 80%)',
          }}
        />
      </div>
    </>
  );
});

/* ---------- Chinoike Hazards: Blood Pressure Vents & Hanging Cursed Blades ---------- */

const ChinoikeHazardsView = memo(function ChinoikeHazardsView() {
  // Blood pressure geysers erupting from stone cracks
  const vents = [
    { x: 2150, y: 640 },
    { x: 4780, y: 530 },
    { x: 5080, y: 400 },
  ];

  // Hanging cursed executioner blades dripping crimson
  const blades = [
    { x: 2020, y: 510 },
    { x: 4440, y: 580 },
    { x: 5740, y: 260 },
  ];

  return (
    <>
      {/* Blood Pressure Geysers */}
      {vents.map((v, i) => (
        <div
          key={`blood-vent-${i}`}
          className="absolute pointer-events-none select-none flex flex-col items-center"
          style={{
            left: v.x - 16,
            top: v.y - 40,
            width: '32px',
            height: '40px',
            zIndex: 5,
          }}
        >
          {/* Rising Eruption Plume */}
          <div
            className="w-3 h-10 rounded-t-full animate-pulse"
            style={{
              background: 'linear-gradient(0deg, rgba(255, 43, 54, 0.95) 0%, rgba(200, 15, 25, 0.6) 60%, transparent 100%)',
              boxShadow: '0 0 12px rgba(255, 43, 54, 0.9)',
              animationDuration: `${1.6 + (i % 2) * 0.5}s`,
            }}
          />
          {/* Volcanic Fissure Rim */}
          <div className="w-6 h-1 bg-[#ff2b36] rounded-full opacity-80" />
        </div>
      ))}

      {/* Hanging Cursed Blades */}
      {blades.map((b, i) => (
        <div
          key={`hanging-blade-${i}`}
          className="absolute pointer-events-none select-none flex flex-col items-center"
          style={{
            left: b.x - 10,
            top: b.y - 45,
            width: '20px',
            height: '45px',
            zIndex: 7,
          }}
        >
          {/* Iron Chain Suspending the Blade */}
          <div className="w-0.5 h-5 bg-[#3a1a1f] border-x border-[#1a080c]" />
          {/* Razor Executioner Blade */}
          <svg viewBox="0 0 20 25" width="18" height="22" fill="none">
            <path
              d="M10,0 L16,6 L14,20 L10,25 L6,20 L4,6 Z"
              fill="url(#bladeGrad)"
              stroke="#5a1820"
              strokeWidth="1"
            />
            {/* Blood drip along edge */}
            <path d="M10,8 L10,23" stroke="#ff2b36" strokeWidth="1.5" />
            <circle cx="10" cy="24" r="1.5" fill="#ff2b36" className="animate-ping" />
            <defs>
              <linearGradient id="bladeGrad" x1="0" y1="0" x2="20" y2="25" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#2e303d" />
                <stop offset="50%" stopColor="#181922" />
                <stop offset="100%" stopColor="#800a12" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      ))}
    </>
  );
});

/* ---------- Ancient Supernatural Torii Portal (End of Story Location) ---------- */

const CursedToriiPortalView = memo(function CursedToriiPortalView({ exit }: { exit: { x: number; y: number; w: number; h: number; locked?: boolean } }) {
  return (
    <div
      className="absolute pointer-events-none flex flex-col items-center justify-end select-none"
      style={{
        left: exit.x - 15,
        top: exit.y - 15,
        width: exit.w + 30,
        height: exit.h + 20,
        zIndex: 15,
      }}
    >
      {/* Volcanic ground sacrificial glow & hot spring pool */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-8 rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,43,54,0.75) 0%, rgba(180,10,20,0.3) 55%, transparent 80%)',
          filter: 'blur(8px)',
        }}
      />

      {/* Swirling Cursed Red Moon Vortex OR Locked Demonic Barrier */}
      {exit.locked ? (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-28 overflow-hidden rounded-t-full flex flex-col items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, #180306 0%, #0a0103 70%, #000000 100%)',
            boxShadow: '0 0 25px rgba(0,0,0,0.9), inset 0 0 20px rgba(255,43,54,0.3)',
            border: '1.5px solid rgba(255,43,54,0.45)',
          }}
        >
          {/* Barrier cross lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-[1.5px] bg-red-accent/40 rotate-45" />
            <div className="w-32 h-[1.5px] bg-red-accent/40 -rotate-45" />
          </div>
          {/* Demonic Talisman Seal */}
          <div
            className="relative px-2.5 py-1 rounded bg-[#0e0204] border border-red-accent text-red-accent font-jp text-[10px] font-black tracking-widest animate-pulse z-10"
            style={{ boxShadow: '0 0 15px rgba(255,43,54,0.85)' }}
          >
            封印
          </div>
          <span className="font-display text-[7.5px] text-red-accent/90 tracking-[0.22em] uppercase mt-1 z-10 font-bold">
            SEALED GATE
          </span>
        </div>
      ) : (
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-24 h-28 overflow-hidden rounded-t-full flex items-center justify-center"
          style={{
            background: 'radial-gradient(ellipse at center, #ff2332 0%, #aa0812 45%, #2d0205 85%, #050001 100%)',
            boxShadow: '0 0 35px rgba(255,43,54,0.9), inset 0 0 25px rgba(255,100,60,0.85)',
            border: '1px solid rgba(255,43,54,0.6)',
          }}
        >
          <div
            className="w-32 h-32 rounded-full opacity-70"
            style={{
              background: 'conic-gradient(from 0deg, transparent, #ff2332 60deg, transparent 120deg, #ff6040 240deg, transparent 360deg)',
              animation: 'spin 4s linear infinite',
            }}
          />
          {/* Supernatural Kanji Rune Void in Center */}
          <div
            className="absolute font-jp text-lg font-black text-white pointer-events-none animate-pulse"
            style={{
              textShadow: '0 0 12px #ff2332, 0 0 24px #ff6040',
              opacity: 0.85,
            }}
          >
            門
          </div>
        </div>
      )}

      {/* Grand Supernatural Torii Pillars (Pitch obsidian with crimson hell highlights) */}
      {/* Top Kasagi (Curved Upper Lintel) */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-4 rounded-t-sm"
        style={{
          background: 'linear-gradient(180deg, #242630 0%, #121318 60%, #08080a 100%)',
          border: '1px solid #383a45',
          boxShadow: '0 0 15px rgba(255,43,54,0.4)',
        }}
      >
        <div className="absolute inset-x-3 top-0 h-[1.5px] bg-[#ff3b46] opacity-75" />
      </div>

      {/* Shimaki (Lower Lintel) */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-2.5"
        style={{
          background: 'linear-gradient(180deg, #18191f 0%, #090a0d 100%)',
          border: '1px solid #2a2b33',
        }}
      />

      {/* Left Obsidian Pillar with Talisman */}
      <div
        className="absolute top-4 left-3 bottom-0 w-3 rounded-b-sm"
        style={{
          background: 'linear-gradient(90deg, #22242c 0%, #111216 60%, #08080a 100%)',
          borderLeft: '1px solid #383a45',
          boxShadow: '0 0 10px rgba(0,0,0,0.8)',
        }}
      >
        <div className="absolute top-6 -left-1 w-2.5 h-6 bg-[#f0e6d2] text-[#8a131a] font-jp text-[6px] font-bold flex items-center justify-center shadow-md origin-top rotate-3">
          封
        </div>
      </div>

      {/* Right Obsidian Pillar with Talisman */}
      <div
        className="absolute top-4 right-3 bottom-0 w-3 rounded-b-sm"
        style={{
          background: 'linear-gradient(90deg, #111216 0%, #22242c 40%, #08080a 100%)',
          borderRight: '1px solid #383a45',
          boxShadow: '0 0 10px rgba(0,0,0,0.8)',
        }}
      >
        <div className="absolute top-6 -right-1 w-2.5 h-6 bg-[#f0e6d2] text-[#8a131a] font-jp text-[6px] font-bold flex items-center justify-center shadow-md origin-top -rotate-3">
          魔
        </div>
      </div>

      {/* Shimenawa Sacred Braided Rope between pillars */}
      <div
        className="absolute top-7 left-5 right-5 h-1.5 rounded-full"
        style={{
          background: 'repeating-linear-gradient(45deg, #d4a34b, #d4a34b 3px, #8c6827 3px, #8c6827 6px)',
          boxShadow: '0 2px 4px rgba(0,0,0,0.8)',
        }}
      />
    </div>
  );
});

/* ---------- Cursed Kekkai Barrier (Boss Arena Entrance Seal) ---------- */

const CursedKekkaiBarrierView = memo(function CursedKekkaiBarrierView() {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: 6100 - 18,
        top: -600,
        width: 36,
        height: 920,
        zIndex: 20,
      }}
    >
      {/* Outer ambient void-crimson aura */}
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: 'linear-gradient(180deg, rgba(168,85,247,0.1) 0%, rgba(224,37,46,0.5) 40%, rgba(147,20,30,0.85) 85%, rgba(255,43,54,0.95) 100%)',
          filter: 'blur(10px)',
          boxShadow: '0 0 40px rgba(224,37,46,0.8), 0 0 70px rgba(168,85,247,0.4)',
        }}
      />

      {/* Vertical Spectral Laser Lattice Core */}
      <div
        className="absolute inset-x-3.5 inset-y-0"
        style={{
          background: 'linear-gradient(180deg, rgba(192,132,252,0.4) 0%, rgba(255,59,70,0.9) 35%, rgba(255,120,80,1) 75%, rgba(255,43,54,0.9) 100%)',
          boxShadow: '0 0 16px rgba(255,59,70,1), 0 0 30px rgba(168,85,247,0.8)',
        }}
      >
        {/* Shimmering diagonal energy pulses */}
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background: 'repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(255,255,255,0.8) 6px, rgba(255,255,255,0.8) 8px)',
            animation: 'pulse 1.8s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* Floating Sacred Cursed Ofuda Talismans */}
      {/* Talisman 1: High Sky Seal */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[660px] px-1 py-2 rounded bg-[#0d0204] border border-red-accent text-red-accent font-jp text-[8px] font-black tracking-widest flex flex-col items-center justify-center shadow-lg animate-pulse"
        style={{ boxShadow: '0 0 12px rgba(255,43,54,0.9)' }}
      >
        <span>結</span>
        <span>界</span>
      </div>

      {/* Talisman 2: Eye-Level Seal */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[760px] px-1 py-2.5 rounded bg-[#0d0204] border border-purple-500 text-purple-300 font-jp text-[9px] font-black tracking-widest flex flex-col items-center justify-center shadow-lg"
        style={{ boxShadow: '0 0 14px rgba(168,85,247,0.9)', animation: 'pulse 1.4s infinite' }}
      >
        <span>封</span>
        <span>印</span>
      </div>

      {/* Talisman 3: Warning Tag (No Escape) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[840px] px-1 py-1.5 rounded bg-[#160306] border border-red-500 text-red-400 font-jp text-[7px] font-extrabold tracking-tight flex flex-col items-center justify-center shadow-md"
        style={{ boxShadow: '0 0 10px rgba(255,43,54,0.8)' }}
      >
        <span>脱</span>
        <span>出</span>
        <span>不</span>
        <span>可</span>
      </div>

      {/* Ground Runic Anchor (Where barrier pierces the stone platform at Y = 280) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-[870px] w-14 h-4 rounded-[50%]"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,43,54,0.95) 0%, rgba(168,85,247,0.6) 50%, transparent 80%)',
          filter: 'blur(3px)',
          boxShadow: '0 0 20px rgba(255,43,54,0.9)',
        }}
      />
    </div>
  );
});

/* ---------- Story Intro Banner ---------- */

/* ---------- Story Intro Banner (Slowmotion Animation) ---------- */

function StoryIntroBanner({ locationName, jpName }: { locationName: string; jpName: string }) {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit' | 'gone'>('enter');

  useEffect(() => {
    // 1. Slow-motion entrance: 0 to 2.2s (handled by anim-slow-motion-enter)
    const tHold = setTimeout(() => {
      setPhase('hold');
    }, 2200);

    // 2. Holds on screen majestically until 5.2s, then begins slow-motion disappearance (anim-slow-motion-exit)
    const tExit = setTimeout(() => {
      setPhase('exit');
    }, 5200);

    // 3. Complete slow-motion disappearance after 2.4s exit and unmount cleanly
    const tGone = setTimeout(() => {
      setPhase('gone');
    }, 7600);

    return () => {
      clearTimeout(tHold);
      clearTimeout(tExit);
      clearTimeout(tGone);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center select-none pb-12">
      <div
        className={`flex flex-col items-center text-center ${
          phase === 'enter' ? 'anim-slow-motion-enter' : phase === 'exit' ? 'anim-slow-motion-exit' : ''
        }`}
      >
        <div
          className="px-12 py-5 rounded-3xl border border-red-accent/45 flex flex-col items-center"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(12, 14, 24, 0.96) 0%, rgba(5, 7, 13, 0.92) 100%)',
            backdropFilter: 'blur(16px)',
            boxShadow:
              '0 0 70px rgba(0, 0, 0, 0.95), 0 0 45px rgba(255, 43, 54, 0.38), inset 0 0 30px rgba(255, 43, 54, 0.14)',
          }}
        >
          <span
            className="font-jp text-xs text-red-accent font-semibold tracking-[0.45em] uppercase"
            style={{ textShadow: '0 0 12px rgba(255, 43, 54, 0.85)' }}
          >
            第一章 ── {jpName}
          </span>
          <h1
            className="font-display text-4xl sm:text-5xl font-black text-paper tracking-[0.3em] uppercase mt-1 mb-1.5"
            style={{
              textShadow: '0 0 28px rgba(255, 43, 54, 0.95), 0 2px 14px rgba(0,0,0,0.95)',
            }}
          >
            {locationName}
          </h1>
          <div
            className="w-32 h-[1.5px] my-1"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 43, 54, 0.9) 50%, transparent 100%)',
            }}
          />
          <span className="font-mono text-[10px] text-paper-dim tracking-[0.28em] uppercase mt-1">
            Cursed Volcanic Springs of the Red Moon
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---------- Mission Complete Overlay (Chapter 2 Cleared) ---------- */

interface MissionCompleteProps {
  onRestart: () => void;
  onHome: () => void;
}

function MissionCompleteOverlay({
  onRestart,
  onHome,
}: MissionCompleteProps) {

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center select-none"
      style={{
        background: 'rgba(3, 4, 8, 0.88)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className="relative max-w-lg w-full mx-4 p-8 rounded-lg border flex flex-col items-center text-center"
        style={{
          background: 'linear-gradient(180deg, #0c0d14 0%, #05060a 100%)',
          borderColor: 'rgba(255, 43, 54, 0.4)',
          boxShadow:
            '0 0 50px rgba(0,0,0,0.95), 0 0 30px rgba(255, 43, 54, 0.25), inset 0 0 30px rgba(255, 43, 54, 0.06)',
        }}
      >
        {/* Ancient Seal Crest */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{
            background: 'radial-gradient(circle, #590408 0%, #1f0103 100%)',
            border: '2px solid var(--red-accent)',
            boxShadow: '0 0 25px rgba(255,43,54,0.6)',
          }}
        >
          <span className="font-jp text-2xl font-black text-paper" style={{ textShadow: '0 0 10px rgba(255,43,54,0.8)' }}>
            完
          </span>
        </div>

        {/* Title */}
        <h2
          className="font-display text-3xl sm:text-4xl font-black tracking-widest text-paper uppercase"
          style={{ textShadow: '0 0 20px rgba(255, 43, 54, 0.8)' }}
        >
          MISSION COMPLETE
        </h2>

        {/* Story Location Name */}
        <div className="flex items-center gap-2 mt-2">
          <span className="font-display text-base font-bold tracking-widest text-red-accent uppercase">
            CHINOIKE JIGOKU
          </span>
          <span className="text-paper-dim">|</span>
          <span className="font-jp text-sm text-paper-dim tracking-wider">
            第二章 血の池地獄 完
          </span>
        </div>

        {/* Narrative Teaser */}
        <div
          className="my-6 p-4 rounded border border-ink/40 w-full"
          style={{ background: 'rgba(255, 255, 255, 0.02)' }}
        >
          <p className="font-serif italic text-paper-dim text-sm leading-relaxed">
            "The blood red waters churn in the abyss behind you. You have conquered the perils of Chinoike Jigoku. Standing at the precipice of the underworld, you gaze toward the forbidden soul sanctuary. The path to Tamashi no Shinden awaits..."
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={onRestart}
            className="px-6 py-2.5 rounded bg-red-accent/20 border border-red-accent text-paper hover:bg-red-accent/30 transition-all font-display text-xs tracking-widest uppercase font-bold shadow-lg shadow-red-accent/20 cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={onHome}
            className="px-6 py-2.5 rounded bg-white/5 border border-ink text-paper-dim hover:text-paper hover:border-paper/40 transition-all font-display text-xs tracking-widest uppercase font-medium cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}

function EnemyHealthBar({
  hp,
  maxHp,
  type,
  hurt,
}: {
  hp: number;
  maxHp: number;
  type: 'samurai' | 'spirit' | 'hanzo';
  hurt: boolean;
}) {
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <div
      className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center select-none"
      style={{ width: type === 'hanzo' ? '64px' : '48px', zIndex: 25 }}
    >
      {/* Damage popup floating number */}
      {hurt && (
        <div className="absolute -top-4 font-mono font-black text-[11px] text-red-accent anim-damage-float flex items-center justify-center">
          <span style={{ textShadow: '0 0 6px rgba(255,59,70,0.9), 0 0 12px rgba(224,37,46,0.6)' }}>-1</span>
        </div>
      )}

      {/* Enemy type label */}
      <div className="w-full flex items-center justify-center text-[7.5px] font-mono leading-none mb-0.5 px-0.5">
        <span className="tracking-wider text-paper-dim uppercase font-display font-semibold">
          {type === 'hanzo' ? 'HANZO' : type === 'samurai' ? 'SAMURAI' : 'WYVERN'}
        </span>
      </div>

      {/* HP Bar Container */}
      <div
        className="w-full h-2 rounded-sm overflow-hidden p-[1px] relative transition-all duration-150"
        style={{
          background: 'rgba(5,7,13,0.92)',
          border: hurt ? '1px solid var(--red-bright)' : '1px solid rgba(239,230,210,0.25)',
          boxShadow: hurt ? '0 0 10px rgba(255,59,70,0.9)' : '0 2px 5px rgba(0,0,0,0.7)',
        }}
      >
        {/* Track */}
        <div className="w-full h-full bg-black/70 relative flex">
          {/* Health fill */}
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${pct}%`,
              background: type === 'hanzo'
                ? 'linear-gradient(90deg, #66060c 0%, #ff2b36 50%, #bf40bf 100%)'
                : 'linear-gradient(90deg, #c92a2a 0%, #ff3b46 50%, #e9c46a 100%)',
              boxShadow: '0 0 4px rgba(224,37,46,0.8)',
            }}
          />

          {/* Segment notches for HP units (show every hit for standard enemies, every 10 hits for boss) */}
          {maxHp <= 20
            ? Array.from({ length: maxHp - 1 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[1px] bg-black/80 pointer-events-none"
                  style={{ left: `${((i + 1) / maxHp) * 100}%` }}
                />
              ))
            : Array.from({ length: Math.floor((maxHp - 1) / 10) }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-[1px] bg-black/80 pointer-events-none"
                  style={{ left: `${(((i + 1) * 10) / maxHp) * 100}%` }}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

function EnemyView({
  enemy,
  bossIntroTriggered,
  storyLocation,
}: {
  enemy: ReturnType<typeof useGameEngine>['render']['enemies'][number];
  bossIntroTriggered: boolean;
  storyLocation: StoryLocation;
}) {
  if (enemy.type === 'hanzo' && enemy.state === 'dead') return null;
  // Do not render Hanzo before the boss arena intro has been triggered in Chinoike Jigoku!
  if (enemy.type === 'hanzo' && !bossIntroTriggered && storyLocation === 'chinoike-jigoku') return null;
  const maxDeadTimer = enemy.type === 'hanzo' ? 120 : enemy.type === 'samurai' ? 45 : 75;
  if (!enemy.alive && enemy.state !== 'death' && enemy.deadTimer > maxDeadTimer) return null;
  const opacity = enemy.alive || enemy.state === 'death' ? 1 : Math.max(0, 1 - (enemy.deadTimer - (maxDeadTimer - 20)) / 20);
  const isHurt = enemy.hurtCooldown > 0;
  // Always display health bar for normal enemies when alert/damaged; for boss Hanzo, rely primarily on the grand top-center bar
  const showHealth =
    enemy.alive &&
    enemy.state !== 'spawn' &&
    enemy.state !== 'death' &&
    enemy.state !== 'dead' &&
    enemy.state !== 'defeated' &&
    (enemy.type !== 'hanzo'
      ? enemy.hp < enemy.maxHp || isHurt || enemy.state === 'chase' || enemy.state === 'attack'
      : enemy.hp < enemy.maxHp && isHurt);

  return (
    <div
      className="absolute top-0 left-0 will-change-transform"
      style={{
        transform: `translate3d(${enemy.x}px, ${enemy.y}px, 0)`,
        width: enemy.w,
        height: enemy.h,
        opacity,
        zIndex: 10,
      }}
    >
      {/* Enemy Sprite */}
      <div
        className="w-full h-full"
        style={{
          filter: isHurt && enemy.type !== 'hanzo' ? 'brightness(2.2) drop-shadow(0 0 10px rgba(255,59,70,0.9))' : 'none',
          transition: 'filter 0.1s',
        }}
      >
        {enemy.type === 'samurai' ? (
          <div style={{ transform: 'translateX(-10px) translateY(-10px)' }}>
            <CorruptedSamuraiCharacter
              state={enemy.state as any}
              facing={enemy.facing}
              isHurt={isHurt}
              animFrame={enemy.animFrame}
              attackFrame={enemy.attackFrame}
            />
          </div>
        ) : enemy.type === 'hanzo' ? (
          <div>
            {/* HANZO TELEGRAPH: Ground energy ring / simmer directly under feet */}
            {enemy.telegraph === 'rising' && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `${enemy.w / 2 - 25}px`,
                  top: `${enemy.h - 4}px`,
                  width: '50px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'radial-gradient(ellipse at center, rgba(216,180,254,0.75) 0%, rgba(168,85,247,0.45) 50%, transparent 80%)',
                  boxShadow: '0 0 16px rgba(192,132,252,0.85), 0 0 28px rgba(147,51,234,0.6)',
                  zIndex: 8,
                }}
              />
            )}
            {enemy.telegraph === 'spin' && (() => {
              const progress = 1 - (enemy.telegraphTimer || 0) / (enemy.telegraphMaxTimer || 11);
              const ringR = 20 + progress * 32;
              return (
                <div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${enemy.w / 2}px`,
                    top: `${enemy.h - 2}px`,
                    width: `${ringR * 2}px`,
                    height: `${ringR * 0.65}px`,
                    borderRadius: '50%',
                    border: '2px solid rgba(216, 180, 254, 0.9)',
                    boxShadow: '0 0 16px rgba(168, 85, 247, 0.9), inset 0 0 12px rgba(126, 34, 206, 0.6)',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 8,
                  }}
                />
              );
            })()}
            <HanzoCharacter
              state={enemy.state}
              facing={enemy.facing}
              isHurt={isHurt}
              jumpFrame={enemy.jumpFrame}
              damageFrame={enemy.damageFrame}
              deathFrame={enemy.deathFrame}
              telegraph={enemy.telegraph}
              telegraphTimer={enemy.telegraphTimer}
              telegraphMaxTimer={enemy.telegraphMaxTimer}
              animFrame={enemy.animFrame}
              attackFrame={enemy.attackFrame}
            />
          </div>
        ) : (
          <div style={{ transform: 'translateX(-16px) translateY(-15px)' }}>
            <CorruptedBatCharacter
              state={enemy.state as any}
              attackType={enemy.attackType}
              isMoving={Math.hypot(enemy.vx, enemy.vy) > 0.8 || enemy.state === 'chase'}
              facing={enemy.facing}
              isHurt={isHurt}
              animFrame={enemy.animFrame}
            />
          </div>
        )}
      </div>

      {/* Unflipped Health Bar on top of enemy */}
      {showHealth && (
        <EnemyHealthBar
          hp={enemy.hp}
          maxHp={enemy.maxHp}
          type={enemy.type}
          hurt={isHurt}
        />
      )}
    </div>
  );
}

function PlayerView({ player }: { player: ReturnType<typeof useGameEngine>['render']['player'] }) {
  const opacity = player.invuln > 0 && Math.floor(player.invuln / 4) % 2 === 0 ? 0.4 : 1;
  return (
    <div
      className="absolute top-0 left-0 will-change-transform"
      style={{
        transform: `translate3d(${player.x}px, ${player.y}px, 0)`,
        width: player.w,
        height: player.h,
        opacity,
        zIndex: 10,
      }}
    >
      <div style={{ transform: 'translateX(-8px) translateY(-16px)' }}>
        <NinjaCharacter
          anim={player.anim}
          facing={player.facing}
          dashTimer={player.dashTimer}
          parryAnimTimer={player.parryAnimTimer}
          doubleJumpTimer={player.doubleJumpTimer}
          doubleJumpFrame={player.doubleJumpFrame}
          activeSkill={player.activeSkill}
          skillTimer={player.skillTimer}
          skillFrame={player.skillFrame}
          attackHoldTimer={player.attackHoldTimer}
          animFrame={player.animFrame}
          attackFrame={player.attackFrame}
          throwFrame={player.throwFrame}
          landingFrame={player.landingFrame}
          hurtFrame={player.hurtFrame}
          size={1}
        />
      </div>
    </div>
  );
}

/* ---------- Combat Visual Effects ---------- */

const SLASH_EFFECT_FRAMES = [
  '/assets/sprites/player/effects/slash_01.png',
  '/assets/sprites/player/effects/slash_02.png',
  '/assets/sprites/player/effects/slash_03.png',
];

const IMPACT_EFFECT_FRAMES = [
  '/assets/sprites/player/effects/impact_01.png',
  '/assets/sprites/player/effects/impact_02.png',
];

const DUST_EFFECT_FRAMES = [
  '/assets/sprites/player/effects/dust_01.png',
  '/assets/sprites/player/effects/dust_02.png',
];

function CombatEffectView({ effect }: { effect: VisualEffect }) {
  const frameIdx = Math.floor(effect.frame);
  let src: string | undefined;
  const style: React.CSSProperties = {
    position: 'absolute',
    left: effect.x,
    top: effect.y,
    width: '64px',
    height: '64px',
    pointerEvents: 'none',
    userSelect: 'none',
    zIndex: 15,
  };

  if (effect.type === 'slash') {
    src = SLASH_EFFECT_FRAMES[Math.min(frameIdx, SLASH_EFFECT_FRAMES.length - 1)];
    style.transform = effect.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';
  } else if (effect.type === 'down_slash') {
    src = SLASH_EFFECT_FRAMES[Math.min(frameIdx, SLASH_EFFECT_FRAMES.length - 1)];
    style.transform = effect.facing === -1 ? 'scaleX(-1) rotate(90deg)' : 'rotate(90deg)';
  } else if (effect.type === 'impact') {
    src = IMPACT_EFFECT_FRAMES[Math.min(frameIdx, IMPACT_EFFECT_FRAMES.length - 1)];
    style.zIndex = 20;
  } else if (effect.type === 'dust') {
    src = DUST_EFFECT_FRAMES[Math.min(frameIdx, DUST_EFFECT_FRAMES.length - 1)];
    style.zIndex = 5;
  }

  if (!src) return null;

  return (
    <div style={style}>
      <img
        src={src}
        alt="Effect"
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          imageRendering: 'auto',
        }}
      />
    </div>
  );
}

function ShurikenView({ shuriken }: { shuriken: ShurikenProjectile }) {
  const frameSrc = SHURIKEN_FRAMES[shuriken.frame % SHURIKEN_FRAMES.length];
  const flip = shuriken.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${shuriken.x}px, ${shuriken.y}px, 0) ${flip}`,
        transformOrigin: 'center center',
        width: `${shuriken.w}px`,
        height: `${shuriken.h}px`,
        zIndex: 22,
      }}
    >
      <img
        src={frameSrc}
        alt="Shuriken"
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{
          filter: 'drop-shadow(0 0 5px rgba(255,59,70,0.85)) drop-shadow(0 0 2px rgba(244,233,199,0.9))',
          imageRendering: 'auto',
          display: 'block',
        }}
        draggable={false}
      />
    </div>
  );
}

function BladeWaveView({ wave }: { wave: BladeWaveProjectile }) {
  const flip = wave.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';
  const waveFrameSrc = `/assets/sprites/player/attacks/crimson_blade_wave/crimson_blade_wave_${Math.min(10, 7 + (wave.frame % 4))}.png`;

  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${wave.x}px, ${wave.y}px, 0) ${flip}`,
        transformOrigin: 'center center',
        width: `${wave.w}px`,
        height: `${wave.h}px`,
        zIndex: 23,
      }}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(ellipse at 70% 50%, rgba(255, 40, 60, 0.95) 0%, rgba(200, 10, 30, 0.7) 50%, transparent 85%)',
            filter: 'drop-shadow(0 0 12px rgba(255, 30, 50, 0.9)) drop-shadow(0 0 4px #fff)',
            clipPath: 'polygon(30% 0%, 100% 50%, 30% 100%, 0% 80%, 50% 50%, 0% 20%)',
          }}
        />
        <img
          src={waveFrameSrc}
          alt="Crimson Blade Wave"
          className="w-[120px] h-[80px] max-w-none object-contain pointer-events-none select-none"
          style={{
            transform: 'translateX(-22px) translateY(-14px)',
            filter: 'drop-shadow(0 0 10px rgba(255, 40, 60, 0.9)) brightness(1.25)',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

function ShurikenHitView({ hit }: { hit: ShurikenHitEffect }) {
  return (
    <div
      className="absolute pointer-events-none select-none flex items-center justify-center"
      style={{
        left: hit.x,
        top: hit.y,
        width: '56px',
        height: '56px',
        zIndex: 28,
      }}
    >
      <img
        src={`${SHURIKEN_HIT_EFFECT}?id=${hit.id}`}
        alt="Shuriken Hit"
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{
          filter: 'drop-shadow(0 0 8px rgba(255,59,70,0.9)) drop-shadow(0 0 3px rgba(244,233,199,0.8))',
          imageRendering: 'auto',
          display: 'block',
        }}
        draggable={false}
      />
    </div>
  );
}

function RespawnEffectView({ effect }: { effect: RespawnEffect }) {
  return (
    <div
      className="absolute pointer-events-none select-none flex items-center justify-center"
      style={{
        left: effect.x,
        top: effect.y,
        width: '160px',
        height: '148px',
        zIndex: 26,
      }}
    >
      <img
        src={`${NINJA_RESPAWN_EFFECT}?t=${effect.id}`}
        alt="Ninja Respawn Effect"
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{
          filter: 'drop-shadow(0 0 16px rgba(95,179,154,0.9)) drop-shadow(0 0 25px rgba(255,59,70,0.7))',
          imageRendering: 'auto',
          display: 'block',
        }}
        draggable={false}
      />
    </div>
  );
}

function HanzoHitEffectView({ effect }: { effect: HanzoHitEffect }) {
  return (
    <div
      className="absolute pointer-events-none select-none flex items-center justify-center will-change-transform"
      style={{
        left: effect.x,
        top: effect.y,
        width: '130px',
        height: '130px',
        transform: `translate(-50%, -50%) ${effect.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)'}`,
        zIndex: 27,
      }}
    >
      <img
        src={`${HANZO_HIT_EFFECT}?t=${effect.id}`}
        alt="Hanzo Hit Impact"
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{
          filter: 'drop-shadow(0 0 16px rgba(255,43,54,0.95)) drop-shadow(0 0 25px rgba(180,0,255,0.8))',
          imageRendering: 'auto',
          display: 'block',
        }}
        draggable={false}
      />
    </div>
  );
}

function HanzoGhostView({ ghost }: { ghost: HanzoGhost }) {
  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0)`,
        width: 36,
        height: 58,
        opacity: ghost.alpha,
        zIndex: 9,
      }}
    >
      <div
        style={{
          filter:
            'drop-shadow(0 0 14px rgba(180,0,255,0.95)) drop-shadow(0 0 20px rgba(255,43,54,0.85))',
        }}
      >
        <HanzoCharacter
          state={ghost.state}
          facing={ghost.facing}
          isHurt={false}
          animFrame={2}
        />
      </div>
    </div>
  );
}

function HanzoTeleportShadowMarker({
  targetX,
  targetY,
  timer,
  maxTimer,
  width,
  height,
}: {
  targetX: number;
  targetY: number;
  timer: number;
  maxTimer: number;
  width: number;
  height: number;
}) {
  const progress = Math.min(1, Math.max(0, 1 - timer / (maxTimer || 12)));
  const pulseScale = 0.85 + Math.sin(progress * Math.PI) * 0.28;
  const opacity = Math.min(1, progress * 2.5);

  return (
    <div
      className="absolute pointer-events-none select-none will-change-transform"
      style={{
        left: `${targetX + width / 2}px`,
        top: `${targetY + height - 2}px`,
        transform: `translate(-50%, -50%) scale(${pulseScale})`,
        zIndex: 9,
      }}
    >
      {/* Outer soft purple shadow aura pool */}
      <div
        style={{
          width: '56px',
          height: '18px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.9) 0%, rgba(88, 28, 135, 0.75) 45%, rgba(59, 7, 100, 0.35) 75%, transparent 100%)',
          boxShadow: '0 0 22px rgba(168, 85, 247, 0.9), 0 0 38px rgba(126, 34, 206, 0.95)',
          opacity,
        }}
      />
      {/* Inner dark void focal core */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '28px',
          height: '9px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(15, 7, 24, 0.95) 0%, rgba(88, 28, 135, 0.9) 70%, transparent 100%)',
          border: '1.5px solid rgba(216, 180, 254, 0.85)',
          boxShadow: '0 0 12px rgba(192, 132, 252, 0.95)',
          opacity,
        }}
      />
      {/* Subtle ascending shadow mist wisp */}
      <div
        style={{
          position: 'absolute',
          top: '-16px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '18px',
          height: '24px',
          background: 'linear-gradient(to top, rgba(147, 51, 234, 0.6), transparent)',
          filter: 'blur(1.5px)',
          opacity: opacity * 0.75,
        }}
      />
    </div>
  );
}

/* ---------- Supernatural Purple Energy Tether (Shot 9) ---------- */

function SupernaturalEnergyTether({ render }: { render: ReturnType<typeof useGameEngine>['render'] }) {
  const p = render.player;
  const hanzo = render.enemies.find((e) => e.type === 'hanzo');
  if (!hanzo) return null;

  const x1 = p.x + p.w / 2;
  const y1 = p.y + p.h * 0.45;
  const x2 = hanzo.x + hanzo.w / 2;
  const y2 = hanzo.y + hanzo.h * 0.45;

  const minX = Math.min(x1, x2) - 50;
  const minY = Math.min(y1, y2) - 60;
  const width = Math.max(100, Math.abs(x2 - x1) + 100);
  const height = Math.max(100, Math.abs(y2 - y1) + 120);

  const localX1 = x1 - minX;
  const localY1 = y1 - minY;
  const localX2 = x2 - minX;
  const localY2 = y2 - minY;
  const midCX = (localX1 + localX2) / 2;
  const midCY = Math.min(localY1, localY2) - 30;

  return (
    <div
      className="absolute pointer-events-none z-25 animate-in fade-in duration-500"
      style={{ left: minX, top: minY, width, height }}
    >
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="tetherGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
            <stop offset="35%" stopColor="#c084fc" stopOpacity="1" />
            <stop offset="70%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.9" />
          </linearGradient>
          <filter id="tetherGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ethereal curved energy filaments linking the two souls */}
        <path
          d={`M ${localX1} ${localY1} Q ${midCX} ${midCY} ${localX2} ${localY2}`}
          fill="none"
          stroke="url(#tetherGradient)"
          strokeWidth="4"
          filter="url(#tetherGlow)"
          strokeDasharray="8 6"
          className="animate-pulse"
        />
        <path
          d={`M ${localX1} ${localY1} Q ${midCX} ${midCY + 25} ${localX2} ${localY2}`}
          fill="none"
          stroke="#f3e8ff"
          strokeWidth="1.5"
          filter="url(#tetherGlow)"
          opacity="0.8"
        />
        <path
          d={`M ${localX1} ${localY1} Q ${midCX} ${midCY - 15} ${localX2} ${localY2}`}
          fill="none"
          stroke="#c084fc"
          strokeWidth="2"
          opacity="0.6"
        />

        {/* Chest Energy Orbs */}
        <circle cx={localX1} cy={localY1} r="7" fill="#ef4444" filter="url(#tetherGlow)" />
        <circle cx={localX1} cy={localY1} r="3" fill="#ffffff" />
        <circle cx={localX2} cy={localY2} r="8" fill="#a855f7" filter="url(#tetherGlow)" />
        <circle cx={localX2} cy={localY2} r="3.5" fill="#f3e8ff" />
      </svg>
    </div>
  );
}

/* ---------- Full Hanzo Story Cutscene System Components ---------- */

export const UnknownCutsceneCharacterView = memo(function UnknownCutsceneCharacterView({
  actor,
}: {
  actor: NonNullable<NonNullable<ReturnType<typeof useGameEngine>['render']['storyCinematic']>['unknownActor']>;
}) {
  const isTeleporting = actor.anim === 'teleport';
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: `${actor.x}px`,
        top: `${actor.y}px`,
        width: '36px',
        height: '56px',
        opacity: actor.opacity,
        zIndex: 15,
        transition: 'opacity 0.2s ease-out',
      }}
    >
      <div
        style={{
          filter: isTeleporting
            ? 'drop-shadow(0 0 22px rgba(180, 0, 255, 0.95)) drop-shadow(0 0 35px rgba(147, 51, 234, 0.85)) brightness(1.2)'
            : 'drop-shadow(0 0 14px rgba(168, 85, 247, 0.75)) brightness(0.9)',
          transition: 'filter 0.3s ease',
        }}
      >
        <HanzoCharacter
          state={
            actor.anim === 'run' || actor.anim === 'chase'
              ? 'chase'
              : actor.anim === 'dash'
              ? 'dash'
              : actor.anim === 'teleport'
              ? 'teleport_attack'
              : 'idle'
          }
          facing={actor.facing}
          isHurt={false}
        />
      </div>
      {/* Subtle Ethereal Shinobi Mist / Teleport Pool */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full pointer-events-none transition-all duration-300"
        style={{
          width: isTeleporting ? '64px' : '48px',
          height: isTeleporting ? '16px' : '10px',
          background: isTeleporting
            ? 'radial-gradient(ellipse at center, rgba(168, 85, 247, 0.85) 0%, rgba(126, 34, 206, 0.45) 60%, transparent 100%)'
            : 'radial-gradient(ellipse at center, rgba(88, 28, 135, 0.5) 0%, transparent 70%)',
          filter: isTeleporting ? 'blur(4px)' : 'blur(6px)',
        }}
      />
    </div>
  );
});

export const SpiritTransferOrbView = memo(function SpiritTransferOrbView({
  orb,
}: {
  orb: NonNullable<NonNullable<ReturnType<typeof useGameEngine>['render']['storyCinematic']>['spiritOrb']>;
}) {
  return (
    <div
      className="absolute pointer-events-none select-none z-30"
      style={{
        left: `${orb.x}px`,
        top: `${orb.y}px`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Radiant Ethereal Halo */}
      <div className="absolute -inset-4 rounded-full bg-purple-600/35 blur-md animate-pulse" />
      <div className="absolute -inset-2 rounded-full bg-violet-400/50 blur-sm animate-ping" />
      {/* Core Spirit Pearl */}
      <div
        className="w-5 h-5 rounded-full"
        style={{
          background: 'radial-gradient(circle, #f5d0fe 0%, #c084fc 45%, #7e22ce 85%, #3b0764 100%)',
          boxShadow: '0 0 16px #c084fc, 0 0 28px #7e22ce, inset 0 0 6px #ffffff',
        }}
      />
      {/* Spirit Embers Trail */}
      <div
        className="absolute top-1/2 -translate-y-1/2 right-0 w-8 h-2 bg-gradient-to-l from-purple-400/60 to-transparent blur-[1px]"
        style={{ transformOrigin: 'right center' }}
      />
    </div>
  );
});

export const ChinoikeToriiGateView = memo(function ChinoikeToriiGateView({
  x = 490,
  y = 470,
}: {
  x?: number;
  y?: number;
}) {
  return (
    <div
      className="absolute pointer-events-none select-none z-10"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        width: '90px',
        height: '130px',
      }}
    >
      {/* Mystical Portal Swirl in Center */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-28 overflow-hidden rounded-t-full"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(224,37,46,0.9) 0%, rgba(147,20,30,0.85) 45%, rgba(45,5,10,0.95) 85%)',
          boxShadow: '0 0 35px rgba(224,37,46,0.85), inset 0 0 20px rgba(255,100,100,0.8)',
        }}
      >
        <div
          className="absolute inset-0 opacity-70 animate-pulse"
          style={{
            background: 'radial-gradient(circle, rgba(255,200,200,0.9) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-full opacity-40 animate-ping"
          style={{
            background: 'linear-gradient(0deg, rgba(255,43,54,0.6) 0%, transparent 80%)',
          }}
        />
      </div>

      {/* Torii Gate Structure */}
      {/* Top Kasagi Beam (curved arch lintel) */}
      <div
        className="absolute top-0 left-0 right-0 h-4 rounded-t-md"
        style={{
          background: 'linear-gradient(180deg, #111 0%, #b91c1c 40%, #7f1d1d 100%)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.8), 0 0 15px rgba(224,37,46,0.5)',
          clipPath: 'polygon(0% 40%, 4% 0%, 96% 0%, 100% 40%, 98% 100%, 2% 100%)',
        }}
      />
      {/* Second Shimaki Beam */}
      <div
        className="absolute top-4 left-2 right-2 h-2.5 rounded-sm"
        style={{
          background: 'linear-gradient(180deg, #dc2626 0%, #991b1b 100%)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.6)',
        }}
      />
      {/* Central Plaque: CHINOIKE */}
      <div
        className="absolute top-3.5 left-1/2 -translate-x-1/2 w-6 h-7 bg-black border border-red-500 rounded-sm flex items-center justify-center text-[7px] font-jp text-red-300 font-black shadow-md z-10"
      >
        <span>血</span>
      </div>
      {/* Left Pillar */}
      <div
        className="absolute top-4 left-4 w-3 bottom-0 rounded-t-sm"
        style={{
          background: 'linear-gradient(90deg, #7f1d1d 0%, #dc2626 40%, #450a0a 100%)',
          boxShadow: '-2px 0 6px rgba(0,0,0,0.5)',
        }}
      />
      {/* Right Pillar */}
      <div
        className="absolute top-4 right-4 w-3 bottom-0 rounded-t-sm"
        style={{
          background: 'linear-gradient(90deg, #7f1d1d 0%, #dc2626 40%, #450a0a 100%)',
          boxShadow: '2px 0 6px rgba(0,0,0,0.5)',
        }}
      />
      {/* Torii Stone Bases */}
      <div className="absolute bottom-0 left-3 w-5 h-2 bg-neutral-900 border border-neutral-700 rounded-sm" />
      <div className="absolute bottom-0 right-3 w-5 h-2 bg-neutral-900 border border-neutral-700 rounded-sm" />

      {/* Floating Gate Label */}
      <div
        className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded bg-black/80 border border-red-500/60 text-red-400 font-jp text-[9px] font-bold tracking-widest pointer-events-none shadow-lg animate-pulse"
      >
        血の池地獄 門
      </div>
    </div>
  );
});

function JapaneseStoryDialogueBox({
  line,
  revealedIdentity,
  onAdvance,
}: {
  line: CinematicDialogueLine | null;
  revealedIdentity?: boolean;
  onAdvance: () => void;
}) {
  if (!line) return null;

  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  const speaker = line.speaker === 'UNKNOWN' && revealedIdentity ? 'HANZO — SHADOW' : line.speaker;
  const isHanzo = speaker === 'HANZO';
  const isHanzoShadow = speaker === 'HANZO — SHADOW';
  const text = line.text || '';
  const jp = line.jpSubtitle || '';

  useEffect(() => {
    setDisplayedText('');
    setIsTypingComplete(false);
    if (!text) return;

    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx++;
      setDisplayedText(text.slice(0, charIdx));
      if (charIdx >= text.length) {
        setIsTypingComplete(true);
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isTypingComplete) {
      setDisplayedText(text);
      setIsTypingComplete(true);
    } else {
      onAdvance();
    }
  };

  return (
    <div
      onClick={handleClick}
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-xl pointer-events-auto select-none cursor-pointer"
      style={{ height: '98px' }}
    >
      <div
        className={`w-full h-full p-3 sm:p-3.5 rounded-lg border shadow-2xl backdrop-blur-md flex flex-col justify-between transition-all duration-300 ${
          isHanzo
            ? 'bg-gradient-to-b from-[#180d10]/95 to-black/98 border-red-600/50 shadow-[0_0_30px_rgba(224,37,46,0.3)]'
            : isHanzoShadow
            ? 'bg-gradient-to-b from-[#1d0e28]/95 to-black/98 border-purple-500/70 shadow-[0_0_35px_rgba(168,85,247,0.4)]'
            : 'bg-gradient-to-b from-[#140e1e]/95 to-black/98 border-purple-900/50 shadow-[0_0_25px_rgba(147,51,234,0.25)]'
        }`}
      >
        {/* Speaker Name Ribbon */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1">
          <div className="flex items-center gap-2">
            <div
              className={`w-4 h-4 rounded border flex items-center justify-center font-jp text-[9px] font-black shadow-sm ${
                isHanzo
                  ? 'border-red-500 bg-red-950/80 text-red-200 shadow-[0_0_6px_rgba(239,68,68,0.5)]'
                  : isHanzoShadow
                  ? 'border-purple-400 bg-purple-950/80 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                  : 'border-purple-600/70 bg-purple-950/60 text-purple-300'
              }`}
            >
              {isHanzo ? '忍' : isHanzoShadow ? '魂' : '影'}
            </div>
            <span
              className={`font-display font-black text-xs tracking-[0.25em] uppercase ${
                isHanzo
                  ? 'text-red-accent drop-shadow-[0_0_8px_rgba(255,43,54,0.8)]'
                  : isHanzoShadow
                  ? 'text-purple-300 drop-shadow-[0_0_10px_rgba(192,132,252,0.9)]'
                  : 'text-purple-400/90'
              }`}
            >
              {speaker}
            </span>
          </div>
          <span className="font-mono text-[8px] text-paper-dim/60 tracking-widest uppercase">
            {isTypingComplete ? 'CLICK OR [SPACE] ❯' : 'CLICK TO REVEAL ALL'}
          </span>
        </div>

        {/* Text Area */}
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <p className="font-sans text-xs sm:text-sm text-paper tracking-wide leading-snug font-medium line-clamp-2">
            {displayedText}
            {!isTypingComplete && (
              <span className="inline-block w-1.5 h-3 bg-paper/80 ml-1 animate-pulse align-middle" />
            )}
          </p>
          {jp && (
            <p className="font-serif italic text-[11px] text-paper-dim/75 tracking-wider truncate mt-0.5">
              {jp}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StoryChoiceModal({
  selectedIndex,
  onSelectChoice,
  onNavigate,
}: {
  selectedIndex: number;
  onSelectChoice: (choice: StoryChoice) => void;
  onNavigate: (dir: 1 | -1) => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-auto select-none bg-black/55 backdrop-blur-[2px]">
      <div className="w-full max-w-sm p-5 sm:p-6 rounded-lg bg-gradient-to-b from-[#180e22]/98 to-black/98 border border-purple-800/60 shadow-[0_0_40px_rgba(126,34,206,0.45)] text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
          <span className="font-mono text-[10px] tracking-[0.35em] text-purple-300 font-black uppercase">
            DECISION // 運命の分岐
          </span>
          <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
        </div>
        <h3 className="font-serif italic text-paper text-sm sm:text-base tracking-[0.2em] mb-4">
          What is the fate of your counterpart?
        </h3>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => onSelectChoice('kill')}
            className={`px-4 py-2.5 rounded border text-xs sm:text-sm font-display tracking-[0.25em] uppercase font-bold transition-all flex items-center justify-between ${
              selectedIndex === 0
                ? 'border-red-500/80 bg-red-950/80 text-paper shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-[1.02]'
                : 'border-red-900/30 bg-red-950/20 text-paper-dim/70 hover:border-red-600/50 hover:text-paper'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-red-500/60 bg-red-900/60 flex items-center justify-center text-[10px]">斬</span>
              KILL HANZO
            </span>
            <span className="text-[10px] font-mono text-red-400/80">[ENTER]</span>
          </button>

          <button
            onClick={() => onSelectChoice('spare')}
            className={`px-4 py-2.5 rounded border text-xs sm:text-sm font-display tracking-[0.25em] uppercase font-bold transition-all flex items-center justify-between ${
              selectedIndex === 1
                ? 'border-purple-400/80 bg-purple-950/80 text-paper shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-[1.02]'
                : 'border-purple-900/30 bg-purple-950/20 text-paper-dim/70 hover:border-purple-500/50 hover:text-paper'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-purple-400/60 bg-purple-900/60 flex items-center justify-center text-[10px]">赦</span>
              SPARE HANZO
            </span>
            <span className="text-[10px] font-mono text-purple-300/80">[ENTER]</span>
          </button>
        </div>

        <p className="mt-3.5 text-[9px] font-mono text-paper-dim/50 tracking-widest uppercase">
          [↑/↓] OR [W/S] SELECT • [ENTER] CONFIRM • MOUSE CLICK
        </p>
      </div>
    </div>
  );
}

const ExecutionPromptBanner = memo(function ExecutionPromptBanner({
  onExecute,
}: {
  onExecute?: () => void;
}) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 animate-in fade-in duration-300">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onExecute?.();
        }}
        className="px-6 py-2.5 rounded-full bg-black/90 border border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.7)] flex items-center gap-3 backdrop-blur-md cursor-pointer hover:bg-red-950/90 hover:scale-105 active:scale-95 transition-all pointer-events-auto"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="font-display font-black text-xs sm:text-sm tracking-[0.3em] text-red-accent uppercase drop-shadow-md">
          DELIVER THE FINAL BLOW [ATTACK / CLICK / ENTER]
        </span>
        <span className="font-jp text-xs text-red-300/80 font-semibold">
          とどめを刺せ
        </span>
      </button>
    </div>
  );
});

const PostCreditsTeaserView = memo(function PostCreditsTeaserView({
  timer,
  onExit,
}: {
  timer: number;
  onExit: () => void;
}) {
  const line1Visible = timer >= 60;
  const line2Visible = timer >= 180;
  const line3Visible = timer >= 300;
  const line4Visible = timer >= 420;
  const grandTitleVisible = timer >= 560;

  return (
    <div
      className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden pointer-events-auto"
      style={{ width: VIEWPORT_W, height: VIEWPORT_H }}
    >
      {/* Subtle Drifting Particles / Void */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(88,28,135,0.15)_0%,transparent_70%)]" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg">
        {/* Line 1 */}
        <p
          className={`font-serif italic text-paper text-sm sm:text-base tracking-[0.25em] transition-opacity duration-1000 mb-3 ${
            line1Visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          "The blood moon has fallen."
        </p>

        {/* Line 2 */}
        <p
          className={`font-serif italic text-purple-300/90 text-sm sm:text-base tracking-[0.25em] transition-opacity duration-1000 mb-3 ${
            line2Visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          "But the curse did not die."
        </p>

        {/* Line 3 */}
        <p
          className={`font-serif italic text-paper text-sm sm:text-base tracking-[0.25em] transition-opacity duration-1000 mb-3 ${
            line3Visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          "Beyond the temple gate..."
        </p>

        {/* Line 4 */}
        <p
          className={`font-serif italic text-red-accent text-sm sm:text-base tracking-[0.3em] font-semibold transition-opacity duration-1000 mb-6 drop-shadow-[0_0_12px_rgba(239,68,68,0.7)] ${
            line4Visible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          "Quan Chi awaits."
        </p>

        {/* Grand Title Reveal */}
        <div
          className={`flex flex-col items-center transition-all duration-1000 ${
            grandTitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
          }`}
        >
          <div className="w-10 h-10 rounded-full border border-purple-500/60 bg-purple-950/60 flex items-center justify-center font-jp text-lg font-black text-purple-200 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.6)]">
            拳痴
          </div>
          <h1 className="font-display font-black text-xl sm:text-2xl text-paper tracking-[0.3em] uppercase drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
            SHADOW OF THE RED MOON
          </h1>
          <h2 className="font-serif italic text-red-accent text-xs sm:text-sm tracking-[0.45em] uppercase mt-1 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
            QUAN CHI
          </h2>
          <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-purple-500/60 to-transparent my-3" />
          <p className="font-mono text-[10px] tracking-[0.3em] text-purple-300/80 uppercase font-semibold">
            A NEW CHAPTER AWAITS
          </p>

          <button
            onClick={onExit}
            className="mt-6 px-4 py-1.5 rounded bg-white/5 border border-white/20 text-paper-dim/80 hover:bg-white/10 hover:text-paper text-[10px] font-mono tracking-widest uppercase transition-all"
          >
            [ESC] RETURN TO SANCTUARY
          </button>
        </div>
      </div>
    </div>
  );
});

function StoryCinematicOverlay({
  cinematic,
  onAdvance,
  onSkip,
  onSelectChoice,
  onNavigateChoice,
  onExecuteBlow,
}: {
  cinematic: NonNullable<ReturnType<typeof useGameEngine>['render']['storyCinematic']>;
  onAdvance: () => void;
  onSkip: () => void;
  onSelectChoice: (choice: StoryChoice) => void;
  onNavigateChoice: (dir: 1 | -1) => void;
  onExecuteBlow?: () => void;
}) {
  const { phase, currentLine, revealedIdentity, selectedChoiceIndex, timer } = cinematic;

  // Post-Credits DLC Teaser
  if (phase === 'dlc_teaser') {
    return <PostCreditsTeaserView timer={timer} onExit={onSkip} />;
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-40 overflow-hidden" style={{ width: VIEWPORT_W, height: VIEWPORT_H }}>
      {/* Top Letterbox Bar */}
      <div className="w-full h-8 sm:h-9 bg-black/95 border-b border-purple-900/40 shadow-xl flex items-center justify-between px-5 z-20">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse shadow-[0_0_8px_#a855f7]" />
          <span className="font-mono text-[9px] tracking-[0.3em] text-purple-300 font-bold uppercase">
            {phase.startsWith('opening_') ? 'PROLOGUE // 冥界の邂逅' : 'FINALE // 赤き月の影'}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          className="pointer-events-auto px-2 py-0.5 rounded bg-red-950/40 border border-red-accent/40 text-red-accent/80 hover:bg-red-900/60 hover:text-paper text-[8px] font-mono tracking-widest uppercase transition-colors"
        >
          SKIP [ESC]
        </button>
      </div>

      {/* Execution Pending Banner */}
      {phase === 'hanzo_execution_pending' && (
        <ExecutionPromptBanner onExecute={onExecuteBlow} />
      )}

      {/* Choice Modal */}
      {phase === 'choice_waiting' && (
        <StoryChoiceModal
          selectedIndex={selectedChoiceIndex ?? 0}
          onSelectChoice={onSelectChoice}
          onNavigate={onNavigateChoice}
        />
      )}

      {/* Japanese Story Dialogue Box (Only for dialogue phases) */}
      {(phase === 'opening_dialogue' || phase === 'final_dialogue') && (
        <JapaneseStoryDialogueBox
          line={currentLine}
          revealedIdentity={revealedIdentity}
          onAdvance={onAdvance}
        />
      )}

      {/* Fullscreen Fade to Black during transitions */}
      {cinematic.fadeOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-50 transition-opacity duration-150"
          style={{ opacity: cinematic.fadeOpacity }}
        />
      )}
    </div>
  );
}

function BossIntroBanner({ timer }: { timer: number }) {
  // Title card: synchronized with Japanese_Intro_mp3.mp3 (~280 frames / 4.66s)
  // Fades in smoothly over the first 25 frames, stays fully visible, fades out smoothly over the final 30 frames
  const maxTimer = 280;
  const fadeInWindow = 25;
  const fadeOutWindow = 30;
  const titleOpacity = timer > maxTimer - fadeInWindow
    ? Math.max(0, Math.min(1, (maxTimer - timer) / fadeInWindow))
    : timer < fadeOutWindow
    ? Math.max(0, Math.min(1, timer / fadeOutWindow))
    : 1;

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none z-35 flex flex-col items-center justify-center transition-opacity duration-300"
      style={{
        opacity: titleOpacity,
        background: 'radial-gradient(ellipse at center, rgba(16, 2, 5, 0.82) 0%, transparent 80%)',
      }}
    >
      <div className="flex flex-col items-center anim-scale-up px-4 text-center">
        {/* Calligraphy Japanese Title */}
        <div className="flex items-center gap-3 mb-2">
          <span className="w-12 sm:w-24 h-[2px] bg-gradient-to-r from-transparent via-red-accent to-purple-500 shadow-[0_0_10px_#ff2b36]" />
          <span
            className="font-jp text-3xl sm:text-5xl font-black text-red-accent tracking-[0.35em]"
            style={{ textShadow: '0 0 25px rgba(255,43,54,1), 0 0 45px rgba(180,0,255,0.9)' }}
          >
            怨霊守護者 半蔵
          </span>
          <span className="w-12 sm:w-24 h-[2px] bg-gradient-to-l from-transparent via-red-accent to-purple-500 shadow-[0_0_10px_#ff2b36]" />
        </div>

        {/* English Title */}
        <h2
          className="font-display text-2xl sm:text-4xl font-black tracking-[0.35em] text-paper uppercase mb-1"
          style={{ textShadow: '0 0 20px rgba(255,255,255,0.9), 0 0 30px rgba(255,43,54,0.95)' }}
        >
          PORTAL GUARDIAN HANZO
        </h2>

        {/* Subtitle */}
        <p className="font-serif italic text-paper-dim/95 text-xs sm:text-base tracking-[0.25em] drop-shadow-[0_2px_6px_rgba(0,0,0,1)]">
          "Ancient Guardian of the Red Moon Gate"
        </p>

        {/* Traditional Kanji Seal Stamp */}
        <div className="mt-4 w-9 h-9 rounded border border-red-accent/90 bg-red-accent/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,43,54,1)]">
          <span className="font-jp text-[13px] font-black text-red-accent">死</span>
        </div>
      </div>
    </div>
  );
}

function DashGhostView({ ghost }: { ghost: DashGhost }) {
  const dashSrc = DASH_FRAMES[ghost.frameIndex % DASH_FRAMES.length];
  const flip = ghost.facing === -1 ? 'scaleX(-1)' : 'scaleX(1)';
  return (
    <div
      className="absolute top-0 left-0 pointer-events-none select-none will-change-transform"
      style={{
        transform: `translate3d(${ghost.x}px, ${ghost.y}px, 0)`,
        width: '28px',
        height: '48px',
        opacity: ghost.alpha,
        zIndex: 8,
      }}
    >
      <div
        style={{
          transform: `translateX(-8px) translateY(-16px) ${flip}`,
          transformOrigin: 'center bottom',
          width: '44px',
          height: '64px',
          position: 'relative',
        }}
      >
        <img
          src={dashSrc}
          alt="Dash Ghost Trail"
          className="pointer-events-none select-none"
          style={{
            position: 'absolute',
            top: '-17px',
            left: '-56px',
            width: '120px',
            height: '120px',
            maxWidth: 'none',
            objectFit: 'contain',
            filter:
              'drop-shadow(0 0 10px rgba(255, 30, 45, 0.9)) drop-shadow(0 0 18px rgba(220, 20, 30, 0.6))',
            imageRendering: 'auto',
            display: 'block',
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

function ParryHitView({ hit }: { hit: ParryHitEffect }) {
  const size = hit.isPerfect ? 132 : 108;
  return (
    <div
      className="absolute pointer-events-none select-none z-30 anim-scale-in"
      style={{
        left: hit.x - size / 2,
        top: hit.y - size / 2,
        width: size,
        height: size,
      }}
    >
      <img
        src={`${PARRY_EFFECT}?t=${hit.id}`}
        alt="Parry Spark Effect"
        className="w-full h-full object-contain pointer-events-none select-none"
        style={{
          filter: hit.isPerfect
            ? 'drop-shadow(0 0 16px rgba(255,215,0,1)) drop-shadow(0 0 28px rgba(255,43,54,0.9))'
            : 'drop-shadow(0 0 10px rgba(255,230,120,0.85)) drop-shadow(0 0 18px rgba(255,43,54,0.7))',
          imageRendering: 'auto',
          display: 'block',
        }}
        draggable={false}
      />
    </div>
  );
}

/* ---------- Utils ---------- */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

function computeRank(score: number, time: number, coins: number, totalCoins: number): string {
  let base = score;
  // Time bonus: faster = better
  if (time < 90) base += 500;
  else if (time < 120) base += 200;
  // Coin ratio
  const ratio = coins / totalCoins;
  if (ratio >= 0.9) base += 400;
  else if (ratio >= 0.7) base += 200;

  if (base >= 3500) return 'S';
  if (base >= 2800) return 'A';
  if (base >= 2000) return 'B';
  return 'C';
}
