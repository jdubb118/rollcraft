# RollCraft: Production World Build Plan

## Context

RollCraft is a working prototype: 142 moves, 12 positions, 8 styles, pixel art overworld, sequential combat engine, belt progression. Now we're expanding from a single-gym demo into a full Pokemon Red/Blue-scale world — 9 regions, tournaments, economy, story, and endgame.

---

## The World: 9 Regions

Like Kanto's 8 gym towns + Indigo Plateau, RollCraft has 9 regions connected by routes. Each region has a unique style, head instructor (gym leader), training partners, tournaments, and side activities.

### Region Map
```
                    [9. SUMMIT CITY — Worlds]
                         |
                    [8. IRON COAST — Pressure Passing]
                    /           \
           [7. NOVA CAMP —      [6. SAMBO DISTRICT —
            Submissions]          Judo/Sambo]
                |                |
           [5. CORAL BAY —   [4. STEEL MOUNTAIN —
            Guard Play]        Wrestling]
                \           /
            [3. OLD TOWN — Positional BJJ]
                |
            [2. SCRAMBLE VALLEY — Berimbolo/Inversions]
                |
            [1. HOME GYM — Fundamentals]
```

### Region Details

| # | Name | Style | Head Instructor | Stamp | Gate |
|---|------|-------|-----------------|-------|------|
| 1 | Home Gym | Fundamentals | Your Coach | — | Tutorial |
| 2 | Scramble Valley | Berimbolo | Prof. Miyao | Scramble Stamp | Beat 2 home partners |
| 3 | Old Town | Controller | Master Carvalho | Tradition Stamp | Win Scramble Open OR Blue belt |
| 4 | Steel Mountain | Wrestler | Coach Askren | Iron Stamp | Blue belt + win Old Town Classic |
| 5 | Coral Bay | Guard Player | Prof. Galvao | Wave Stamp | Purple belt |
| 6 | Sambo District | Judoka | Coach Khabib | Combat Stamp | Purple + win regional |
| 7 | Nova Camp | Sub Hunter | Prof. Tonon | Precision Stamp | Brown belt + win regional |
| 8 | Iron Coast | Pressure Passer | Prof. Rodolfo | Champion Stamp | Brown + 5 stamps + win Nova Pro |
| 9 | Summit City | All (Elite Eight) | Grandmaster Rickson | — | Black + all 8 stamps + win Grand Prix |

Each region has: 4-5 training partners (scaling difficulty), 1-2 visiting instructors (TM moves), a tournament venue, and a unique side activity.

---

## Progression Gates (Pokemon Badge System)

### Belt Gates
- **Blue belt**: Unlocks Old Town, Steel Mountain
- **Purple belt**: Unlocks Coral Bay, Sambo District, specialization choice
- **Brown belt**: Unlocks Nova Camp, sponsorships, teaching
- **Black belt**: Unlocks Summit City / Worlds

### Stamp Collection (= Gym Badges)
Each region awards a stamp for beating the head instructor. Stamps unlock:
- 3 stamps: Regional tournament eligibility
- 5 stamps: Iron Coast access
- 8 stamps: World Championship eligibility

### Technique Gates (= HMs)
Certain moves unlock access to regions (must learn guard pull for Scramble Valley, takedown defense for Steel Mountain, leg lock defense for Sambo District). Forces well-rounded development.

---

## Tournament Ladder

| Tournament | Region | Bracket | Belt | Entry | Gold Prize |
|-----------|--------|---------|------|-------|------------|
| Scramble Valley Open | 2 | 4 | W-Blue | 50 MB | 300 MB |
| Old Town Classic | 3 | 8 | W-Purple | 100 MB | 750 MB |
| Steel Mountain Invitational | 4 | 8 | Blue-Brown | 150 MB | 1,200 MB |
| Coral Bay Pro | 5 | 16 | Purple-Black | 250 MB | 2,500 MB |
| Sambo District Cup | 6 | 16 | Brown-Black | 250 MB | 3,000 MB |
| Nova Pro Championship | 7 | 32 | Brown-Black | 400 MB | 5,000 MB |
| Iron Coast Grand Prix | 8 | 32 | Black | 500 MB | 10,000 MB |
| World Championship | 9 | 64 | Black | 1,000 MB | 25,000 MB |
| ADCC Invitational | 9 | 16 | Black (invite) | 0 | 50,000 MB |

---

## Economy (Mat Bucks)

### Earning
- Win training roll: 25-50 MB
- Tournament match wins: 100-1,000 MB
- Tournament golds: 300-25,000 MB
- Teaching classes (brown+): 100 MB/class
- Sponsorships (black): 200-2,000 MB/tournament

### Spending
- Drop-in fee (visit gym): 50 MB
- Private lesson (TM move): 150-500 MB
- Seminar (rare move): 300 MB
- Tournament entry: 50-1,000 MB
- EV training session: 100-300 MB
- Cosmetic gi/patches: 50-1,000 MB

### Sponsorships (brown belt+)
After 3 tournament golds, brands approach. Passive income per tournament entered. Tiers scale from local gi brand (200 MB) to title sponsor at Worlds (2,000 MB).

---

## Story Arc

### The Rival: Kai
- Same starter path as player but opposing style
- Always one step ahead through mid-game
- Key encounters at every major tournament
- Arrogant → respectful arc
- Final confrontation: Worlds semifinal

### The Mentor: Professor Royce
- Traveling black belt who appears at key moments
- Teaches 3 "legacy moves" at white/purple/black milestones
- Backstory: former world champion, controversial retirement

