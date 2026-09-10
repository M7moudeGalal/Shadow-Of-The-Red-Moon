# SHADOW OF THE RED MOON (影の赤月)
## Complete Game Design & Technical Architecture Document

---

# 1. Executive Summary & High Concept

**Shadow of the Red Moon** is a dark, atmospheric 2D action platformer built with modern web technologies. Drawing inspiration from indie masterpieces like **Hollow Knight: Silksong** and the feudal aesthetics of **Sekiro: Shadows Die Twice**, the game immerses players in the role of a lone shinobi navigating cursed Japanese infernos beneath a bleeding crimson moon.

### Key Pillars
- **Atmospheric Feudal Art Direction**: Lacquered ink tones, vermilion red accents, misty mountain parallax, authentic Japanese pine silhouettes (*Matsu*), Torii gate monoliths, dynamic blood rain, and boiling blood seas.
- **Fluid, High-Mobility Shinobi Traversal**: Tight acceleration, variable jump arcs, 24-frame somersault Double Jump, instant Shift-key shadow dashes, and precision aerial gap-clearing mechanics.
- **Impactful Real-Time Combat & Technique Arsenal**: Ground katana slashes, 4 distinct Ninja Attack Skills (Shadow Dash Strike, Crimson Slash Combo, Crimson Blade Wave, Blood Spin Slash), precision Hold-to-Parry deflections, and horizontal shuriken throws.
- **Dual-Map Story Campaign**:
  - **Map 1: Yunami Jigoku (湯波地獄)**: Infernal volcanic hot spring temple with forced ground clearing battles and aerial wyvern encounters.
  - **Map 2: Chinoike Jigoku (血の池地獄)**: Bleeding sky abyss with continuous blood rain, bottomless boiling blood seas, and a sealed grand pagoda boss sanctum.
- **Intelligent Master Boss AI (Hanzo the Shadowmaster)**: Multi-phase grandmaster boss featuring smart tri-attack combos (Rising Slash, Spin Slash, Teleport Strike) inside an inescapable sealed arena.
- **Zero-Dependency Procedural Audio**: Built-in Web Audio API synthesizer generating real-time sword slashes, metal clashes, dash whooshes, and temple bells.
- **Console-Grade Standalone Immersion**: Seamless full-screen scaling, automatic cursor hiding in combat, responsive HUD, and in-game codex overlays (*Scroll of the Shinobi*).

---

# 2. Technical Stack & Architecture

```
                                +---------------------------+
                                |         App.tsx           |
                                | (Full-screen Game Shell)  |
                                +-------------+-------------+
                                              |
                     +------------------------+------------------------+
                     |                                                 |
         +-----------v-----------+                         +-----------v-----------+
         |      router.tsx       |                         |    soundEffects.ts    |
         | - Page State Machine  |                         | - Web Audio Synths    |
         | - Global Fullscreen   |                         | - Procedural SFX      |
         | - Codex Modal Overlay |                         | - Global Mute Manager |
         +-----------+-----------+                         +-----------------------+
                     |
  +------------------+-------------------+--------------------+------------------+
  |                  |                   |                    |                  |
+-v----------+  +----v-------+      +----v--------+      +----v-------+     +----v-------+
|  HomePage  |  | GameScreen |      | HowToPlay   |      | AboutPage  |     | GameOver / |
| (Silksong  |  | (Viewport  |      | (Scroll of  |      | (Temple    |     | Victory    |
| Title Menu)|  |  & Loop)   |      |  Technique) |      | Chronicles)|     |  Screens   |
+------------+  +----+-------+      +-------------+      +------------+     +------------+
                     |
         +-----------v-----------+
         |   useGameEngine.ts    |
         | - 60 FPS Tick Loop    |
         | - 2D Physics & AABB   |
         | - Multi-Map Engine    |
         | - Hanzo Boss Combos   |
         | - Double Jump & Dash  |
         | - Camera Arena Locks  |
         +-----------+-----------+
                     |
     +---------------+---------------+---------------+
     |                               |               |
+----v--------------------+    +-----v---------+    +v----------------------+
| CorruptedSamuraiChar    |    | CorruptedBat  |    | HanzoCharacter        |
| - 7 Animation States    |    | - Wyvern AI   |    | - Smart Tri-Attacks   |
| - Melee Combat AI       |    | - Full Sky AI |    | - Teleport & Spin AI  |
+-------------------------+    +---------------+    +-----------------------+
```

