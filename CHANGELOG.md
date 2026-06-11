# Grapple Quest Changelog

## v1.5.0 — The Combat & Comeback Update (June 11, 2026)

### The Fundamentals Kit — combat reborn
- Every grappler now knows the basics: a weak-but-legal fundamental move for every
  position (Basic Takedown, Basic Pass, Basic Sweep, Basic Mount, Basic Escape...).
  Your equipped moves are your SPECIALIZATION — fundamentals mean no position is
  ever a dead end. Sim-verified: dead turns 53.5% → ~18%, Spaz Out 47% → 11% of
  turns, real technique usage 37% → 70%.
- Spaz Out returns to being a desperation gamble, not half the game.

### Smarter, scarier opponents
- AI opponents now have belt-scaled movesets (white 4 → black 12 moves) drawn from
  per-archetype pools. Worlds finalists finally fight like Worlds finalists.
- Judo Heavy can actually play (clinch entry + standing Osoto Gari) — was 0.8%
  sim win rate, now ~38%.
- AI values position advancement, not just damage.

### Balance overhaul (6,720-match sim verified per change)
- Sweeps now roll against the top player's BASE (mirror of guard retention).
- Sweeps score 2 (sweep) — no more 4-point mount-sweep treadmill.
- Pulling guard is no longer free (88 acc / 8 stamina, was 100/5).
- Whiffed submissions no longer farm advantages.
- Submission defense: TGH weighted up, repeated sub attempts get read (+6 defense
  per repeat), defender stamina bleed on failed subs reduced.
- Escapes from mount/side/back roll against the top player's control.
- Frame mods softened — light frames no longer strictly better.
- POSITIONAL PRESSURE: hold a dominant position and it mounts — your submissions
  sharpen, the bottom player bleeds stamina. Visible pressure pips on the HUD.

### The daily layer — reasons to come back
- FRESH LEGS: first 3 wins each day earn 2× XP. Never blocks play.
- DAILY ROLL: one seeded challenger per day — the same build for every player on
  Earth. One attempt. Win streaks, streak bonuses, bragging rights.
- THE COACH'S GIFT: once a day, your coach has something for you.
- LEARN BY GETTING CAUGHT: tapped by the same technique twice → you've felt it
  from the inside. Learn it, free. Losses literally teach.

### Sound
- 9 region BGM loops (generative chiptune — square lead, triangle bass, per-region
  key/tempo/mood). The game is no longer silent. Volume in settings.

### Your gym remembers
- Tournament golds hang as pennants on your home gym wall; region stamps display
  as shields. Your career, rendered where you train.

### Quality of life
- Canvas text outlined — readable on every mat (was invisible on gold tatami).
- Key-moment splashes: TAKEDOWN! / SWEEP! / GUARD PASSED! / TAP!! land on the
  canvas, not just the log.
- Scout panel lists the opponent's actual known techniques after first fight.
- Profile stat bars scale relative to your best stat (were all maxed at /50).
- Home gym mat surface regenerated (was a flat green rectangle).
- MAX RANK XP bar renders full.

## v1.4.0 — Launch Readiness: Share, Compete, Measure (June 10, 2026)

### Share Cards
- Belt promotions and victories render a 1080×1080 pixel-art share card — your sprite, your name, your gym, your record — via native share sheet (download fallback)
- Black belt promotion gets the WORLD CHAMPION card treatment
- "UPDATE YOUR FIGHTER ART" shortcut on the promotion screen

### Challenge Links
- "⚔ CHALLENGE A FRIEND" (profile + post-match) serializes your fighter into a URL
- Friends battle your build — decoded with full validation/clamping (anti-cheat), works with zero backend
- Pending challenges surface on the title screen and overworld tray

### Gym Leaderboard
- Every win counts for your gym name — TOP GYMS board (world map button, /gyms)
- Backed by Netlify Blobs, no accounts needed

### Position-Driven Battle Visuals
- Fighters now COMPOSE by mat position: supine bottom player, top player standing over/leaning, turtle piles, back-control stacks, leg-entanglement feet-to-feet
- Winner stands over the beaten opponent at match end
- Ground shadows under both fighters; particle FX anchors follow the live layout
- Stamina is now the hero HUD bar (it decides matches); HP demoted to a slim strip; GASSED! indicator