### The Villain: Team Apex
- Gym chain that promotes sandbagging, PED use, dirty tactics
- Encountered in every region as antagonists
- Subplot escalates from intimidation → cheating → corruption
- Final confrontation at Iron Coast before Worlds
- Head coach "Victor" is former student of Prof. Royce

### Belt Promotion Beats (already built — expand)
- **Blue**: "You survived. Most quit. You didn't."
- **Purple**: Happens after a LOSS. "You don't get purple for winning."
- **Brown**: Prof. Royce watches. "The last stretch is the hardest."
- **Black**: Entire gym gathers. Every NPC sends a message. Coach breaks character.

---

## The Elite Eight (Final Boss Gauntlet)

Before the World Championship bracket, fight 8 masters back-to-back (like Pokemon Elite Four but doubled):

| # | Name | Style | Signature Move |
|---|------|-------|---------------|
| 1 | Grand Master Helio | Controller | Cross Collar Mount |
| 2 | Sensei Kimura | Judoka | Uchi Mata |
| 3 | Professor Rolls | Guard Player | X-Guard Sweep |
| 4 | Coach Saitiev | Wrestler | Blast Double |
| 5 | Master Terere | Berimbolo | Berimbolo (fastest NPC) |
| 6 | Professor Xande | Pressure Passer | Body Lock Pass |
| 7 | Coach Palhares | Leg Locker | Outside Heel Hook |
| 8 | Master Leozinho | Sub Hunter | RNC |

**World Champion: Grandmaster Rickson** — Controller, Lv65, all stats 95+, 12 elite moves.

---

## Endgame (Post-Worlds)

1. **Open your own academy** — choose region, recruit instructors, train AI students
2. **ADCC Invitational** — submission-only super fights, strongest opponents
3. **Legendary matches** — fight the all-time greats with maxed stats
4. **Create your own style** — combine 2 styles, name it
5. **New Game+** — restart with move knowledge, all NPCs +10 levels

---

## Technical Build Plan (10 Sprints)

### Sprint 1: World Map Infrastructure
- Region transition system (exit tiles → load new map)
- World map screen (region select with unlock indicators)
- Expand save system (stamps, money, progression, story flags)
- Refactor OverworldScreen to accept regionId

### Sprint 2: Region 2 — Scramble Valley
- 24x18 tile map, 4 training partners + head instructor + visiting instructor
- Route map between Home Gym and Scramble Valley
- Drop-in fee mechanic (economy v1)
- Scramble Valley Open tournament (4-person bracket)

### Sprint 3: Economy + Tournament System
- Money field in progression, money display in UI
- TournamentScreen: bracket view, match flow, podium ceremony
- ShopScreen: buy gis, pay for privates
- Wire entry fees and prize payouts

### Sprint 4: Region 3 + Rival Introduction
- Old Town tile map + NPCs
- Kai (rival) introduction cutscene
- Old Town Classic tournament (8-person bracket)
- Belt gate enforcement

### Sprint 5-8: Regions 4-7 (one per sprint)
Each adds: tile map, NPCs, tournament, side activity, story beat, route

### Sprint 9: Region 8 + Pre-Endgame
- Iron Coast (first black belt opponents)
- Sponsorship system
- Training camp mechanic
- Team Apex final confrontation

### Sprint 10: Summit City + Worlds + Endgame
- Elite Eight gauntlet
- 64-person World Championship bracket
- Champion fight
- Academy ownership, ADCC, legendaries, New Game+

---

## Key Data Structures

### WorldRegion
```typescript
interface WorldRegion {
  id: string;
  name: string;
  styleSpecialty: Style | null;
  tileMap: number[][];
  playerSpawn: { col: number; row: number };
  connections: { targetRegionId: string; doorPos: { col: number; row: number } }[];
  headInstructor: NPCDef | null;
  npcs: NPCDef[];
  tournaments: Tournament[];
  unlockRequirements: { type: 'belt' | 'stamp-count' | 'tournament-win'; value: string | number }[];
  stampId: string | null;
}
```

### PlayerProgression
```typescript
interface PlayerProgression {
  stamps: string[];
  tournamentResults: TournamentResult[];
  money: number;
  sponsorships: { name: string; income: number }[];
  specialization: string | null;
  currentRegionId: string;
  storyFlags: Record<string, boolean>;
  npcDefeated: Record<string, boolean>;
  totalWins: number;
  totalLosses: number;
}
```

### Tournament
```typescript
interface Tournament {
  id: string;
  name: string;
  regionId: string;
  bracketSize: 4 | 8 | 16 | 32 | 64;
  beltMin: Belt;
  beltMax: Belt;
  entryFee: number;
  prizePool: { gold: number; silver: number; bronze: number };
  ruleSet: 'points' | 'submission-only' | 'adcc';
}
```

---

## What Already Works (Reusable)

- Tile system + renderer (each region = new number[][] grid)
- NPC system (NPCDef already has dialogue, teachable moves, wandering)
- Battle engine (region-agnostic, any NPC becomes a Grappler)
- 142 moves (TM gating = controlling which moves are available per region)
- Save system (localStorage, just needs more keys)
- Sprite cache system (handles all rendering efficiently)
- All 9 region maps fit in <10KB total. All NPC data <50KB. Well within localStorage limits.

---

## Verification

Each sprint ships a testable increment:
1. **Sprint 1**: Travel between home gym and a placeholder Region 2
2. **Sprint 2**: Complete Scramble Valley experience (walk, talk, roll, tournament)
3. **Sprint 3**: Money earned/spent, tournament bracket UI works
4. **Sprint 4**: Story begins (Kai introduced, Old Town accessible)
5. **Sprints 5-8**: Each region playable end-to-end
6. **Sprint 9-10**: Full game completable, Worlds winnable