### Technology Matrix
| Domain | Technology / Specification |
| :--- | :--- |
| **Framework** | React 18 with TypeScript (Strict Mode) |
| **Bundler & Dev Server** | Vite 5 |
| **Styling & Design Tokens** | Tailored Vanilla CSS Variables + Utility Classes |
| **Audio Engine** | Web Audio API (Oscillators, Biquad Bandpass Filters, Noise Generators) |
| **Character Rendering** | Custom Multi-Frame PNG Sprite Renderers with CSS Flip Mirroring & Object Alignment |
| **Target Viewport** | Virtual Coordinate Stage $800 \times 450$ (16:9 Aspect Ratio) dynamically scaled to any display |

---

# 3. Project Directory Structure

```
c:/Games/project/
├── public/
│   └── assets/sprites/
│       ├── player/                       # Shinobi sprite suites (idle, run, jump, double jump, dash, attack, attacks/, parry, shuriken)
│       └── enemies/
│           ├── samurai/                  # Corrupted Samurai suites (idle, walk, chase, jump, attack, damage, death)
│           ├── corrupted-bat/            # Wyvern suites (spawn, idle, fly, claw-attack, dive, death)
│           └── hanzo/                    # Hanzo Boss suites (idle, run, jump, slash, rising, spin, teleport, damage, death)
├── src/
│   ├── components/
│   │   ├── AtmosphericBackground.tsx     # Multi-layer parallax, blood rain, moon, pines, bamboo & torii
│   │   ├── CorruptedBatCharacter.tsx     # Wyvern sprite renderer (Idle, Fly, Claw, Spawn, Death)
│   │   ├── CorruptedSamuraiCharacter.tsx # Corrupted Samurai sprite renderer (7 animation states)
│   │   ├── HanzoCharacter.tsx            # Hanzo Boss multi-technique sprite & afterimage renderer
│   │   ├── Navbar.tsx                    # Audio, fullscreen, and codex controls
│   │   └── NinjaCharacter.tsx            # Shinobi multi-state sprite & effect renderer
│   ├── game/
│   │   ├── level.ts                      # Level geometry for Yunami Jigoku and Chinoike Jigoku
│   │   ├── soundEffects.ts               # Procedural Web Audio synthesizer engine
│   │   ├── types.ts                      # TypeScript interfaces (Player, Enemy, Rect, AnimState, LevelData)
│   │   └── useGameEngine.ts              # 60 FPS physics, AABB collisions, combat, boss combos & camera
│   ├── pages/
│   │   ├── AboutPage.tsx                 # "Temple Chronicles" lore codex modal
│   │   ├── GameOverPage.tsx              # Death screen with statistics and rank seals
│   │   ├── GameScreen.tsx                # Main interactive canvas, HUD, Blood Sea shaders, arena seals
│   │   ├── HomePage.tsx                  # Standalone Silksong-inspired Title Screen
│   │   ├── HowToPlayPage.tsx             # "Scroll of the Shinobi" codex overlay modal
│   │   └── VictoryPage.tsx               # Mission Complete victory screen with S/A/B/C ranks
│   ├── App.tsx                           # Global application root & modal controller
│   ├── index.css                         # Global design system, typography, keyframes & colors
│   ├── main.tsx                          # React DOM entry point
│   ├── router.tsx                        # Global page router, fullscreen manager & audio sync
│   └── vite-env.d.ts                     # Vite TypeScript declaration types
└── package.json
```

