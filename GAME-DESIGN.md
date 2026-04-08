# RollCraft -- Game Design Document

**Version:** 0.1.0 (Alpha)
**Last Updated:** April 7, 2026
**Platform:** Mobile-first web (React 19 + Vite 8 + TypeScript + Canvas 2D)

---

## 1. Overview

RollCraft is a turn-based BJJ fighting game inspired by Pokemon Generation 1. Two grapplers face off on the mat, selecting moves from their arsenal to advance position, deplete their opponent's HP, and hunt for the submission. Every mechanic is grounded in real Brazilian Jiu-Jitsu -- positions, transitions, submissions, and styles all reflect how the art actually works.

The game is built mobile-first with pixel art visuals, a Canvas 2D renderer, and a virtual D-pad + A-button control scheme. The current build includes full character creation, an overworld gym, NPC interactions, a complete battle engine, belt promotions, and a stats menu.

---

## 2. Core Loop

1. **Create your grappler** -- choose a name, gym name, coach name, gi color, and starting path (Wrestlers, Guard Players, or Leg Lockers).
2. **Explore the gym** -- walk around the pixel art overworld, talk to NPCs (Professor, Instructors, Training Partners).
3. **Roll (fight)** -- challenge a training partner to a match. Turn-based combat with move selection, position tracking, and submission mini-games.
4. **Earn XP** -- win or lose, gain experience. Level up. Learn new moves.
5. **Get promoted** -- hit belt thresholds to receive cinematic belt promotions from your coach. Unlock more move slots.
6. **Repeat** -- train harder, fight tougher opponents, climb the belt ladder.

---

## 3. Grappler System

### 3.1 Styles (Pokemon Types)

Eight grappler styles function as the type system. Each style has offensive and defensive matchups against every other style.

| Style | Identity | Color |
|-------|----------|-------|
| **Wrestler** | Takedown pressure, top control | Red `#e74c3c` |
| **Judoka** | Explosive throws into crushing pins | Orange `#f39c12` |
| **Guard Player** | Sweeps and submissions from bottom | Green `#2ecc71` |
| **Pressure Passer** | Smash through guards with weight | Purple `#8e44ad` |
| **Leg Locker** | Hunt the legs -- heel hooks, kneebars | Dark Orange `#e67e22` |
| **Berimbolo** | Inversion, back-takes, scrambles | Cyan `#00bcd4` |
| **Sub Hunter** | Always hunting the tap, chain attacks | Pink `#e91e63` |
| **Controller** | Methodical positional chess, three steps ahead | Blue `#3498db` |

### 3.2 Style Matchup Chart

An 8x8 effectiveness matrix determines damage multipliers:

- **2.0x** -- Super effective (dominant matchup)
- **1.5x** -- Effective (favorable matchup)
- **1.0x** -- Neutral
- **0.5x** -- Not very effective (bad matchup)

