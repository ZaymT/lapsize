You are an expert full-stack TypeScript engineer, computational geometry specialist, and elite UI/UX designer.

Build a production-grade, highly polished web game called "LapSize" (or "GridScale") — an interactive relative size-comparison daily challenge for motorsport fans (Formula 1, NASCAR, and IndyCar), modeled after spatial guessing mechanics like Airspan.

================================================================================
CRITICAL DESIGN & ANTI-VIBECODE MANDATES
================================================================================
1. ZERO "VIBECODED" TOY PATTERNS:
   - Do NOT use placeholder popups, alert() boxes, stubbed Math.random() scoring, fake loading bars, or generic SaaS purple/blue drop-shadow cards.
   - Do NOT draw arbitrary approximate squiggles or generic oval loops. Every track must use real geographic/survey coordinates or authentic vectorized GP track geometry scaled to real-world metric ground truth.
   - Build a tactile, bespoke motorsport telemetry aesthetic: deep carbon slate backgrounds (`#0B0E14`), high-contrast vector lines, monospace technical readouts (`JetBrains Mono` or `Fira Code`), micro-interactions, spring physics reveals, and authentic race timing color accents (FIA electric cyan, racing yellow, telemetry red).

2. COMPREHENSIVE DATA SOURCING REQUIREMENT:
   - Use your tools, internet access, and knowledge retrieval to research and extract the genuine real-world geographic coordinates, bounding footprints (in meters), and official track layout lengths for all included tracks across F1, NASCAR, and IndyCar.
   - Ground-truth references: OpenStreetMap (`highway=raceway` via Overpass), satellite bounding boxes, and official FIA/sanctioning body circuit guides.
   - The database must include all the tracks you can find (for nascar, include ones that are in the o'rielly and truck serires) across all three disciplines:
     * Formula 1: Monaco (Monte Carlo), Spa-Francorchamps, Silverstone, Monza, Circuit of the Americas (COTA), Suzuka, Red Bull Ring, Interlagos.
     * NASCAR: Martinsville Speedway (0.526 mi paperclip), Bristol Motor Speedway (0.533 mi colosseum), Daytona International Speedway (2.5 mi tri-oval), Talladega Superspeedway (2.66 mi tri-oval), Charlotte Motor Speedway (1.5 mi quad-oval), Darlington Raceway (egg-shaped).
     * IndyCar: Indianapolis Motor Speedway (IMS Oval, 2.5 mi / 1,000+ acre grounds), Long Beach Street Circuit, Mid-Ohio Sports Car Course, WeatherTech Raceway Laguna Seca.

================================================================================
CORE GAME MECHANIC & INTERACTION ENGINE
================================================================================
In each round:
1. Two tracks are compared:
   - Reference Track (Anchor): Rendered with an electric cyan vector stroke at a locked, calibrated viewport scale.
   - Target Track (Guess): Rendered with a high-contrast amber/yellow neon stroke. Starts at a randomized, incorrect scale (between 0.25x and 3.0x of its true relative metric size) and offset from the reference.

2. User Controls & Kinematics:
   - Free Drag & Drop: Smooth translational panning of the target track across the stage with momentum and zero input lag.
   - Multi-Modal Resizing:
     * High-precision on-screen slider with coarse scrubbing and fine ±0.5% nudge buttons.
     * Mouse scroll-wheel and trackpad pinch gestures directly over the canvas.
     * Mobile touch pinch-to-zoom gestures.
   - Quick Alignment: A 90° rotation toggle to allow users to orient track straightaways without modifying scale.
   - Opacity & Ghosting Slider: Toggle overlay translucency to see overlap clearly.

3. The "Lock In" Reveal:
   - The player commits their estimate.
   - The player's guessed outline freezes in place as a ghosted dashed line.
   - An animated spring interpolation smoothly transitions the target track from the user's guessed scale to its exact real-world scale relative to the reference track.
   - The camera auto-pans and zooms to frame both tracks centered in the viewport.
   - Telemetry Drawer Slides Up: Displays the mathematical delta, actual bounding dimensions (width × height in meters/feet), total enclosed land acreage/hectares, official lap distance, and a contextual scale fact (e.g., "The entire Circuit de Monaco layout comfortably fits inside the infield of Daytona International Speedway 4.2 times").

================================================================================
MATHEMATICAL SCORING ALGORITHM
================================================================================
Scoring must be mathematically rigorous, symmetric, and penalize over- and under-estimates equally:
1. Let $R = \frac{\text{Guessed Scale}}{\text{Actual Scale}}$
2. Compute directional accuracy:
   $\text{Accuracy} = \min(R, \frac{1}{R})$
3. Calculate round score ($0$ to $100$):
   $\text{Score} = \text{round}\left(100 \times \left(\text{Accuracy}\right)^{1.75}\right)$
   - Within $\pm 3\%$ error $\rightarrow$ 95–100 pts (Flawless)
   - Within $\pm 10\%$ error $\rightarrow$ 80–94 pts (Great)
   - Within $\pm 25\%$ error $\rightarrow$ 50–79 pts (Decent)
   - Scaling 2.0x or 0.5x $\rightarrow$ ~29 pts
4. 5 rounds per game session (Max score: 500).
5. Shareable summary card with emoji telemetry grid (e.g., `LapSize #24 • 478/500 🏁 🟩🟩🟩🟨🟩`).

================================================================================
GAME MODES & ARCHITECTURE
================================================================================
Provide a mode switch in the header:
- Daily Race (Ranked): Synchronized 5-round seed for all players based on the current UTC date.
- Formula 1: Tight street layouts vs. vast continental circuits.
- Oval & Speedway (NASCAR): Short-track paperclips vs. 2.66-mile superspeedways.
- IndyCar & Road Course: High-speed road courses vs. urban street venues.
- Open Class (Chaos Mode): Cross-discipline matchups (e.g., Martinsville vs. Spa; IMS Oval vs. Monaco).

Tech Stack & File Structure:
- Next.js 14+ (App Router) or Vite + React 18+ with strict TypeScript.
- Tailwind CSS with bespoke dark telemetry theme (`slate-950`, `zinc-900`, `cyan-400`, `amber-400`, `emerald-400`).
- Canvas/SVG Rendering: Performant SVG paths wrapped in hardware-accelerated CSS transforms or a dedicated gesture engine (`@use-gesture/react` or D3 matrix transforms).
- LocalStorage persistence for user streaks, daily puzzle completion, and score history.

================================================================================
REQUIRED COMPLETE IMPLEMENTATION
================================================================================
Generate the complete, working production codebase without skipping code or leaving "// implement here" comments:

1. `src/types/game.ts`: Complete data models for Track, TransformState, RoundResult, and GameMode.
2. `src/data/tracks.ts`: The full dataset of the 18+ circuits specified, containing accurate real-world boundingWidthMeters, boundingHeightMeters, official lap length, SVG path data (normalized to a clean standard viewBox), country, series, and scale trivia facts.
3. `src/hooks/useCanvasTransform.ts`: Custom hook implementing drag, scroll/pinch scaling, rotation, and boundary constraints with smooth 60fps rendering.
4. `src/components/TrackCanvas.tsx`: Interactive SVG stage displaying reference and target tracks, scale grid lines, scale ruler in meters, and touch/gesture handlers.
5. `src/components/Controls.tsx`: Telemetry HUD featuring precision scrubber, zoom steppers, rotate button, and "Lock In" trigger.
6. `src/components/RevealModal.tsx`: Visual post-round breakdown showing the difference between guess and reality, percentage accuracy, and contextual track trivia.
7. `src/components/ScoreCard.tsx`: End-of-game summary with streak tracking and clipboard-ready Wordle-style share formatting.
8. `src/App.tsx` (or `page.tsx`): Main orchestrating view tying together game state, daily seed generation, and series filters.