---

# 4. Art Direction & Visual Design System

## 4.1 Color Palette
The color system reflects feudal Japanese lacquerware, blood-stained nights, and gold leaf:

| Token Name | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `--ink-0` | `#05070d` | Deep Void Black (Root Background) |
| `--ink-1` | `#0b101c` | Night Sky Midtone & Shading |
| `--ink-2` | `#111726` | Card Surfaces & Lacquer Modals |
| `--red-bright` | `#ff3b46` | Katana Strike Trails, Skill Shockwaves, Damage Numbers |
| `--red` | `#e0252e` | Primary Vermilion Accent, Scarf Ribbon & Blood Rain |
| `--red-deep` | `#7a1318` | Shadowed Armor Plates, Blood Sea Depths & Enemy Hitboxes |
| `--gold` | `#e9c46a` | Collectible Shurikens & Coins, Torii Gate Silhouettes, A-Rank Seal |
| `--jade` | `#5fb39a` | Mystic Jade Checkpoints, Status Indicators, B-Rank Seal |
| `--paper` | `#efe6d2` | Ancient Parchment Foreground Text & Kanji |
| `--paper-dim` | `#9c9484` | Muted Subtitles, Legends & Keybinding Descriptions |

## 4.2 Dynamic Atmospheric FX
- **Bleeding Sky & Blood Rain (血の雨)**: In Chinoike Jigoku, crimson blood droplets streak down across the viewport with randomized velocities and wind offsets.
- **The Boiling Blood Sea (血の海)**: Multi-layered undulating SVG waves with boiling bubble particles, glowing foam crests, and depth-fog gradients lining the map floor.
- **Enhanced Crimson Moon (影の赤月)**: Large $210\text{px}$ crimson lunar monolith featuring detailed SVG lunar maria, craggy crater rims, pulsating corona aura, and soft red light spill onto drifting cloud ribbons.
- **Boss Arena Blood Barrier (血界封印)**: Massive vertical crimson barrier with pulsing runes, locking the ninja inside Hanzo's sanctum until the duel concludes.

---

# 5. Shinobi Player Character Systems (`NinjaCharacter.tsx`)

Rendered inside a $44 \times 64\text{px}$ visual container centered over the $28 \times 48\text{px}$ collision hitbox.

### Animation States
| Animation State | Frame Count | Cadence | Visual Description |
| :--- | :---: | :---: | :--- |
| **Idle** | 6 frames | $110\text{ms}$ | Breathing stance with fluttering vermilion scarf |
| **Run** | 6 frames | $80\text{ms}$ | Low-profile forward ninja sprint |
| **Jump** | 6 frames | $75\text{ms}$ | Upward leap with tucked legs and ready katana |
| **Double Jump** | 24 frames | $22\text{ms}$ | Full airborne somersault spin with blade trails |
| **Fall** | 6 frames | $85\text{ms}$ | Streamlined downward aerodynamic descent |
| **Land** | 4 frames | $60\text{ms}$ | Ground impact crouch with dust puff kick |
| **Speed Dash** | 6 frames | $33\text{ms}$ | Billowing crimson smoke trail, dust blast, and trailing shadow afterimages |
| **Ground Attack** | 8 frames | $45\text{ms}$ | Two-handed horizontal katana slash with vermilion arc |
| **Shadow Dash Strike** | 8 frames | $50\text{ms}$ | Swift shadow lunge with afterimages piercing through enemy lines (Shift + Attack) |
| **Crimson Slash Combo** | 10 frames | $50\text{ms}$ | Relentless advancing multi-hit katana flurry (W + Attack) |
| **Crimson Blade Wave** | 10 frames | $50\text{ms}$ | Rapid energy release launching a piercing crimson projectile wave (C key) |
| **Blood Spin Slash** | 8 frames | $50\text{ms}$ | Lightning-fast 360° circular whirlwind blade spin hitting all surrounding foes (Hold Attack) |
| **Shuriken Throw** | 20 frames | $22\text{ms}$ | Body windup, whip-forward release at frame 10, follow-through |
| **Parry / Defend** | 24 frames | $30\text{ms}$ | Stationary ready guard pose & dynamic deflection swing |
| **Damage** | 4 frames | $65\text{ms}$ | Recoil stagger with white silhouette hit-stop flash |
| **Death** | 6 frames | $100\text{ms}$ | Fatal collapse with blood mist dissipation |