Key matchups (attacker vs defender):
- Guard Player vs Wrestler = 2.0x (pulls guard, neutralizes takedowns)
- Judoka vs Berimbolo = 2.0x (explosive judo vs inverters)
- Pressure Passer vs Guard Player = 2.0x (smash the guard)
- Leg Locker vs Wrestler = 2.0x (wrestlers don't defend legs)
- Berimbolo vs Pressure Passer = 2.0x (flow around pressure)
- Sub Hunter vs Controller = 2.0x (aggression breaks methodical play)
- Controller vs Leg Locker = 2.0x (positional discipline shuts down leg attacks)

### 3.3 STAB Bonus

Same Type Attack Bonus: when a move's style matches the grappler's style, damage is multiplied by **1.5x**. A Wrestler throwing a Double Leg (wrestler-style move) gets STAB. A Guard Player throwing that same Double Leg does not.

### 3.4 Stats

Six core stats determine combat effectiveness:

| Stat | Abbrev | Role |
|------|--------|------|
| **Strength** | STR | Attack power for physical moves (takedowns, passes, pressure) |
| **Technique** | TEC | Attack power for technical moves (sweeps, submissions) |
| **Toughness** | TGH | Defense against strength-based attacks |
| **Flexibility** | FLX | Defense against technical attacks, escape ability |
| **Speed** | SPD | Turn order priority, critical hit base rate |
| **Endurance** | END | Stamina pool, stamina recovery rate |

**HP** is a seventh base stat that determines the grappler's health pool.

### 3.5 Stat Calculation

Stats follow the Pokemon Gen 1 formula:

```
Stat = floor(((2 * Base + IV + floor(EV / 4)) * Level / 100) + 5)
HP   = floor(((2 * Base + IV + floor(EV / 4)) * Level / 100) + Level + 10)
```

### 3.6 IVs (Individual Values)

Rolled at grappler creation, 0-15 per stat. These represent natural gifts -- some people are naturally more flexible, stronger, or faster. You cannot change IVs.

### 3.7 EVs (Effort Values)

Earned through training and competition. 0-252 per stat, 510 total cap across all stats. These represent focused training -- drilling takedowns builds STR EVs, flow rolling builds SPD EVs.

### 3.8 Archetypes (Starter Templates)

Eight archetypes serve as pre-built grappler templates with tuned base stats and starting moves:

| Archetype | Style | HP | STR | TEC | TGH | FLX | SPD | END |
|-----------|-------|----|-----|-----|-----|-----|-----|-----|
| Pressure Machine | Pressure Passer | 85 | 90 | 65 | 85 | 50 | 55 | 80 |
| Guard Wizard | Guard Player | 70 | 55 | 95 | 60 | 90 | 70 | 65 |
| Takedown Artist | Wrestler | 80 | 95 | 60 | 80 | 45 | 75 | 75 |
| Leg Reaper | Leg Locker | 65 | 60 | 90 | 55 | 85 | 80 | 70 |
| Flow Roller | Berimbolo | 60 | 45 | 85 | 50 | 95 | 90 | 65 |
| Judo Heavy | Judoka | 90 | 85 | 75 | 85 | 40 | 55 | 80 |
| Finish Hunter | Sub Hunter | 65 | 70 | 95 | 55 | 75 | 70 | 70 |
| Chess Player | Controller | 80 | 70 | 80 | 75 | 60 | 65 | 90 |

---

## 4. Belt Progression

Belts function as the leveling system, gating move slots and matchmaking:

| Belt | Level | XP Threshold | Move Slots |
|------|-------|-------------|------------|
| White | 1 | 0 | 4 |
| Blue | 15 | 1,500 | 6 |
| Purple | 30 | 5,000 | 8 |
| Brown | 45 | 12,000 | 10 |
| Black | 60 | 25,000 | 12 |

Level is interpolated within each belt based on XP progress. A white belt with 750 XP is roughly level 8 (halfway between white level 1 and blue level 15).

### 4.1 Belt Promotion Cinematics

When a grappler's XP crosses a belt threshold, the game transitions to a dedicated `PromotionScreen`. The player's coach delivers personalized dialogue, the belt is visually changed, and the number of available move slots increases.

---

## 5. Position System

### 5.1 Shared Position Model

The mat has one position at any time -- both fighters share it. This is a key design decision: there is no independent "your position" vs "their position." If the position is Mount, one fighter is on top and one is on bottom.

### 5.2 Positions

Twelve positions spanning the full grappling landscape:

| Position | Symmetric | Advantage | Top Dmg | Bot Dmg |
|----------|-----------|-----------|---------|---------|
| Standing | Yes | Neutral | 1.0x | 1.0x |
| Clinch | Yes | Neutral | 1.0x | 1.0x |
| Closed Guard | No | Slight Bottom | 0.9x | 1.1x |
| Open Guard | No | Neutral | 1.0x | 1.0x |
| Half Guard | No | Slight Top | 1.05x | 0.95x |
| Side Control | No | Top | 1.2x | 0.7x |
| Mount | No | Dominant Top | 1.4x | 0.5x |
| Back Control | No | Dominant Top | 1.5x | 0.4x |
| Turtle | No | Top | 1.2x | 0.6x |
| Knee on Belly | No | Top | 1.3x | 0.6x |
| North-South | No | Top | 1.15x | 0.7x |
| Leg Entanglement | Yes | Neutral | 1.0x | 1.0x |

**Symmetric positions** (Standing, Clinch, Leg Entanglement) have no top/bottom -- both fighters have equal options and are classified as `neutral`.

**Asymmetric positions** assign one fighter as `top` and the other as `bottom`, with different available move categories for each role.

### 5.3 Role-Based Move Availability

Each position defines which move categories are available to the top and bottom fighter:

- **Mount (top):** Submissions, Transitions
- **Mount (bottom):** Escapes only
- **Closed Guard (top):** Passes, Transitions
- **Closed Guard (bottom):** Sweeps, Submissions, Transitions
- **Standing (both):** Takedowns, Transitions
- **Leg Entanglement (both):** Submissions, Sweeps, Escapes, Transitions

### 5.4 Position Modifiers

Each position applies ATB (action time bar) and damage modifiers based on role:

- **ATB modifiers** affect turn order (top in mount gets +25% speed, bottom gets -25%)
- **Damage modifiers** scale output (back control top deals 1.5x, bottom only 0.4x)

---

## 6. Move System

### 6.1 Move Count and Categories

**142 moves** across 6 categories:

| Category | Count | Purpose |
|----------|-------|---------|
| Takedowns | ~18 | Standing/clinch to ground (attacker gets top) |
| Sweeps | ~14 | Bottom to top position reversal |
| Passes | ~16 | Advance through guard to dominant position |
| Submissions | ~48 | Attempt to tap the opponent (mini-game) |
| Escapes | ~18 | Recover from bad position |
| Transitions | ~20 | Move between adjacent positions |

**Note:** 8 additional "gap filler" moves ensure every position/role has at least one available move.

### 6.2 Move Data Structure

Each move defines:

```typescript
{
  id: string;              // unique identifier (e.g., 'double-leg')
  name: string;            // display name
  category: MoveCategory;  // takedown | sweep | pass | submission | escape | transition
  style: Style;            // which grappler style this belongs to (for STAB)
  posReq: PosReq[];        // position + role combos where this move is legal
  resultPosition: Position; // new position after success (null = no change)
  resultRole: string;       // attacker's role in new position
  power: number;           // base damage (0-100+)
  accuracy: number;        // base hit chance (%)
  staminaCost: number;     // stamina deducted on use (5-26)
  statAttack: StatKey;     // which stat drives offense
  statDefense: StatKey;    // which stat the defender uses
  chainPotential: string[];// move IDs that chain from this move
  description: string;     // flavor text
}
```

### 6.3 Move Expansion Packs

The 142 moves are organized into the base set (~67 moves) plus expansion packs:

- **Judo** (10): Uchi Mata, Harai Goshi, O-Goshi, Tai Otoshi, Sumi Gaeshi, Tomoe Nage, Kata Guruma, Tani Otoshi, Sode Tsuri Komi Goshi, Ko Uchi Gari
- **Wrestling** (8): Blast Double, Fireman's Carry, Suplex, Duck Under, Ankle Pick, High Crotch, Arm Drag Takedown, Russian Tie Snap
- **Advanced Leg Locks** (10): Outside Heel Hook, Calf Slicer, Estima Lock, Kneebar, Toe Hold, Electric Chair, Aoki Lock, Honey Hole Entry, Truck Position, 50/50 Entry
- **Advanced Guard** (10): Lasso Sweep, Worm Guard Sweep, Rubber Guard Triangle, Spider Guard Sweep, Collar Sleeve Sweep, De La Riva Sweep, Reverse De La Riva Sweep, K-Guard Entry, Imanari Roll, Donkey Guard Sweep
- **Advanced Submissions** (12): Gogoplata, Baseball Bat Choke, Ezekiel, Mounted Triangle, Cross Collar from Mount, Armbar from Mount, Von Flue Choke, Paper Cutter Choke, Anaconda, Peruvian Necktie, Flying Armbar, Flying Triangle
- **Advanced Passes** (6): Body Lock Pass, X-Pass, Leg Weave, Over-Under Pass, Cartwheel Pass, Backstep to Leg Lock
- **Missing Escapes** (8): Granby Roll, Elbow-Knee Escape (from mount, side control, KOB variants), Underhook Escape, Guard Pull Recovery, Single Leg Defense

### 6.4 Chain System

Moves can chain into each other for bonuses:

- **+10 accuracy** on the chained move
- **-3 stamina cost** (minimum 1)
- **+12% critical hit chance**

Example chain: Double Leg -> Knee Cut Pass -> Americana. Each link in the chain gets the bonuses if the previous move succeeded.

Chain potential is defined per-move in the `chainPotential` array.

---

## 7. Damage Formula

### 7.1 Base Damage (Pokemon Gen 1)

```
Damage = ((2 * Level / 5 + 2) * Power * (Attack / Defense)) / 50 + 2
```

Where:
- **Level** = grappler's current level (1-60+)
- **Power** = move's base power (0-100+)
- **Attack** = attacker's relevant stat (STR or TEC, defined per move)
- **Defense** = defender's relevant stat (TGH, FLX, STR, or SPD, defined per move)

### 7.2 Damage Modifiers (applied sequentially)

1. **STAB** (x1.5 if move style = grappler style)
2. **Style Effectiveness** (x0.5 / x1.0 / x1.5 / x2.0)
3. **Position Modifier** (from position data, top vs bottom)
4. **Gassed Penalty** (attacker: x0.6 if gassed; defender: x1.2 if gassed)
5. **Critical Hit** (x1.5 if crit lands)
6. **Random Variance** (x0.85 to x1.00)

Minimum damage is always 1.

### 7.3 Critical Hit System

Critical hit chance is calculated from multiple sources:

| Source | Contribution |
|--------|-------------|
| Base (from Speed) | SPD / 250 (~4-32%) |
| Dominant top position (mount, back control) | +12% |
| Top position (side control, turtle, KOB, north-south) | +8% |
| Slight top (half guard top) | +4% |
| High-crit move | 3x the base rate |
| Chain bonus | +12% flat |

Maximum crit chance is capped at **50%**.

**High-crit moves:** RNC, Heel Hook, Outside Heel Hook, Armbar from Mount, Cross Collar from Mount, Bow and Arrow, Mounted Triangle, Flying Armbar, Flying Triangle, Twister, Suplex, Kata Guruma, O-Goshi.

---

## 8. Stamina System

Stamina replaces PP (Power Points) from Pokemon. Every move costs stamina. Running out means you're gassed.

### 8.1 Max Stamina

```
MaxStamina = floor(END * 1.5 + Level * 0.5 + 50)
```

### 8.2 Stamina Costs

Move costs range from 5 (basic transitions) to 26 (flying submissions, suplexes). Big submissions are expensive. Stalling is free.

### 8.3 Stamina Recovery

Every turn, both fighters recover stamina based on position advantage and END stat:

| Position Advantage | Top Recovery | Bottom Recovery |
|-------------------|-------------|-----------------|
| Dominant Top (mount, back) | 8 | 1 |
| Top (side, turtle, KOB, NS) | 6 | 2 |
| Slight Top (half guard) | 4 | 3 |
| Slight Bottom (closed guard) | 3 | 4 |
| Neutral | 3 | 3 |

Plus `floor(END / 30)` bonus recovery.

### 8.4 Gassed State

When stamina hits 0, the fighter becomes **gassed**:

- **-40% speed** (affects turn order)
- **-40% damage** (attacker modifier x0.6)
- **-30% accuracy**
- **+20% damage taken** (defender modifier x1.2)

Recovery from gassed state: stamina must exceed 20% of max stamina.

### 8.5 Stall Move

A universal fallback move always available to both fighters:

- **Cost:** 0 stamina
- **Effect:** Recover `15 + floor(END / 10)` stamina
- **Trade-off:** Burns your turn, no damage, no position change
- Automatically offered when no legal moves are affordable

---

## 9. Submission Mini-Game

When a submission move connects (passes accuracy check), it enters a 3-phase lock sequence instead of dealing direct damage.

### 9.1 Phase Resolution

Each phase is an attacker vs defender stat roll:

```
Attack Roll  = floor(TEC * 0.6 + STR * 0.4) + random(0-20)
Defend Roll  = floor(FLX * 0.5 + TGH * 0.3 + END * 0.2) + random(0-20)
Threshold    = Attack Roll - Defend Roll
```

Position and chain bonuses apply to the attack roll.

### 9.2 Outcomes by Threshold

| Threshold | Phase 1-2 | Phase 3 |
|-----------|-----------|---------|
| > 30 | Instant TAP | Instant TAP |
| 16 - 30 | Advance to next phase | TAP (fully locked) |
| 0 - 15 | Advance to next phase | Escape (barely) |
| < 0 | Escape | Escape |

### 9.3 Stamina Drain

Each phase costs **8 stamina** for the attacker and **12 stamina** for the defender. Defending a deep submission is exhausting.

### 9.4 Escape Damage

If the defender escapes the submission, the attacker still deals 30% of what the move's normal damage would have been. Near-submissions wear you down.

---

## 10. Turn System

### 10.1 Sequential Resolution

Turns are **sequential, not simultaneous**. The faster fighter acts first, and the slower fighter reacts to the new reality.

### 10.2 Initiative Calculation

```
ATB = Speed * PositionModifier * GassPenalty
```

- **PositionModifier** = ATB modifier from current position (e.g., mount top = 1.25, mount bottom = 0.75)
- **GassPenalty** = 0.6 if gassed, 1.0 otherwise
- Ties broken randomly

The fighter with higher ATB acts first. Their move resolves completely (position change, damage, submission) before the second fighter selects/resolves.

### 10.3 Move Invalidation

If the first actor changes the position (e.g., executes a sweep), the second actor's pre-selected move may become invalid. Invalid moves are automatically converted to a stall with reduced recovery.

---

## 11. AI Opponent

### 11.1 Move Selection

The AI uses a priority-weighted scoring system:

```
Base Score = Power + (Accuracy * 0.3)
```

Plus contextual modifiers:

| Condition | Modifier |
|-----------|----------|
| Submission from dominant position | +40 |
| Submission from any other position | +15 |
| Escape from dominant-top (bottom) | +50 |
| Escape from top (bottom) | +35 |
| Chained from last move | +20 |
| Low stamina penalty | -(staminaCost * 2) |
| Random noise | +/- 15 |

The AI picks the highest-scoring legal move from its affordable options. Random noise prevents completely deterministic behavior.

---

## 12. Character Creation Flow

The creation screen is a multi-phase narrative sequence:

1. **Name** -- Enter your fighter's name (text input)
2. **Gym** -- Enter your gym name and coach's name
3. **Gi Color** -- Choose white, blue, or black gi
4. **Intro** -- Cinematic text crawl: "You step into [gym name] for the first time..."
5. **Choice** -- Three groups are training: Wrestlers, Guard Players, Leg Lockers. Choose your path.
6. **Narrative** -- Style-specific dialogue with your chosen instructor (Coach Dan, Professor Silva, or Coach Craig)
7. **Ready** -- Grappler created, opponent generated, proceed to the gym

Each starter path defines unique base stats, starting moves, instructor name, and narrative dialogue.

A random opponent is also generated from the 8 archetypes to serve as the first training partner.

---

## 13. Overworld

### 13.1 The Gym

A pixel art tile-based gym rendered on Canvas 2D. The player walks around using a virtual D-pad (mobile) or arrow keys. An A-button triggers NPC interactions.

### 13.2 NPCs

- **Professor** -- Handles belt promotions. Checks XP threshold and initiates the promotion cinematic.
- **Instructors** -- Teach new moves. (Currently placeholder -- move teaching system not yet fully wired.)
- **Training Partners** -- Challenge to a roll. Starts the battle sequence.

### 13.3 Tile System

The overworld uses a tile-based map with collision detection. Tiles include floor, wall, mat, and NPC positions. The renderer handles camera positioning and sprite drawing.

### 13.4 Controls

- **Mobile:** Virtual D-pad overlay (8-directional) + A button
- **Desktop:** Arrow keys + Enter/Space

---

## 14. Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| TitleScreen | `/` | Game logo, "New Game" / "Continue" |
| CreateScreen | `/create` | Multi-phase character creation |
| OverworldScreen | `/overworld` | Pixel art gym exploration |
| BattleScreen | `/battle` | Turn-based combat |
| ResultScreen | `/results` | Post-match XP award and summary |
| StatsScreen | `/stats` | Fighter profile, stat bars, move list, belt info |
| PromotionScreen | `/promotion` | Belt promotion cinematic |

---

## 15. Persistence

Game state is saved to `localStorage`:

| Key | Data |
|-----|------|
| `rollcraft-player` | Full Grappler object (stats, XP, moves, belt, IVs, EVs) |
| `rollcraft-opponent` | Current opponent Grappler |
| `rollcraft-result` | Last battle result (winner, method, XP gained, turns) |

---

## 16. Technical Architecture

### 16.1 Stack

- **React 19.2** -- UI framework
- **Vite 8** -- Build tool + dev server
- **TypeScript 6** -- Type safety
- **Canvas 2D** -- All game rendering (overworld, battle, sprites)
- **React Router 7** -- Screen navigation
- **localStorage** -- Save/load state

### 16.2 Project Structure

```
src/
  App.tsx                    # Router with all screen routes
  main.tsx                   # React entry point
  index.css                  # Global styles
  engine/
    types.ts                 # All TypeScript interfaces and type definitions
    constants.ts             # Style colors, names, canvas dimensions
    random.ts                # RNG utilities (randInt, rollIVs, damageRandom)
  data/
    moves.ts                 # 142 move definitions
    styles.ts                # 8x8 style matchup chart
    archetypes.ts            # 8 archetype templates
    positions.ts             # 12 position definitions + role logic
    starters.ts              # 3 starter paths + gi colors
  battle/
    BattleEngine.ts          # Core battle loop, turn execution, AI, move legality
    DamageCalc.ts            # Damage formula, crits, effectiveness
    StaminaSystem.ts         # Stamina costs, recovery, gassed state
    SubmissionMinigame.ts    # 3-phase submission resolution
    stats.ts                 # Stat computation, level calculation, battle grappler factory
  screens/
    TitleScreen.tsx           # Title + menu
    CreateScreen.tsx          # Character creation (7 phases)
    OverworldScreen.tsx       # Gym exploration
    BattleScreen.tsx          # Battle UI + move selection
    ResultScreen.tsx          # Post-match results
    StatsScreen.tsx           # Fighter profile
    PromotionScreen.tsx       # Belt promotion cinematic
  overworld/
    OverworldEngine.ts        # Overworld game loop, collision, NPC interaction
    OverworldRenderer.ts      # Tile + sprite rendering
    overworldTypes.ts         # Overworld type definitions
    tiles.ts                  # Tile definitions
    maps/                     # Map data
  render/
    BattleRenderer.ts         # Battle scene Canvas rendering
    SpriteData.ts             # 12x16 pixel grappler sprites (gi color + belt color)
  components/
    DPad.tsx                  # Virtual D-pad (mobile controls)
    DialogueBox.tsx           # NPC dialogue display
    MoveButton.tsx            # Battle move selection button
    MovePanel.tsx             # Move list panel
    StatBar.tsx               # Stat bar visualization
  state/
    saveLoad.ts               # localStorage persistence layer
```

### 16.3 Sprite System

Grapplers are rendered as 12x16 pixel sprites with configurable gi color and belt color. Sprites are generated programmatically (not from image files) and cached in an off-screen canvas for performance.

The sprite includes: hair/outline (black), skin (peach), gi body (configurable), gi lapel (white), and belt (matches current belt rank).

---

## 17. Battle Flow (Detailed)

1. `createBattleState()` initializes the battle: both grapplers at full HP/stamina, position = standing, topFighter = null.
2. `computeFirstActor()` determines initiative based on speed + position modifiers.
3. Player selects a move from legal options (filtered by current position + role + category permissions).
4. `executeTurn()` resolves the turn sequentially:
   - First actor's move is fully resolved (stamina deduction, accuracy check, damage/submission/position change).
   - If battle is not over, second actor resolves their move (AI picks, or player's pre-selected move is validated).
5. End-of-turn: both fighters recover stamina based on position. Turn counter increments. New initiative is calculated.
6. Battle ends when HP reaches 0 (referee stoppage) or a submission tap occurs.

---

## 18. Win Conditions

| Method | Trigger |
|--------|---------|
| **Submission** | Defender's HP set to 0 during submission mini-game (tap) |
| **Referee Stoppage** | Defender's HP reaches 0 from accumulated damage |
| **Points** | (Not yet implemented -- future tournament mode) |

---

## 19. What's Built vs. What's Planned

### Built and Functional
- Full battle engine with all mechanics
- 142 moves across all categories
- 8 styles with complete matchup chart
- 12 positions with role-based move filtering
- Stat system with IVs, EVs, and Pokemon formula
- Stamina system with gassed penalties
- Chain system with accuracy/stamina/crit bonuses
- Submission mini-game (3-phase)
- Sequential turn resolution with initiative
- AI opponent with weighted move selection
- Character creation with narrative onboarding
- Pixel art overworld gym
- NPC interaction system
- Belt progression with cinematic promotions
- Stats menu with full fighter profile
- Mobile-first controls (D-pad + A button)
- Save/load via localStorage
- Pixel art sprite system

### Not Yet Built
- Multiple opponents at different belt levels
- Move learning from instructors (NPC mechanic exists, teaching not wired)
- EV training system (structure exists, no earning mechanism)
- Sound effects and music
- Tournament mode
- Economy system
- Career progression beyond belt promotions
- Multiplayer
- Multiple gym locations