### Balance
- Repeat-move read: spamming the same technique loses 7 accuracy per consecutive repeat (max -21) — "They're reading the armbar!" Chains of different moves still get their bonus
- AI avoids getting read the same way
- Move panel now shows ALL legal moves (was silently capped at 4)
- Iron Coast region tint lifted — was unreadably dark

### Onboarding
- All cinematics are tap-to-advance (timers remain as fallback) — no more forced waits
- First-battle tutorial: 3 taps covering position/stamina/scoring, once ever, skippable
- "NEXT ▸" objective breadcrumb on the overworld — always know your next gate, with live progress (e.g. "beat training partners (1/2)")

### Growth Infrastructure
- First-party analytics: daily event counters via Netlify Blobs (sessions, funnel, retention buckets, shares) — /api/track, /api/stats. No cookies, no PII
- Full OG/Twitter/JSON-LD meta + 1200×630 share image — links finally unfurl
- PWA manifest + icons (installable, standalone)
- Sprite generation caps: 5 per device + global monthly budget (PixelLab credits cost real money)

## v1.2.0 — AI Sprites + Polish (April 9, 2026)

### AI-Generated Sprites (PixelLab Integration)
- 5 belt evolution sprites: wimpy white belt → zen black belt master
- Visual progression — fighter gets bigger, more muscular, more confident per belt
- Sprites render in battle canvas at 2x scale (64px)
- Preloaded on app start, cached in memory
- Priority system: custom sprite > belt sprite > programmatic sprite

### Sprite Creator
- Upload photo → AI converts to 32x32 pixel art fighter
- Generate belt-specific sprite without photo
- Preview at 4x zoom before saving
- Netlify Function backend (PIXELLAB_SECRET env var)
- Accessible from MENU → SPRITE button

### Move XP / Technique Mastery
- Every move gains XP when used (3 per hit, 1 per miss)
- 10 mastery levels: New → Familiar → Practiced → ... → Mastered
- Per level: +1 accuracy, +2 power, -0.5 stamina cost
- Results screen shows TECHNIQUE GROWTH section
- Move Dex shows mastery level per move

### Screen Transitions
- All screens fade in (0.25s CSS animation)

### Rival at Tournaments
- Kenzo dialogue appears at tournament registration (first time per tournament)

### Balance Changes
- Stat formula floor +5 → +8 (white belt stats more viable)
- Match turns: white 12, blue 14, purple 16, brown 18, black 22
- Win money: $35 + turns*2 (up from $25)
- EV training items: $50 (down from $80)
- XP scales by opponent belt (1x white → 3x black)
- Random encounter rate: 8% per step (was 15%, was also firing every frame)

### Bug Fixes
- Items tab now visible in StatsScreen (was built but not in tab bar)
- Consumable items auto-apply at battle start (tape, acai, electrolytes, gel)
- Rival style map covers all 8 archetypes (was only 3)
- JSON.parse safety on all save/load (crash prevention)
- Recursive executeMove depth limit (prevents infinite loop)
- Random encounters only fire on step completion (not every frame)
- 3 duplicate move IDs fixed (clock-choke, kob-armbar, ns-to-mount)
- Summit City stamp requirement 8 → 7 (was impossible)
- Coral Bay tournament desk NPC added (was missing)
- Bracket name generator safety valve (prevents infinite loop)
- clearAll() removes ALL rollcraft-* localStorage keys
- World map two-tap travel (first tap = info, second = travel)
- NPC wins tracked by name (Scramble Valley actually unlockable)
- 404 catch-all route added

### Regions 3-9
- Old Town: Master Tanaka (controller), 3 NPCs, Old Town Classic tournament
- Steel Mountain: Iron Mike (wrestler), 3 NPCs, Steel Invitational
- Coral Bay: Marina (guard-player), 3 NPCs + tournament desk, Coral Bay Pro
- Sambo District: Viktor (judoka), 3 NPCs, Sambo Cup
- Nova Camp: Dr. Yun (sub-hunter), 3 NPCs, Nova Pro (SUB-ONLY)
- Iron Coast: The Professor (pressure), 3 NPCs, Grand Prix ($10K gold)
- Summit City: World Championship ($25K gold), The Ghost, legends