---

## 5.1 Advanced Movement & Combat Mechanics

### Double Jump System (`Space` twice in air)
- **Input Behavior**: First <kbd>Space</kbd> executes standard jump ($v_y = -14.5$). Pressing <kbd>Space</kbd> a second time in mid-air activates the Double Jump.
- **Physics**: Resets vertical velocity to $v_y = -10.5\text{ px/frame}$, granting $+96\text{px}$ additional vertical lift (total max vertical clearance $\approx 228\text{px}$ from ground).
- **Animation**: Triggers the dedicated 24-frame airborne acrobatic somersault rotation.
- **State Rules**: Allowed strictly once per airborne cycle. Landing on solid ground or any platform immediately re-arms the double jump flag. Pressing <kbd>Space</kbd> repeatedly will not allow infinite jumps.

### Shift-Key Speed Dash (`Shift` / `K` / `E` Key)
- **Primary Input**: Activated via <kbd>Shift</kbd> (supported by secondary keys <kbd>K</kbd> and <kbd>E</kbd>).
- **Stamina System (`気力`)**: Max stamina = 100. Each dash consumes 50 stamina (up to 2 stored dashes).
- **5-Second Recharge**: Recharges from empty (0) to full (100) in exactly 5.0 seconds ($0.333\text{ stamina/frame}$ at 60 FPS).
- **Depletion Constraint**: Cannot dash when stamina is under 50. The HUD displays a pulsing crimson `RECHARGING` indicator.
- **Invulnerability & Afterimages**: Grants 12 frames ($200\text{ms}$) of complete I-frames. Spawns dynamic fading shadow clones every 2 frames with directional foot dust blasts.
- **Dash Gap Traversal**: Combines seamlessly with Double Jump to clear wide chasm gaps ($220 - 240\text{px}$) and escape deep sunken alcoves ($\Delta y = 190\text{px}$).

### Ninja Attack Skill System (4 Distinct Martial Arts)
The Ninja wields 4 specialized martial techniques alongside the standard 3-hit Katana combo:
1. **Shadow Dash Strike (`Shift + Attack`)**: Blurring forward with swift speed ($v_x = \text{facing} \times 8.5$) through enemy hitboxes, leaving trailing shadow ghosts and inflicting 2.0 DMG.
2. **Crimson Slash Combo (`W + Attack` / `Up + Attack`)**: An aggressive advancing dual-phase sword combination dealing two separate 1.5 DMG strikes.
3. **Crimson Blade Wave (`C` Key)**: Unleashing a traveling crescent energy projectile that pierces forward across the stage (2.5 DMG).
4. **Blood Spin Slash (`Hold Attack` $\ge 18$ ticks)**: Charging power to release a 360-degree rotating whirlwind sword strike decimating enemies on both front and rear sides (2.5 DMG, 6.0 screen shake).

### Hold-to-Parry & Dynamic Deflection (`Ctrl` Key)
- **Input**: Hold down <kbd>Ctrl</kbd> to maintain protective guard on ground or in mid-air.
- **Deflection**: Intercepting any enemy strike negates all incoming damage ($0\text{ DMG}$), triggers the authentic Parry Effect GIF, staggers the attacker backward, and immediately restores $+25\text{ stamina}$ and $+25\text{ energy}$.
- **Dash-to-Parry**: Pressing <kbd>Ctrl</kbd> during a speed dash immediately cancels the dash into defensive guard.
- **Instant Counter**: Pressing Attack while holding <kbd>Ctrl</kbd> unleashes an immediate counter-slash without releasing guard.

