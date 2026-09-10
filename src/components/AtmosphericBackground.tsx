import { useMemo, memo } from 'react';
import type { StoryLocation } from '@/game/types';

interface Particle {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  type: 'ember' | 'ash';
}

interface BackgroundProps {
  /** 0..1 parallax offset based on player position in level */
  parallax?: number;
  /** Show falling embers vs calm petals */
  variant?: 'menu' | 'game';
  /** Moon vertical position override (vh or %) */
  moonTop?: string;
  /** Story location (yunami-jigoku vs chinoike-jigoku) */
  storyLocation?: StoryLocation;
}

export const AtmosphericBackground = memo(function AtmosphericBackground({
  parallax = 0,
  variant = 'menu',
  moonTop = '8%',
  storyLocation = 'yunami-jigoku',
}: BackgroundProps) {
  const particles = useMemo<Particle[]>(() => {
    const embers: Particle[] = Array.from({ length: 26 }, () => ({
      left: Math.random() * 100,
      size: 2 + Math.random() * 3.5,
      duration: 5.5 + Math.random() * 9,
      delay: Math.random() * 8,
      drift: (Math.random() - 0.5) * 60,
      type: 'ember',
    }));

    const ash: Particle[] = Array.from({ length: 18 }, () => ({
      left: Math.random() * 100,
      size: 1.5 + Math.random() * 2.5,
      duration: 9 + Math.random() * 12,
      delay: Math.random() * 10,
      drift: (Math.random() - 0.5) * 45,
      type: 'ash',
    }));

    return [...embers, ...ash];
  }, []);

  // Parallax pixel displacement factors (scaled smoothly across horizontal travel)
  const px = parallax * 100;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
      {/* Deep Cursed Infernal Night Sky gradient with volcanic horizon glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #030408 0%, #070912 28%, #110d18 58%, #1f070a 85%, #2d080c 100%)',
        }}
      />

      {/* Starfield with faint crimson & gold celestial dust */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage: `
            radial-gradient(1.5px 1.5px at 10% 16%, #ffb3b7 99%, transparent),
            radial-gradient(1px 1px at 24% 28%, #ffffff 99%, transparent),
            radial-gradient(2px 2px at 38% 12%, #ffe082 99%, transparent),
            radial-gradient(1px 1px at 52% 22%, #ffffff 99%, transparent),
            radial-gradient(1.5px 1.5px at 68% 14%, #ff9fa4 99%, transparent),
            radial-gradient(1px 1px at 84% 34%, #ffffff 99%, transparent),
            radial-gradient(1.5px 1.5px at 94% 18%, #f0e6d2 99%, transparent),
            radial-gradient(1px 1px at 16% 45%, #ffffff 99%, transparent),
            radial-gradient(2px 2px at 42% 48%, #ffb3b7 99%, transparent),
            radial-gradient(1px 1px at 76% 42%, #ffffff 99%, transparent),
            radial-gradient(1px 1px at 88% 8%, #ffffff 99%, transparent)
          `,
          backgroundSize: '100% 100%',
          transform: `translate3d(${-px * 0.04}px, 0, 0)`,
        }}
      />

      {/* Atmospheric Crimson Light Spill behind the Moon */}
      <div
        className="absolute pointer-events-none will-change-transform"
        style={{
          top: `calc(${moonTop} - 70px)`,
          left: `calc(68% - 160px)`,
          transform: `translate3d(${-px * 0.08}px, 0, 0)`,
          width: '540px',
          height: '540px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 35, 50, 0.42) 0%, rgba(180, 15, 25, 0.24) 45%, transparent 75%)',
          filter: 'blur(45px)',
        }}
      />

      {/* ======================================================== */}
      {/* THE BLOOD MOON (影の赤月) - Crimson Blood Red (PRESERVED) */}
      {/* ======================================================== */}
      <div
        className="absolute anim-blood-moon pointer-events-none will-change-transform"
        style={{
          top: moonTop,
          left: '68%',
          transform: `translate3d(${-px * 0.08}px, 0, 0)`,
          width: '210px',
          height: '210px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 35%, #ff2b36 0%, #e0121d 32%, #a60a14 62%, #590408 88%, #2e0104 100%)',
          boxShadow: `
            0 0 50px 16px rgba(255, 35, 50, 0.8),
            0 0 120px 35px rgba(220, 20, 30, 0.55),
            inset -14px -14px 28px rgba(35, 2, 5, 0.95),
            inset 8px 8px 18px rgba(255, 140, 150, 0.5)
          `,
          filter: 'drop-shadow(0 0 35px rgba(255, 35, 50, 0.85))',
        }}
      >
        {/* SVG Lunar Maria & Craters (Detailed Surface Features) */}
        <svg
          viewBox="0 0 210 210"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-45 mix-blend-multiply"
        >
          {/* Dark Basalt Plains (Lunar Maria) */}
          <path
            d="M50,75 Q75,60 110,65 Q140,70 155,95 Q165,125 140,145 Q115,160 85,150 Q60,140 50,110 Z"
            fill="#380407"
          />
          <path
            d="M110,40 Q135,35 150,55 Q160,75 145,85 Q130,90 115,80 Q105,65 110,40 Z"
            fill="#380407"
          />
          <path
            d="M30,105 Q45,95 65,110 Q70,130 55,140 Q40,145 30,130 Z"
            fill="#380407"
          />
          {/* Distinct Craters with rim highlights and internal shadows */}
          <circle cx="75" cy="148" r="14" fill="#2d0205" stroke="rgba(255,100,110,0.3)" strokeWidth="1.5" />
          <circle cx="73" cy="146" r="6" fill="#1f0103" />

          {/* Copernicus Crater */}
          <circle cx="95" cy="98" r="11" fill="#2d0205" stroke="rgba(255,100,110,0.35)" strokeWidth="1.2" />
          <circle cx="94" cy="97" r="4.5" fill="#1f0103" />

          {/* Kepler Crater */}
          <circle cx="58" cy="85" r="8" fill="#2d0205" stroke="rgba(255,100,110,0.25)" strokeWidth="1" />

          {/* Minor crater clusters */}
          <circle cx="132" cy="120" r="7" fill="#280204" stroke="rgba(255,100,110,0.2)" strokeWidth="1" />
          <circle cx="150" cy="138" r="5" fill="#280204" stroke="rgba(255,100,110,0.2)" strokeWidth="0.8" />
          <circle cx="120" cy="55" r="6.5" fill="#280204" stroke="rgba(255,100,110,0.2)" strokeWidth="0.8" />
          <circle cx="160" cy="82" r="5.5" fill="#280204" stroke="rgba(255,100,110,0.15)" strokeWidth="0.8" />
        </svg>

        {/* Ethereal Crimson Edge Rim Sheen */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'radial-gradient(circle at 30% 28%, rgba(255,200,205,0.2) 0%, transparent 60%)',
          }}
        />
      </div>

      {/* Atmospheric Volcanic Cloud Ribbons Drifting across the Moon */}
      <div
        className="absolute anim-moon-clouds pointer-events-none"
        style={{
          top: `calc(${moonTop} + 45px)`,
          left: `calc(62% - ${px * 0.1}px)`,
          width: '320px',
          height: '90px',
          opacity: 0.5,
        }}
      >
        <svg viewBox="0 0 320 90" fill="none">
          <path
            d="M0,45 Q50,25 110,38 Q180,50 250,30 Q290,20 320,35 Q270,55 200,45 Q130,40 70,55 Q30,60 0,45 Z"
            fill="url(#cloudRedGrad)"
          />
          <defs>
            <linearGradient id="cloudRedGrad" x1="0" y1="0" x2="320" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4a0d15" stopOpacity="0" />
              <stop offset="30%" stopColor="#7a141e" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#8f1922" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#4a0d15" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Story-Location Specific Parallax Layers */}
      {storyLocation === 'chinoike-jigoku' ? (
        <ChinoikeBackgroundLayers px={px} />
      ) : (
        <YunamiBackgroundLayers px={px} />
      )}

      {/* ======================================================== */}
      {/* LAYER 5: Rising Crimson Embers & Falling Volcanic Ash     */}
      {/* ======================================================== */}
      {particles.map((p, i) =>
        p.type === 'ember' ? (
          <span
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${p.left}%`,
              bottom: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: i % 3 === 0 ? '#ff2b36' : i % 2 === 0 ? '#ff6535' : '#e9c46a',
              boxShadow:
                i % 3 === 0
                  ? '0 0 8px rgba(255, 43, 54, 0.9)'
                  : '0 0 6px rgba(255, 101, 53, 0.75)',
              animation: `ember-rise ${p.duration}s linear ${p.delay}s infinite`,
              ['--drift' as string]: `${p.drift}px`,
            }}
          />
        ) : (
          <span
            key={i}
            className="absolute rounded-full pointer-events-none opacity-40"
            style={{
              left: `${p.left}%`,
              top: '-10px',
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: '#4a3d42',
              boxShadow: '0 0 3px rgba(30, 20, 24, 0.6)',
              animation: `ash-fall ${p.duration}s linear ${p.delay}s infinite`,
              ['--drift' as string]: `${p.drift}px`,
            }}
          />
        )
      )}

      {/* Ambient Dark Vignette Framing */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 45%, rgba(2, 3, 6, 0.75) 100%)',
        }}
      />
    </div>
  );
});

/* ---------- Infernal Japanese Silhouettes (NO normal forest/trees) ---------- */

function YunamiBackgroundLayers({ px }: { px: number }) {
  return (
    <>
      {/* LAYER 0: Massive Rising Volcanic Smoke Columns (Far Sky)  */}
      <div
        className="absolute pointer-events-none opacity-50 anim-fog-slow will-change-transform"
        style={{
          bottom: '170px',
          left: '8%',
          transform: `translate3d(${-px * 0.07}px, 0, 0)`,
          width: '150px',
          height: '260px',
        }}
      >
        <svg viewBox="0 0 150 260" fill="none" className="w-full h-full">
          <path
            d="M60,260 Q35,180 80,120 Q115,70 65,15 Q45,45 30,105 Q15,180 55,260 Z"
            fill="url(#smokeGrad1)"
          />
          <defs>
            <linearGradient id="smokeGrad1" x1="0" y1="260" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3d070b" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#1e070a" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#080203" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div
        className="absolute pointer-events-none opacity-55 anim-fog-slow will-change-transform"
        style={{
          bottom: '160px',
          left: '72%',
          transform: `translate3d(${-px * 0.08}px, 0, 0)`,
          width: '170px',
          height: '280px',
        }}
      >
        <svg viewBox="0 0 170 280" fill="none" className="w-full h-full">
          <path
            d="M75,280 Q50,195 100,135 Q135,80 85,20 Q60,65 40,125 Q20,195 70,280 Z"
            fill="url(#smokeGrad2)"
          />
          <defs>
            <linearGradient id="smokeGrad2" x1="0" y1="280" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#45080e" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#22080c" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#080203" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* LAYER 1: Distant Volcanic Cliffs & Lava Falls */}
      <svg
        className="absolute pointer-events-none will-change-transform"
        style={{
          bottom: '120px',
          left: 0,
          transform: `translate3d(${-px * 0.14}px, 0, 0)`,
          width: '165%',
          height: '280px',
          opacity: 0.75,
        }}
        viewBox="0 0 1650 280"
        preserveAspectRatio="none"
      >
        <path
          d="M0,280 L0,180 L80,95 L140,140 L230,55 L310,120 L420,40 L530,135 L640,65 L750,150 L870,45 L970,125 L1100,50 L1220,145 L1340,60 L1450,130 L1530,80 L1650,145 L1650,280 Z"
          fill="#14060b"
        />
        <path
          d="M80,95 L140,140 L230,55 L310,120 L420,40 L530,135 L640,65 L750,150 L870,45 L970,125 L1100,50 L1220,145 L1340,60 L1450,130 L1530,80"
          stroke="rgba(255,43,54,0.5)"
          strokeWidth="2.8"
          fill="none"
        />

        <path
          d="M420,42 Q423,100 422,175 Q425,220 424,280"
          stroke="#ff2b36"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#lavaGlow)"
        />
        <path
          d="M420,42 Q423,100 422,175 Q425,220 424,280"
          stroke="#ff8820"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        <path
          d="M870,47 Q873,110 871,185 Q874,230 873,280"
          stroke="#ff2b36"
          strokeWidth="3.6"
          strokeLinecap="round"
          filter="url(#lavaGlow)"
        />
        <path
          d="M870,47 Q873,110 871,185 Q874,230 873,280"
          stroke="#ffaa30"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <path
          d="M1340,62 Q1343,120 1342,190 Q1345,235 1343,280"
          stroke="#ff2b36"
          strokeWidth="3.8"
          strokeLinecap="round"
          filter="url(#lavaGlow)"
        />
        <path
          d="M1340,62 Q1343,120 1342,190 Q1345,235 1343,280"
          stroke="#ff7a20"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        <path
          d="M0,272 Q220,265 450,270 Q700,275 950,268 Q1200,272 1450,266 Q1580,270 1650,268"
          stroke="#ff2b36"
          strokeWidth="6"
          filter="url(#lavaGlow)"
          opacity="0.85"
        />

        <defs>
          <filter id="lavaGlow" x="-50%" y="-20%" width="200%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* LAYER 2: Massive Basalt Pillars & Abyssal Chasms */}
      <svg
        className="absolute pointer-events-none will-change-transform"
        style={{
          bottom: '70px',
          left: 0,
          transform: `translate3d(${-px * 0.28}px, 0, 0)`,
          width: '170%',
          height: '250px',
          opacity: 0.9,
        }}
        viewBox="0 0 1700 250"
        preserveAspectRatio="none"
      >
        <path
          d="M0,250 L0,140 L40,110 L40,250 M70,250 L70,85 L110,65 L110,250 M140,250 L140,130 L180,105 L180,250 M250,250 L250,90 L300,70 L300,250 M380,250 L380,50 L430,35 L430,250 M510,250 L510,120 L550,100 L550,250 M620,250 L620,75 L670,55 L670,250 M750,250 L750,110 L790,90 L790,250 M860,250 L860,45 L920,30 L920,250 M990,250 L990,130 L1030,110 L1030,250 M1100,250 L1100,70 L1150,55 L1150,250 M1230,250 L1230,105 L1270,85 L1270,250 M1350,250 L1350,50 L1410,35 L1410,250 M1480,250 L1480,115 L1520,95 L1520,250 M1590,250 L1590,65 L1640,45 L1640,250 M1680,250 L1680,120 L1700,100 L1700,250"
          stroke="#090305"
          strokeWidth="42"
          strokeLinecap="square"
          fill="none"
        />
        <path d="M110,85 Q180,125 250,90" stroke="#1b0609" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
        <path d="M430,65 Q470,95 510,120" stroke="#1b0609" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
        <path d="M670,75 Q710,115 750,110" stroke="#1b0609" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
        <path d="M920,55 Q955,95 990,130" stroke="#1b0609" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
        <path d="M1150,75 Q1190,115 1230,105" stroke="#1b0609" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
        <path d="M1410,55 Q1445,95 1480,115" stroke="#1b0609" strokeWidth="2.5" strokeDasharray="4 2" fill="none" />
        <path d="M0,240 L1700,240" stroke="rgba(255,43,54,0.45)" strokeWidth="10" filter="url(#lavaGlow)" />
      </svg>

      {/* LAYER 3: Corrupted Japanese Ruins & Skeletal Dead Wood */}
      <div
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{ transform: `translate3d(${-px * 0.45}px, 0, 0)` }}
      >
        <div className="absolute pointer-events-none" style={{ bottom: '90px', left: '14%', opacity: 0.85 }}>
          <CorruptedTempleRuins />
        </div>
        <div className="absolute pointer-events-none" style={{ bottom: '85px', left: '64%', opacity: 0.78 }}>
          <CorruptedTempleRuins />
        </div>
        <ShatteredToriiMonolith x="32%" bottom={75} scale={0.85} opacity={0.8} />
        <ShatteredToriiMonolith x="84%" bottom={72} scale={0.95} opacity={0.85} />
        <SkeletalDeadWood x="4%" bottom={55} scale={1.0} opacity={0.88} />
        <SkeletalDeadWood x="24%" bottom={58} scale={0.85} flip opacity={0.82} />
        <SkeletalDeadWood x="48%" bottom={52} scale={1.1} opacity={0.9} />
        <SkeletalDeadWood x="74%" bottom={50} scale={0.9} flip opacity={0.85} />
        <SkeletalDeadWood x="92%" bottom={56} scale={1.05} opacity={0.9} />
        <VolcanicSpireFormation x="18%" bottom={30} scale={0.9} opacity={0.85} />
        <VolcanicSpireFormation x="40%" bottom={25} scale={1.1} opacity={0.9} />
        <VolcanicSpireFormation x="58%" bottom={28} scale={0.95} opacity={0.85} />
        <VolcanicSpireFormation x="80%" bottom={26} scale={1.05} opacity={0.9} />
      </div>

      {/* LAYER 4: Infernal Sulfur Fog & Ground Glow */}
      <div
        className="absolute anim-fog-drift pointer-events-none"
        style={{
          bottom: '40px',
          left: '-15%',
          width: '135%',
          height: '140px',
          background:
            'radial-gradient(ellipse at center, rgba(180, 20, 30, 0.25) 0%, rgba(120, 10, 15, 0.14) 45%, transparent 75%)',
          filter: 'blur(24px)',
        }}
      />
      <div
        className="absolute anim-fog-slow pointer-events-none"
        style={{
          bottom: '15px',
          left: '-10%',
          width: '130%',
          height: '100px',
          background:
            'radial-gradient(ellipse at center, rgba(230, 35, 45, 0.22) 0%, rgba(80, 8, 12, 0.12) 50%, transparent 72%)',
          filter: 'blur(28px)',
        }}
      />
    </>
  );
}

/* ---------- Chinoike Jigoku Parallax Background (Blood Pond Hell) ---------- */

function ChinoikeBackgroundLayers({ px }: { px: number }) {
  return (
    <>
      {/* LAYER 0: Deep Crimson Mist Columns rising from the Blood Abyss */}
      <div
        className="absolute pointer-events-none opacity-60 anim-fog-slow will-change-transform"
        style={{
          bottom: '130px',
          left: '12%',
          transform: `translate3d(${-px * 0.07}px, 0, 0)`,
          width: '180px',
          height: '320px',
        }}
      >
        <svg viewBox="0 0 180 320" fill="none" className="w-full h-full">
          <path
            d="M80,320 Q40,220 90,140 Q130,80 70,20 Q50,60 35,130 Q20,220 70,320 Z"
            fill="url(#bloodMistGrad1)"
          />
          <defs>
            <linearGradient id="bloodMistGrad1" x1="0" y1="320" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5c060d" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#2e0307" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#080103" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div
        className="absolute pointer-events-none opacity-65 anim-fog-slow will-change-transform"
        style={{
          bottom: '110px',
          left: '68%',
          transform: `translate3d(${-px * 0.08}px, 0, 0)`,
          width: '200px',
          height: '340px',
        }}
      >
        <svg viewBox="0 0 200 340" fill="none" className="w-full h-full">
          <path
            d="M90,340 Q55,230 110,150 Q145,90 85,25 Q60,75 40,145 Q20,230 80,340 Z"
            fill="url(#bloodMistGrad2)"
          />
          <defs>
            <linearGradient id="bloodMistGrad2" x1="0" y1="340" x2="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#69070f" stopOpacity="0.9" />
              <stop offset="60%" stopColor="#360408" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#080103" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* LAYER 1: Enormous Vertical Blood Chasm Cliffs & Plunging Blood Waterfalls (Parallax 0.14x) */}
      <svg
        className="absolute pointer-events-none will-change-transform"
        style={{
          bottom: '100px',
          left: 0,
          transform: `translate3d(${-px * 0.14}px, 0, 0)`,
          width: '165%',
          height: '340px',
          opacity: 0.85,
        }}
        viewBox="0 0 1650 340"
        preserveAspectRatio="none"
      >
        {/* Giant Sheer Abyssal Cliffs Silhouette */}
        <path
          d="M0,340 L0,120 L120,80 L120,200 L260,110 L380,180 L520,60 L520,220 L660,130 L780,70 L920,160 L1080,90 L1200,190 L1340,75 L1460,140 L1650,90 L1650,340 Z"
          fill="#100306"
        />

        {/* Colossal Blood Waterfall 1 (Left Abyss) */}
        <path
          d="M260,110 L260,340"
          stroke="#b80d19"
          strokeWidth="10"
          filter="url(#bloodFallGlow)"
        />
        <path
          d="M260,110 L260,340"
          stroke="#ff3b46"
          strokeWidth="3"
        />

        {/* Colossal Blood Waterfall 2 (Center Great Abyss) */}
        <path
          d="M780,70 L780,340"
          stroke="#9e0a15"
          strokeWidth="16"
          filter="url(#bloodFallGlow)"
        />
        <path
          d="M780,70 L780,340"
          stroke="#ff2b36"
          strokeWidth="5"
        />

        {/* Colossal Blood Waterfall 3 (Right Abyss) */}
        <path
          d="M1340,75 L1340,340"
          stroke="#b80d19"
          strokeWidth="12"
          filter="url(#bloodFallGlow)"
        />
        <path
          d="M1340,75 L1340,340"
          stroke="#ff3b46"
          strokeWidth="4"
        />

        <defs>
          <filter id="bloodFallGlow" x="-30%" y="-10%" width="160%" height="120%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* LAYER 2: Towering Dark Cavern Spires & Heavy Iron Chains (Parallax 0.28x) */}
      <svg
        className="absolute pointer-events-none will-change-transform"
        style={{
          bottom: '60px',
          left: 0,
          transform: `translate3d(${-px * 0.28}px, 0, 0)`,
          width: '170%',
          height: '280px',
          opacity: 0.92,
        }}
        viewBox="0 0 1700 280"
        preserveAspectRatio="none"
      >
        {/* Massive Spire Monoliths */}
        <path
          d="M50,280 L70,50 L110,280 M220,280 L250,90 L290,280 M480,280 L510,40 L550,280 M720,280 L760,80 L800,280 M980,280 L1020,30 L1070,280 M1240,280 L1280,70 L1320,280 M1500,280 L1540,45 L1580,280"
          stroke="#070204"
          strokeWidth="46"
          strokeLinecap="square"
          fill="none"
        />

        {/* Heavy Iron Restraint Chains connecting spires */}
        <path d="M110,120 Q180,180 250,140" stroke="#160307" strokeWidth="3" strokeDasharray="5 3" fill="none" />
        <path d="M290,160 Q380,210 480,120" stroke="#160307" strokeWidth="3" strokeDasharray="5 3" fill="none" />
        <path d="M550,130 Q630,190 720,150" stroke="#160307" strokeWidth="3" strokeDasharray="5 3" fill="none" />
        <path d="M800,160 Q890,220 980,110" stroke="#160307" strokeWidth="3" strokeDasharray="5 3" fill="none" />
        <path d="M1070,120 Q1150,180 1240,150" stroke="#160307" strokeWidth="3" strokeDasharray="5 3" fill="none" />
        <path d="M1320,160 Q1410,210 1500,120" stroke="#160307" strokeWidth="3" strokeDasharray="5 3" fill="none" />

        {/* Subterranean Deep Blood Glow under spires */}
        <path d="M0,270 L1700,270" stroke="rgba(255,43,54,0.6)" strokeWidth="12" filter="url(#bloodFallGlow)" />
      </svg>

      {/* LAYER 3: Corrupted Japanese Ruins & Skeletal Dead Wood (Parallax 0.45x) */}
      <div
        className="absolute inset-0 pointer-events-none will-change-transform"
        style={{ transform: `translate3d(${-px * 0.45}px, 0, 0)` }}
      >
        <div className="absolute pointer-events-none" style={{ bottom: '95px', left: '16%', opacity: 0.88 }}>
          <CorruptedTempleRuins />
        </div>
        <div className="absolute pointer-events-none" style={{ bottom: '90px', left: '68%', opacity: 0.82 }}>
          <CorruptedTempleRuins />
        </div>
        <ShatteredToriiMonolith x="36%" bottom={80} scale={0.9} opacity={0.85} />
        <ShatteredToriiMonolith x="82%" bottom={78} scale={0.95} opacity={0.88} />
        <SkeletalDeadWood x="6%" bottom={60} scale={1.0} opacity={0.9} />
        <SkeletalDeadWood x="26%" bottom={62} scale={0.85} flip opacity={0.85} />
        <SkeletalDeadWood x="50%" bottom={58} scale={1.1} opacity={0.92} />
        <SkeletalDeadWood x="76%" bottom={55} scale={0.9} flip opacity={0.88} />
        <SkeletalDeadWood x="94%" bottom={60} scale={1.05} opacity={0.9} />
      </div>

      {/* LAYER 4: Heavy Dense Crimson Blood Mist */}
      <div
        className="absolute anim-fog-drift pointer-events-none"
        style={{
          bottom: '20px',
          left: '-15%',
          width: '135%',
          height: '160px',
          background: 'radial-gradient(ellipse at center, rgba(210, 15, 25, 0.32) 0%, rgba(130, 5, 12, 0.18) 50%, transparent 78%)',
          filter: 'blur(28px)',
        }}
      />
    </>
  );
}

/* ---------- Infernal Japanese Silhouettes (NO normal forest/trees) ---------- */

/** Ruined Pagoda Silhouette - shattered eaves, burning timbers, no trees */
function CorruptedTempleRuins() {
  return (
    <svg width="200" height="220" viewBox="0 0 200 220" fill="none">
      {/* Jagged stone base emerging from basalt */}
      <path d="M50,220 L65,185 L135,185 L150,220 Z" fill="#080205" />
      {/* Tier 3 roof - shattered split */}
      <path d="M20,172 Q95,152 175,172 L165,160 Q110,146 32,160 Z" fill="#120409" />
      <rect x="52" y="146" width="86" height="15" fill="#080205" />
      {/* Glowing demonic fire inside ruin grating */}
      <rect x="70" y="150" width="14" height="8" fill="#e0252e" opacity="0.8" filter="drop-shadow(0 0 5px #ff2b36)" />
      <rect x="106" y="150" width="14" height="8" fill="#e0252e" opacity="0.8" filter="drop-shadow(0 0 5px #ff2b36)" />

      {/* Tier 2 roof - broken right corner */}
      <path d="M35,140 Q90,126 145,136 L138,124 Q95,116 48,128 Z" fill="#120409" />
      <rect x="62" y="114" width="66" height="16" fill="#080205" />
      {/* Window glow */}
      <rect x="88" y="118" width="14" height="8" fill="#ff4d4d" opacity="0.75" filter="drop-shadow(0 0 6px #ff2b36)" />

      {/* Tier 1 roof - completely collapsed left overhang */}
      <path d="M60,106 Q95,95 138,106 L130,96 Q95,88 68,98 Z" fill="#120409" />
      <rect x="74" y="84" width="42" height="14" fill="#080205" />
      {/* Broken, jagged finial spire */}
      <path d="M91,84 L93,62 L97,70 L96,84 Z" fill="#080205" />
      <line x1="93" y1="62" x2="99" y2="78" stroke="#ff2b36" strokeWidth="1" opacity="0.7" />
    </svg>
  );
}

/** Shattered Torii Monolith - cracked pillars, hanging broken chains, curse runes */
function ShatteredToriiMonolith({
  x = '15%',
  bottom = 80,
  scale = 0.8,
  opacity = 0.7,
}: {
  x: string;
  bottom?: number;
  scale?: number;
  opacity?: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        bottom: `${bottom}px`,
        transform: `scale(${scale}) rotate(-2.5deg)`,
        transformOrigin: 'bottom center',
        opacity,
      }}
    >
      <svg width="120" height="110" viewBox="0 0 120 110" fill="#090205">
        {/* Top curved lintel (Kasagi) snapped in half */}
        <path d="M0,16 Q45,8 58,16 L56,23 Q45,15 2,22 Z" />
        <path d="M64,18 Q90,10 118,17 L115,24 Q90,17 66,25 Z" />
        {/* Second lintel (Nuki) */}
        <rect x="12" y="29" width="44" height="6" />
        <rect x="62" y="30" width="46" height="6" />
        {/* Vertical pillars (Hashira) - right pillar cracked at top */}
        <rect x="22" y="20" width="8.5" height="85" />
        <rect x="80" y="32" width="8.5" height="73" />
        {/* Shattered jagged top of right pillar */}
        <polygon points="80,32 84,24 88.5,32" />
        {/* Crimson curse seal mark on left pillar */}
        <circle cx="26" cy="45" r="3" fill="#ff2b36" opacity="0.9" filter="drop-shadow(0 0 4px #ff2b36)" />
        {/* Hanging broken iron chain dangling from left beam */}
        <path d="M42,35 L42,65" stroke="#1c0509" strokeWidth="2" strokeDasharray="3 1.5" />
        {/* Broken stone rubble base */}
        <polygon points="16,105 32,100 38,105 28,110" fill="#140408" />
        <polygon points="76,105 92,100 98,105 88,110" fill="#140408" />
      </svg>
    </div>
  );
}

/** Bare Skeletal Gnarled Dead Wood - NO leaf pads, NO foliage, pure jagged dead wood */
function SkeletalDeadWood({
  x = '0%',
  bottom = 30,
  scale = 1,
  flip = false,
  opacity = 0.8,
}: {
  x: string;
  bottom?: number;
  scale?: number;
  flip?: boolean;
  opacity?: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        bottom: `${bottom}px`,
        transform: `scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`,
        transformOrigin: 'bottom center',
        opacity,
      }}
    >
      <svg width="140" height="170" viewBox="0 0 140 170" fill="none">
        {/* Gnarled, petrified black trunk splitting into jagged sharp branches */}
        <path
          d="M70,170 C68,140 76,118 60,95 C52,80 34,76 18,78 C25,74 38,68 52,72 C62,75 68,84 72,90 C75,70 88,58 108,52 C104,56 94,64 85,70 C80,74 76,82 75,95 C86,108 90,135 78,170 Z"
          fill="#0a0205"
        />
        {/* Jagged upper bare branch forks */}
        <path
          d="M72,90 L60,52 L42,38 M60,52 L74,32 L86,18 M85,70 L112,42 L132,30 M112,42 L118,22"
          stroke="#0a0205"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M52,72 L32,56 L15,48 M32,56 L24,35"
          stroke="#0a0205"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Smoldering ember glow points on broken branch tips */}
        <circle cx="18" cy="78" r="1.6" fill="#ff4d4d" opacity="0.85" />
        <circle cx="86" cy="18" r="1.8" fill="#ff3842" opacity="0.9" />
        <circle cx="132" cy="30" r="1.6" fill="#ff7a36" opacity="0.85" />
        <circle cx="15" cy="48" r="1.5" fill="#ff4d4d" opacity="0.8" />
      </svg>
    </div>
  );
}

/** Jagged Volcanic Rock Spire Formations jutting from subterranean abyss */
function VolcanicSpireFormation({
  x = '0%',
  bottom = 0,
  scale = 1,
  opacity = 0.8,
}: {
  x: string;
  bottom?: number;
  scale?: number;
  opacity?: number;
}) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: x,
        bottom: `${bottom}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'bottom center',
        opacity,
      }}
    >
      <svg width="100" height="150" viewBox="0 0 100 150" fill="none">
        {/* Sharp needle-like basalt crags */}
        <polygon points="50,15 65,95 75,150 25,150 35,95" fill="#080205" />
        <polygon points="25,50 38,105 45,150 10,150 15,110" fill="#0d0307" />
        <polygon points="75,60 88,110 95,150 60,150 68,105" fill="#0a0206" />
        {/* Glowing molten crack running down the main rock needle */}
        <path
          d="M50,18 L52,55 L48,90 L54,125 L51,150"
          stroke="rgba(255,43,54,0.6)"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>
    </div>
  );
}