### New Moves
- 18 gap-filling moves for weak positions (KOB bottom, NS bottom, turtle, etc.)
- Boot & Scoot (universal leg entanglement escape)
- Can Opener + Standing Guard Break (closed guard top)
- Half-guard bottom submissions unlocked (kimura, electric chair, baseball choke)

## v1.0.0 — Launch (April 8-9, 2026)

### Combat Engine
- 165+ real BJJ techniques across 12 positions
- 8 grappler styles with type matchup chart
- Pokemon Gen 1 damage formula (STAB, type effectiveness, crits)
- 6 combat mechanics: momentum, impact/flinch, guard retention, fatigue curve, setup/grip moves, frame/weight class
- IBJJF-accurate point scoring (takedown 2, sweep 2, pass 3, mount 4, back 4)
- 3-phase submission minigame with tension bar and stat breakdown
- Advantages for near-submissions and deep attempts
- Guard retention rolls on pass attempts (FLX+TEC vs power+STR)
- Stalling penalties (consecutive stalls = advantage for opponent)
- SPAZ OUT universal scramble (works from any position, last resort)
- Sequential turns with speed-based initiative
- Fatigue phases: Fresh → Burn → Second Wind → Grind
- Critical hits based on position + speed + chain + momentum

### World & Progression
- 9 playable regions: Home Gym, Scramble Valley, Old Town, Steel Mountain, Coral Bay, Sambo District, Nova Camp, Iron Coast, Summit City
- 9 tournaments from local opens ($50) to World Championship ($1,000 / $25,000 gold)
- 30+ unique NPCs with style-specific stats, EVs, frames, and dialogue
- Belt system: white → blue → purple → brown → black
- Move slots per belt: 5/7/9/11/13
- EV training at instructors and via items
- Move learning from instructors (Mat Bucks cost)
- Move management: equip/unequip from learned pool
- Coach-gated belt promotions with cinematic dialogue
- World map with unlock requirements (belt, stamps, tournament wins, NPC wins)
- Drop-in fees for visiting gyms ($20-$100)
- Random mat encounters (8% per step on mat tiles)
- Opponent scouting (SCOUT button — fuzzy stats after first fight)
- Difficulty labels: EASY/MEDIUM/HARD/IMPOSSIBLE

### Story
- Rival Kenzo with 8 encounters across the game (opposite style to player)
- Cinematic onboarding: walk in → coach greets → pick group → train → fight Kenzo → he storms out
- Coach dialogue for all belt promotions
- 9 gym leader characters with unique personalities and dialogue
- Region arrival story text with rival encounters
- World Championship arc designed (semi vs The Ghost, finals vs Kenzo)
- Post-credits: player repeats coach's words to a new white belt

### Economy & Items
- Mat Bucks currency earned from matches and tournaments
- Item shop at instructors: Athletic Tape, Acai Bowl, Electrolytes, Energy Gel
- Training items: Protein Powder, Yoga Pass, Sprint Program, Cardio Program
- Consumables auto-apply at battle start from inventory
- XP scales by opponent belt (1x white → 3x black)

### Audio
- 12 synthesized sound effects via Web Audio API (zero audio files)
- Hit, critical hit, miss, submission lock, tap/finish
- Points scored, time up, stunned, escape
- Menu select, belt promotion fanfare, level up jingle

### UI/UX
- 480px game-shell centered on desktop with dark frame
- Mobile-first with invisible joystick + A button
- CSS variable font sizes, small phone scaling
- Button hover glow on desktop, disabled grayscale
- Move buttons with style-color left border and category icons
- Stamina/HP bars change color (green → amber → red)
- Momentum fire indicators on battle canvas
- Opponent shake on hit animation
- Battle log with color-coded lines and copy button
- Match pacing: first actor shows, pause, second actor responds
- Move Dex with completion tracking
- Stats/Moves/Items tabs in fighter profile
- Two-tap world map travel with info panel

### Technical
- React 19 + Vite 8 + TypeScript
- Canvas 2D for battle and overworld rendering
- Programmatic pixel sprites with configurable gi/belt colors
- localStorage persistence with backward compatibility
- HashRouter for SPA deployment
- Netlify deployment at GrappleQuest.com
- Production TypeScript strict mode
- JSON.parse safety on all save/load operations