### Shuriken Throwing & Collectibles (`Right-Click` / `X` Key)
- **Input**: Right-Click or press <kbd>X</kbd> to throw a spinning shuriken projectile.
- **Ammo System**: Consumes 1 shuriken per throw. Additional shurikens are hidden across platforms throughout the levels.
- **Projectile Flight**: Travels at $8.0\text{ px/frame}$ horizontally, pierces enemies for $1\text{ DMG}$, and spawns the authentic Shuriken Hit Effect on impact.

---

# 6. Enemies & Boss Architecture

## 6.1 Corrupted Samurai Ground Soldier (`CorruptedSamuraiCharacter.tsx`)
Heavy armored guards patrolling ground clearings and ruined pagoda terraces.
- **HP**: $3\text{ HP}$ (Segmented health bar).
- **Combat AI**: Patrols territory, sprints relentlessly toward the ninja upon line-of-sight detection, and leaps upward ($v_y = -11$) if the player attempts to bypass from above.
- **Forced Ground Combat**: Positioned directly on ground clearings with overhead bypass platforms eliminated.

## 6.2 Wyvern Aerial Hunter (`CorruptedBatCharacter.tsx`)
Aggressive winged demonic predators dominating the temple skies.
- **HP**: $2\text{ HP}$.
- **Flight AI**: Unrestricted 2D flight across sky space ($v_x = 2.5, v_y = 2.0$), swooping directly toward the player.
- **Lethal Talon Strikes**: Unleashes forward claw attacks when within $44\text{px}$ range.
- **Dual Section 6 Encounter (Yunami Jigoku)**: Operates simultaneously with the Corrupted Samurai on the Section 6 clearing ($x = 3560 - 4220$), creating a fierce ground-and-air synchronized battle.

## 6.3 Master Boss: HANZO the Shadowmaster (`HanzoCharacter.tsx`)
The corrupted grandmaster shinobi awaiting in the Grand Blood Pagoda Sanctum of Chinoike Jigoku.

```
                         +-----------------------+
                         |      HANZO IDLE       |
                         +-----------+-----------+
                                     |
               +---------------------+---------------------+
               |                                           |
    +----------v----------+                     +----------v----------+
    |    RISING SLASH     |                     |     SPIN SLASH      |
    | - Launching uppercut|                     | - 360° Whirlwind    |
    | - Anti-air leap     |                     | - Multi-hit slash   |
    +----------+----------+                     +----------+----------+
               |                                           |
               +---------------------+---------------------+
                                     |
                         +-----------v-----------+
                         |    TELEPORT STRIKE    |
                         | - Shadow disappear    |
                         | - Ambush behind ninja |
                         | - Overhead plunge     |
                         +-----------------------+
```

### Hanzo Boss Specifications
- **Hit Points**: $10\text{ HP}$ (Arcade-grade segmented boss health bar).
- **Arena**: Grand Blood Pagoda Sanctum ($x = 6000 - 7500$, Chinoike Jigoku).
- **Arena Seal Mechanics**: Upon player entry ($x \ge 6000$), an impenetrable Blood Seal Wall rises at $x = 5980$. The camera locks onto the sanctum. The ninja **cannot escape** until Hanzo is defeated!
- **Smart Tri-Attack AI Combo Engine**:
  1. **Rising Slash**: High-velocity upward launching slash with vertical blade arc, punishing airborne or jumping players.
  2. **Spin Slash**: Whirlwind $360^\circ$ rotating blade strike, dealing heavy damage across both sides.
  3. **Teleport Strike**: Hanzo dematerializes into dark shadow smoke and instantly reappears behind or above the player to strike.
