# Grapple Quest — Full Design Review (June 11, 2026)

Method: 6,720 simulated AI-vs-AI matches on the real BattleEngine (tools/sim-entry.ts),
a second 6,720-match counterfactual with ideal 9-move sets, full-game screenshot tour
(tools/tour.mjs), hands-on Playwright playthroughs, and a complete code read.

---

## The headline finding

**The battle system starves its own best idea.** The shared-position graph is the
game's soul, but in practice the mat barely gets used:

| Metric (live 4-move AI) | Value |
|---|---|
| Turns where the actor has ZERO real legal moves | **53.5%** |
| Turns spent on Spaz Out | **47.2%** |
| Turns spent on Stall | 16.2% |
| Real technique turns | **36.7%** |
| Time spent in mount | **0.7%** |
| Time in back control | 1.2% |
| Time in side control | 1.0% |
| Time standing | 41.4% |
| Submission attempts per match | 0.69 |

Even the counterfactual with hand-curated 9-move sets only improves this to 47.2%
dead turns / 0.7% mount. **The position graph (12 positions × roles) is structurally
wider than any move loadout can cover.** The result: matches are spaz-scramble loops
that reset to standing, and the pass → control → finish arc that defines BJJ almost
never happens.

Compounding bugs/imbalances found:

1. **Every AI opponent in the game has exactly 4 moves, forever.** `generateBracket`
   and `generateRandomOpponent` do `arch.startingMoves.slice(0, 4 + beltIdx)` — but
   every archetype's `startingMoves` has length 4, so the slice is a no-op. Black-belt
   Worlds finalists fight with a white belt's toolkit.
2. **Judo Heavy cannot play the game: 0.8% win rate.** Its throws need clinch, it has
   no clinch entry, so it spazzes for ~22 turns and loses on stall-penalty advantages.
3. **Missed submissions award the attacker an advantage** (`BattleEngine` awards
   "near-submission" on a clean whiff). Submission spam farms free advantages —
   sub-styles win 64-84% in sim, wrestlers 29-39%, and 12% of matches are decided
   on these advantages.
4. **Dominant positions are paper.** Passes face a guard-retention counter-roll, but
   escapes face nothing — no top-control roll. Mount/back/side evaporate in 1-2 turns.
5. **~77% of the move pool is unobtainable.** 151 moves exist; only ~25 unique
   teachables across all instructors + ~13 starter moves are acquirable. The Move
   Dex (X/151) can never be filled.
6. The AI scoring formula (`power + accuracy×0.3`) starves power-0 transitions and
   setups — the AI almost never advances position on purpose.

---

## Idea 1 — the keystone: "Everyone knows the fundamentals"

Give every grappler a permanent, universal **fundamentals kit**: one weak-but-legal
move for every position+role — Basic Pass, Basic Escape, Basic Sweep, Basic Advance,
Basic Takedown, Grip Fight. Low power, modest accuracy, normal stamina. Equipped moves
become your **specialization** — strictly better versions and signature attacks — not
your only options.

This one change fixes the entire cluster: zero-option turns disappear, dominant
positions become reachable and worth taking, Judo Heavy can close distance, Spaz
returns to being a desperation gamble instead of 47% of the game, and Jeff's parked
"position-specific slots" idea becomes a natural layer on top (slots specialize
per-position; fundamentals fill the gaps). It's also exactly true to the sport:
every white belt knows *a* guard pass; your A-game is what you've drilled.

Estimated effort: ~1 day (a FUNDAMENTALS move table + include them in
`getLegalMoves`, AI scoring already handles the rest).

## Combat system ideas (ordered)

2. **Top-control roll vs escapes** — mirror of guard retention: escape attempts roll
   against the top player's control (STR/TEC weighted). Outcomes: clean escape /
   partial improvement / shut down (+advantage to top for the shutdown). Makes
   mount/back sticky and earns the 4-point positions their value.
3. **Fix advantage farming** — advantage only on phase-2+ submission attempts
   (already exists); delete the on-miss advantage. Re-run the sim; expect sub-style
   win rates to drop toward 55%.