- **Dynamic Combo Chaining**: Smart state machine evaluates player range, airborne status, and attack cooldowns to execute fluid combos (Spin $\to$ Rising, Rising $\to$ Teleport, Teleport $\to$ Spin).
- **Clean Visual Presentation**: Combo labels removed from the UI for a cinematic, uncluttered boss encounter.
- **Dynamic Boss Soundtracks**:
  - *Cinematic Intro Sting*: `Reaper_Blade_mp3.mp3` plays during the two visual intro phases (Dimensional Rift + Calligraphy Title Card).
  - *Battle Combat Theme*: `The Dragon Awakens.mp3` starts automatically the moment the two intros conclude, looping continuously through the fight until Hanzo's death.

---

# 7. Level Design & Environmental Systems

## 7.1 Map 1: YUNAMI JIGOKU (湯波地獄)
- **Theme**: Infernal Volcanic Hot Springs & Ruined Mountain Shrine.
- **Dimensions**: $6600\text{px} \times 720\text{px}$, Ground $Y = 600\text{px}$.
- **Combat Layout**:
  - **8 Corrupted Samurai Encounters**: Guarding Approach ($x=1020$), Courtyard ($x=2220$), Elevated Ruins ($x=3150$), Section 6 Clearing ($x=3900$), Volcanic Sanctum ($x=4750$), Deeper Temple ($x=5310$), Upper Overhang ($x=5740$), and Portal Altar ($x=6240$).
  - **2 Wyvern Aerial Encounters**: Section 6 Mid-Level Sky ($x=3800, y=320$) and Portal Threshold Sky ($x=6120, y=320$).
  - **Section 6 Dual Combat Clearing ($x=3560-4220$)**: Ground Samurai ($x=3900$) and aerial Wyvern ($x=3800$) attack simultaneously.
- **Streamlined Platforms (No Bypass Walkways)**:
  - Flying Mastabas are reserved strictly for crossing spike trenches and chasms. All overhead walkways above enemy zones have been eliminated to ensure **100% forced combat**.
- **Collectible Shurikens**:
  - **Shuriken #1**: $x=1240, y=430$ on Section 2 perch ($x=1200, y=470$).
  - **Shuriken #2**: $x=3100, y=430$ on Section 5 temple roof perch ($x=3060, y=470$) — easily reached via ground jump or platform landing.
  - **Shuriken #3**: $x=5400, y=430$ on Section 8 basalt pedestal ($x=5360, y=470$).
  - **Shuriken #4**: $x=2580, y=640$ inside the Sunken Shinobi Vault.
- **Section 4B: Sunken Shinobi Vault ($x=2474-2680, y=680$)**:
  - Precision platforming challenge: $\Delta y = 190\text{px}$ depth, peaceful and completely fire-free.
  - Escaping over the right basalt ledge ($y=490$) strictly requires combining **Double Jump + Dash**.
- **Level Exit**: Ancient Portal at $x=6460$ teleports the player directly into Chinoike Jigoku.

---

## 7.2 Map 2: CHINOIKE JIGOKU (血の池地獄)
- **Theme**: The Blood Pool Hell — Bleeding skies, bottomless crimson sea, and ancient corrupted pagodas.
- **Dimensions**: $7500\text{px} \times 900\text{px}$, Ground $Y = 820\text{px}$.
- **Atmospheric FX**:
  - **Blood Rain**: Crimson rain falling continuously from the dark clouds.
  - **Boiling Blood Sea**: Expansive bubbling ocean of boiling blood along the bottom of the chasm ($x=2800-4400$).
- **Combat Layout**:
  - **7+ Corrupted Samurai Encounters** guarding the descending ruins, altar terraces, and bottom battlegrounds.
  - **4 Corrupted Bat Predators** patrolling the open air above the blood chasms.
- **Section 3B: Sunken Blood Altar Alcove ($x=2750-2960, y=760$)**:
  - Precision platforming challenge: $\Delta y = 190\text{px}$ depth above the blood sea, fire-free.
  - Requires **Double Jump + Dash** to reach the upper escape platform ($y=570$).
- **Dash Gap Platforms**:
  - Mastaba platforms across descending ruins and blood chasms are separated by $220\text{px} - 230\text{px}$ gaps, requiring players to utilize Dash to bridge the distance.
- **Boss Arena: Grand Blood Pagoda Sanctum ($x=6000-7500$)**:
  - Sealed Blood Barrier activates at $x=5980$ upon entry.
  - Camera locks onto the arena.
  - Hanzo the Shadowmaster engages in the ultimate duel. Defeating Hanzo dissolves the barrier and unlocks the Golden Torii Victory Gate.

---

# 8. Complete Control Scheme Reference

| Action | Primary Input | Secondary / Alternative | Controller / Mobile |
| :--- | :--- | :--- | :--- |
| **Move Left** | <kbd>A</kbd> | <kbd>←</kbd> | Left Stick / D-Pad Left |
| **Move Right** | <kbd>D</kbd> | <kbd>→</kbd> | Right Stick / D-Pad Right |
| **Jump** | <kbd>Space</kbd> | <kbd>W</kbd> / <kbd>↑</kbd> | Bottom Face Button (A/Cross) |
| **Double Jump** | <kbd>Space</kbd> (in mid-air) | <kbd>W</kbd> / <kbd>↑</kbd> (in air) | Double tap Jump Button |
| **Speed Dash** | <kbd>Shift</kbd> | <kbd>K</kbd> / <kbd>E</kbd> | Right Trigger / Dash Touch Button |
| **Katana Attack (3-Hit Combo)** | <kbd>Left Mouse Click</kbd> | <kbd>J</kbd> | West Face Button (X/Square) |
| **Crimson Ground Breaker** | <kbd>S</kbd> + Attack | <kbd>↓</kbd> + Attack | Down + Attack Button |
| **Shadow Dash Strike** | <kbd>Shift</kbd> + Attack | <kbd>K</kbd> + Attack | Dash + Attack |
| **Crimson Slash Combo** | <kbd>W</kbd> + Attack | <kbd>↑</kbd> + Attack | Up + Attack |
| **Aerial Crimson Strike** | <kbd>Space</kbd> + Attack (in air) | Air + Attack | Jump + Attack |
| **Crimson Blade Wave** | <kbd>Hold Attack</kbd> ($\ge 18$ ticks) | Charge Attack | Charge Attack Button |
| **Blood Spin Slash** | <kbd>C</kbd> | — | Skill Button |
| **Defend / Parry** | <kbd>Ctrl</kbd> (Hold) | — | Left Bumper / Parry Button |
| **Shuriken Throw** | <kbd>Right Mouse Click</kbd> | <kbd>X</kbd> | North Face Button (Y/Triangle) |
| **Pause / Resume** | <kbd>ESC</kbd> | <kbd>P</kbd> | Start / Options Button |
| **Toggle Fullscreen** | <kbd>F</kbd> | — | Fullscreen Button |

---

# 9. Scoring, Evaluation & Ranks

$$\text{Final Score} = \text{Base Points} + (\text{Coins} \times 100) + (\text{Shurikens} \times 200) + (\text{Enemies Slain} \times 150) + \max(0, 3000 - \text{Time} \times 10)$$

| Rank | Requirement | Visual Emblem | Title |
| :---: | :--- | :--- | :--- |
| **S** | $> 4500\text{ pts}$ / Flawless Speed & Boss Defeat | Glowing Crimson Seal | Legendary Shadow Master (影の神) |
| **A** | $> 3500\text{ pts}$ | Radiant Gold Seal | Elite Shinobi (上忍) |
| **B** | $> 2500\text{ pts}$ | Jade Green Seal | Proven Assassin (中忍) |
| **C** | Completed Level | Muted Steel Seal | Temple Survivor (下忍) |