4. **Belt-scaled AI movesets** — fix the `4 + beltIdx` no-op by giving each archetype
   a 13-move pool and slicing by belt. Pair with +15-25 AI score for transitions when
   no submission is available, so AI actually hunts position. (The sim shows the
   difference this makes.)
5. **Positional pressure meter** — each consecutive turn holding a dominant top
   position adds "pressure": +acc to your subs, extra stamina drain on the bottom
   player. Visible as a small flame stack on the HUD. Rewards control players,
   punishes stalling on bottom, creates drama ("survive the mount").
6. **Interactive submission defense** — the 3-phase resolve currently plays out with
   zero input. Add one beat: defender gets a timed tap ("DEFEND!") that adds a small
   bonus to their roll; attacker can bail after phase 1 to save stamina. The single
   most dramatic moment in BJJ deserves the player's thumbs.
7. **Style passives** — one rule-bending passive per style (wrestler: takedown chains
   cost -3 stamina; pressure-passer: bottom opponent recovery halved; berimbolo:
   sweeps grant +2 momentum; controller: stall penalty immunity once per match...).
   Differentiates styles beyond stats + type chart, enables team-comp thinking for
   challenge links.
8. **Judo quick-fix (do immediately)** — add `clinch-entry` to Judo Heavy's starting
   four. One line. Takes them from 0.8% to playable.

## Progression & content ideas

9. **"Learn by getting caught"** — the BJJ-authentic acquisition mechanic: get tapped
   by the same technique 2-3 times → "You've felt the lasso sweep from the inside.
   Learn it?" Suddenly losses teach literally, random encounters matter, and all 151
   moves become reachable. Supplement with tournament gold rewards (champion teaches
   you a move) and per-region instructor rotations.
10. **Position-specific slots** (Jeff's parked idea) — equip 2-3 moves per position
    instead of 13 global. Pairs perfectly with the fundamentals kit; turns loadout
    into the strategic meta-game and makes the 151-move pool matter.
11. **Activate the specialization field** — `PlayerProgression.specialization` exists,
    is referenced by the purple-belt story beat, and is never used. At purple belt let
    the player declare a specialty (one style tree) for a permanent passive + access
    to that style's exclusive techniques. The story already promises this.
12. **Gym leader rematches** — Dizzy literally says "come back when you want the
    advanced stuff" and nothing happens. Rematch tiers per belt with upgraded movesets
    (once AI sets scale), rewarding revisits to old regions.
13. **Consumables in battle** — items only fire pre-battle today. A between-turns
    "corner" action (once per match, costs your turn — drink electrolytes, tape a
    finger) adds a comeback decision without new systems.

## Maps & world ideas

14. **Break the room mold.** All 9 regions are the same 15×20 single room with a
    centered mat and a south door — only the textures change. Cheap-to-real options,
    in increasing effort: (a) vary mat shape/orientation + prop layouts per region so
    silhouettes differ; (b) give 2-3 regions a signature layout — Coral Bay's mat on
    an open beach deck (sand + ocean tiles around it), Steel Mountain an L-shaped
    wrestling room with a weight corner, Summit City a stadium floor with crowd-stand
    tiles on three sides; (c) one extra room per region (locker room / lounge) with
    flavor NPCs and lore — doubles world size for one tile-paint each.
15. **Summit City should feel like Worlds.** Crowd tiles, camera flashes (particle
    burst), an announcer text ticker during the tournament, podium scene with the
    actual bracket names. It's the endgame — it currently feels like gym #9.
16. **Regenerate the home-gym mat surface.** The painted `scenes/home/mat-surface.png`
    came out flat featureless green — and it's the screen every player stares at for
    their entire first hour. Old Town's tatami and Nova's LED grid prove the pipeline
    can do much better. One PixelLab gen (~1 credit): "worn green BJJ puzzle mats,
    visible jigsaw seams, subtle scuffs and shading."
17. **World map glow-up** — the subway-graph works functionally but is 80% black
    void: add small pixel thumbnails per node (each region's mat as the icon), stamp
    badges on conquered nodes, and an animated player marker walking the route on
    travel.
18. **Ambient life** — the wandering NPCs are good; add 2-3 background drilling pairs
    per gym (two NPCs cycling a takedown animation on a loop). The infra (wander +
    sprites) exists; it would make gyms feel alive instead of like waiting rooms.

## Visual design ideas

19. **Battle canvas text needs outlines.** Gold position text on Old Town's gold
    tatami is invisible (screenshot-verified). Add 1px black outline / drop shadow to
    all canvas text. Trivial, big readability win.
20. **Mobile letterboxing.** On a phone the 4:3 canvas leaves ~40% of the screen as
    dead black bands. Options: extend region tint/vignette into the bands, draw a
    pixel-art crowd/wall border, or crop the camera to fill more vertically.
21. **Key-moment splashes.** The log is the only storyteller; big events deserve
    canvas-level banners — "TAKEDOWN +2", "GUARD PASSED!", "SUBMISSION ATTEMPT!" with
    a half-second freeze-frame. The processBattleBeat hook already parses these
    moments for SFX; render them too.
22. **Replace emoji with pixel glyphs.** ⚔ 📸 🥇 🔥 render as fallback boxes/mismatched
    color emoji inside the Press Start 2P UI (visible in screenshots). Tiny 8×8 pixel
    icons would match the art direction.
23. **Stat bars lie at high level.** Profile bars scale to /50 so a black belt shows
    every bar maxed (175 STR == 60 FLX visually). Scale to the belt-tier max instead.
    Also: the XP bar at MAX RANK renders empty — show it full gold.
24. **Scout panel: show the moves.** After fighting someone once, the panel shows
    only a move COUNT (the code even has a leftover unused `moveCounts` map). Listing
    the known techniques turns scouting into real prep — especially for challenge
    builds.

## Audio ideas

25. **Ship music.** The BGM system is fully built (per-region tracks, crossfade,
    ducking, volume settings) and `public/audio/` doesn't exist — the game is
    silent outside synth SFX. Nine 60-90s chiptune loops (Suno or any chiptune
    generator) dropped at the existing paths = instant atmosphere for zero code.
    Home = warm/lofi, Steel = aggressive, Coral = beach, Summit = orchestral-chip.
26. **Crowd layer at tournaments** — low murmur loop + pop on points/taps. The
    ducking infra already supports layering.

## Retention / meta ideas

27. **Daily Roll** — one daily seeded opponent (same build for every player that
    day), streak counter, share card on streak milestones. Cheap (client-side seed
    by date) and it's the habit loop the game lacks.
28. **Gym Wars seasons** — the new gym leaderboard, reset monthly with a champion
    banner in your home gym for last season's top academy. Gives the leaderboard a
    pulse and gyms a reason to rally.
29. **New Game+** — the post-credits scene (you greet a new white belt with your
    coach's words) is a built-in NG+ hook: restart at white belt keeping one
    signature move at full mastery. Speedrun-friendly, doubles content lifetime.

---

## What's already strong (don't touch)

- The shared-position engine model — authentic, novel, the moat.
- Region art direction (Old Town, Nova Camp, Steel Mountain are genuinely beautiful).
- The Kenzo arc, named-coach personalization, scripted loss, full-circle ending.
- Fatigue curve, stall/spaz concept (as flavor, not as half the game), move mastery.
- The new v1.4.0 layer: share cards, challenge links, gym leaderboard, analytics.

## Suggested build order (impact × effort)

| # | Item | Effort | Why first |
|---|------|--------|----------|
| 1 | Fundamentals kit (#1) | ~1 day | Fixes 53% dead turns, the core experience |
| 2 | Judo clinch-entry + belt-scaled AI sets (#8, #4) | hours | Unbreaks 1/8 archetypes, real difficulty curve |
| 3 | Advantage-farming fix (#3) | minutes | Rebalances 8 styles |
| 4 | Top-control roll (#2) | ~½ day | Makes positions matter |
| 5 | Canvas text outlines + home mat regen (#19, #16) | hours | First-hour visual quality |
| 6 | Ship BGM (#25) | hours | Biggest atmosphere-per-effort in the game |
| 7 | Learn-by-getting-caught (#9) | ~1 day | Unlocks 77% of dormant content |
| 8 | Positional pressure (#5) | ~½ day | Drama + control rewarded |
| 9 | Key-moment splashes (#21) | ~½ day | Battle readability |
| 10 | Daily Roll (#27) | ~1 day | Retention loop |

Re-run `tools/sim-entry.ts` after each combat change — targets: dead turns <10%,
spaz <10%, mount+side+back combined >15%, every archetype 40-60% win rate,
submissions ~35-45% of finishes.

---

# Part 2 — Stickiness: engineering the comeback (game-director addendum)

The honest audit: Grapple Quest has **long-arc hooks** (belts, stamps, story) and now
**social hooks** (share cards, challenges, gym board) — but **zero return triggers**.
When you close the tab, nothing is pending, nothing regenerates, nothing happens
tomorrow. Retention isn't a feature you add; it's a schedule of moments. Here's the
hook map by time-scale, and what's missing at each.

## Hook timing map

| Moment | What exists | What's missing |
|---|---|---|
| Min 1-5 | Name your gym/coach (identity) ✓ | — |
| Min 5-10 | First win + Kenzo drama ✓ | — |
| **End of session 1** | nothing | **A "tomorrow" promise** |
| **Day 1 return** | nothing | **A reason that expires** |
| Week 1 | First promotion (shareable ✓) | — |
| Weeks 2-4 | Belt grind vs identical 4-move AIs | **Variable rewards, texture** |
| Month 1+ | Win Worlds → credits → done | **Endgame loop** |

## The retention stack (ranked)

1. **Rested XP — "Fresh Legs"** (hours of work, zero risk). First 3 wins each
   calendar day give 2× XP + bonus Mat Bucks. Never blocks play — it front-loads
   reward into the return moment instead of punishing absence. Perfect BJJ fiction
   (you train better recovered). This single mechanic is the cheapest D1 lever in
   the game.
2. **The Daily Roll** (~1 day). One seeded opponent per day — every player worldwide
   fights the same build. Streak counter, streak share-cards at 7/30/100, an
   exclusive gi color at 30. Wordle mechanics inside a BJJ game; gym group chats
   will compare ("you tap the Tuesday guy?"). Client-side date seed — no backend.
3. **The coach's promise** (hours). At session end (first navigation to title /
   N minutes idle), your coach says: "Come back tomorrow — I want to show you
   something." Next day: a free move-XP boost, a technique tip, or a daily-roll
   intro. The promise is the trigger; the gift is the variable reward. Also: coach
   comments on your recent results ("Caught in a heel hook again? Let's fix that.")
   — templated off battle history, makes the world remember you.
4. **Your gym wall** (~1 day). Render trophies, medals, stamps, and the belt rack
   INSIDE the home-gym overworld. Every session starts by walking past your own
   history. Investment that isn't displayed doesn't retain; this is the Animal
   Crossing museum effect. (Tournament golds = wall banners; Worlds = the big one.)
5. **Open Mat Wednesdays** (~1 day). One real-world day a week, every gym hosts
   open mat: rare named wanderers appear (visiting black belts, old legends) with
   unique movesets — beat them to learn THEIR signature move. Appointment mechanic
   + variable reward + feeds the move-acquisition gap, all at once.
6. **Rare encounters** (hours). 5% of random encounters are special: a sandbagging
   "white belt" who's clearly a purple, a visiting pro. Higher risk, rare drops
   (technique scrolls, cosmetics). Turns the 8% encounter roll into a slot machine
   worth pulling.
7. **Learn-by-getting-caught** (Part 1, idea #9 — restated here because it's ALSO
   a retention mechanic): losses become lottery tickets. The worst moment in the
   session (losing) becomes a reward moment. That's churn-proofing the exact moment
   players quit.
8. **Gym Wars seasons** (~1 day on top of existing board). Monthly reset; last
   season's top gym gets a banner rendered in every member's home gym. Pride loop
   for whole academies — and the reset itself is a comeback trigger ("new season
   started").
9. **Challenge ladder** (later). Accepted challenges award ladder points; weekly
   top-10. Gives the challenge links a persistent scoreboard instead of one-shots.
10. **NG+ — the full circle run** (later). The post-credits scene already writes it:
    you greet a new white belt with your coach's words. Let players BE that restart —
    white belt again, carrying one mastered signature move. Speedrunners and
    completionists get a second lifetime of content for ~2 days of work.

## The notification surface

It's a PWA now. Don't start with push (permission-prompt churn) — start with
**state that begs checking**: the title screen badges "🥋 Coach has something for
you" / "Daily Roll: 6-day streak — don't break it." If D7 numbers justify it later,
add opt-in web push pitched at the right moment (after a streak hits 3, never at
first launch).

## Measure it

Every hook above ships with its analytics event (the d0/d1/d7/d30 return buckets
are already live in /api/stats). Success criteria: D1 > 25%, D7 > 10% during the
Academia pilot. If a hook doesn't move its bucket in two weeks, kill it — the
events make retention a dashboard, not a debate.

## Director's call — combined build order (Parts 1+2)

Week 1: fundamentals kit, judo/AI/advantage fixes, rested XP, coach's promise,
text outlines, home-mat regen, BGM.
Week 2: Daily Roll, gym wall, learn-by-getting-caught, key-moment splashes.
Week 3: open mat days, rare encounters, top-control roll, pressure meter.
Then: pilot at Academia, watch the buckets, season the leaderboard, NG+.

---

# Part 3 — The Identity Engine: photo → fighter, gym → world (viral architecture)

The thesis: **in BJJ, the gym is the tribe and the belt is the identity.** People
already share promotion photos, team photos, and gym merch — the game doesn't need
to invent a sharing behavior, it needs to make pixel versions of rituals that
already exist, at a quality level worth posting. The gym — not the player — is the
viral unit: one founder seeds a gym, the gym's WhatsApp chat is the distribution
channel, and every member's creation/promotion/trophy is a fresh share event that
recruits the next member. That's a K-factor structure, not a share button.

## The five shareable moments (each gets a designed card, square + 9:16 story)

1. **"I'm in the game"** — creation card: your generated sprite, name, white belt,
   gym crest. The day-0 share.
2. **"My gym is in the game"** — founder card: the pixel gym map, name on the wall,
   "Join us → grapplequest.com/g/academia-bjj". The seed share.
3. **The evolution reveal** — promotion card: old sprite → new evolved sprite,
   belt band, escalating aura. Promotions are already the most-posted event in
   BJJ; this rides the existing ritual.
4. **The team photo** — every member's sprite lined up on their own mat, belts
   visible, gym name + logo + season banner. Team photos after promotions are a
   real-world BJJ ritual; this is the highest-leverage card in the system.
5. **Trophies** — tournament golds and Gym Wars banners on the gym page and
   rendered on the gym's walls.

Format note: story (1080×1920) matters more than feed — stories are low-stakes,
high-frequency. Native share sheet → IG Story works from PWA on mobile.

## A. The character: photo → evolving fighter

- **Hybrid generation model (cost follows engagement):** 1 PixelLab gen at
  creation (white-belt you). At each belt promotion, the NEXT evolution generates
  live as part of the ceremony — same reference photo, belt-specific prompt
  ("lean confident blue belt" → "elite zen black belt master"). Anticipation
  ("what does my purple belt look like?") is itself a retention hook, and cost
  concentrates on retained players (~1.5-2.5 gens average lifetime).
- **Badass factor is mostly code, not gens:** keep 32px sprites in-game; on cards,
  point-upscale 12× and stack programmatic FX per belt — white = clean, blue =
  subtle glow, purple = particles, brown = smoke, black = full gold aura +
  vignette + title text. Optional capstone: ONE hero-size (128px) "final form"
  gen at black belt only.
- Identity drift across evolutions is acceptable — evolution IS transformation —
  as long as the same reference photo anchors hair/skin/build each time.
- Evolutions never cost money and don't count against the device gen cap (they're
  earned); server tracks per-account. Economics: ~1.5-2.5 gens/user lifetime —
  fine under current bank for the pilot; move to PixelLab Pro tier at traction.

## B. The gym: photo → playable map

Three tiers, shipped in order:

- **v1 — Palette kit (free, instant, every gym):** founder uploads a gym photo
  (or picks colors) → client-side palette extraction → parameterized tile recolor
  (mat color is THE gym identity marker), gym name rendered as wall signage,
  uploaded logo as a wall banner, prop layout chosen from presets. Zero gen cost,
  always playable, recognizably "theirs."
- **v2 — Style transfer makeover (~3-4 gens/gym):** the gym photo becomes a
  PixelLab style reference for mat/floor/wall surfaces composited into the proven
  room template. Earned (gym hits N wins) or part of the B2B gym pack.
- **v3 — Verified real gyms (B2B):** gym owners pay for the generated makeover +
  verified badge + their gym featured on the map. This is the monetization that
  doubles as a retention tool gyms buy for their own students.

## C. How players join a gym (THE mechanism)

Data: Supabase `gyms` (slug, name, founder, palette, logo, trophies, wins) +
`gym_members` (gym_id, user_id/device_id, name, sprite, belt, wins). Player save
carries gym_id; the existing string-keyed leaderboard keeps working for
unaffiliated players, linked gyms aggregate by id.

The join flow, friction-ranked:

1. **Invite link** — `grapplequest.com/g/<slug>` opens the GYM PAGE: pixel map,
   roster (every member's sprite + belt), trophy case, record. One button:
   **JOIN THIS GYM.** New player → the create flow opens *already standing inside
   that gym's pixel replica* — gym name pre-filled, the existing "you push open
   the door to ___" cinematic now describes a real place they know. That moment
   is the magic of the entire system. Existing player → join instantly
   ("changing academies" allowed; past wins stay with the old gym).
2. **QR poster** — auto-generated poster (pixel gym + QR + "Train at [gym] in
   Grapple Quest") for the physical gym wall. The Academia pilot artifact.
3. **Top Gyms board** — every leaderboard row becomes tappable → gym page → join.
   The leaderboard turns into a recruitment surface.

No signup wall: anonymous device-scoped membership joins instantly; Supabase auth
upgrade only to protect/sync your spot. Gating joins behind accounts kills the
K-factor at its strongest moment.

**Drop-ins (async multiplayer, zero realtime infra):** visiting any gym page →
"DROP IN" loads their map as a visitable region — roster members appear as NPCs
fightable with their real builds (the challenge-link tech, server-stored). Beat
someone on their own mat → it's logged in the gym's guest book. BJJ culture
already calls this dropping in; the fiction is free.

## D. Link unfurls

Gym links shared into WhatsApp/IG must show THE gym, not generic art: pre-render
a gym OG card (map + name + member count) to Supabase storage at create/update;
a Netlify function at /g/:slug serves meta + redirects into the app.

## E. Build phases

- **V1 Identity Core (~3-4 days):** gyms + membership + invite links + gym page +
  join-with-prefilled-creation; palette-kit custom maps; story-format cards;
  founder card. ← the K-factor skeleton
- **V2 Evolution (~2-3 days):** belt-evolution gens at promotion + reveal ceremony
  + aura FX stack; team photo generator.
- **V3 Drop-ins (~2-3 days):** visitable gyms, roster-as-NPCs, guest book, dynamic
  gym OG unfurls, QR poster generator.
- **V4 Pro (later):** style-transfer makeovers, verified gyms, B2B gym pack,
  Gym Wars season integration.

Risks: Supabase becomes load-bearing (needs RLS policies — well-trodden); gym
name squatting (first-come slug + report button; verification solves it properly);
PixelLab budget at scale (caps protect until Pro tier is justified); sprite
moderation (32px abstraction is inherently low-risk; report button on gym pages).

Sequencing vs Parts 1-2: combat Week 1 still goes first — viral growth pointed at
a game with 53% dead turns wastes the traffic. Identity Engine V1 slots in as
Week 2-3 alongside the retention layer, and the Academia pilot becomes the first
real gym.
