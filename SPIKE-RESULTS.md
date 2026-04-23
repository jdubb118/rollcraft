# Phase 0.5 PixelLab Animation Spike — Results

**Date:** 2026-04-22
**Budget spent:** 3 gens (of 1805 remaining; now 1802)

## Question
Can PixelLab produce a consistent 2-frame walk cycle by conditioning on an existing directional sprite, so that Phase 1 walk animation uses real AI frames instead of programmatic bob?

## What the API currently accepts

| Endpoint | `concept_image` | Reference image | Notes |
|---|---|---|---|
| `create-image-pixflux` | **Rejected** (422 `extra_forbidden`) | — | Only produces fresh sprites unconditioned on existing art. Identity drift is fatal for walk cycles. |
| `create-character-with-4-directions` | **Rejected** (422, also rejects `no_background`) | — | Endpoint exists but param schema has changed since the directional sprites were originally generated. |
| `rotate` | n/a | **Accepts `from_image`** (200) | Works. Preserves character identity well. |

## `rotate` behavior
- `from_direction: south`, `to_direction: south` → produces a subtle variation of the same pose. Proportions + gi + face all preserved, but the pose change is too subtle to read as "walking" — looks like a near-duplicate.
- `from_direction: south`, `to_direction: east` → produces a proper directional rotation (we already have these sprites generated this way).
- Does not appear to accept a pose/action description that would push toward a walking frame.

## Decision
**Fall back to programmatic animation.**

Reasons:
1. Pixflux's previous conditioning path (`concept_image`) is closed off. Fresh gens drift in identity — unacceptable for alternating frames.
2. `rotate` same-direction produces near-duplicates, not a mid-stride pose. Using it would spend gens on ~80 sprites whose animation value is marginal.
3. Programmatic bob is cheap, perfectly consistent, and syncs cleanly to `moveProgress` without any new assets.

## Impact on Phase 1
- **Walk cycle:** Programmatic 1px vertical bob synced to `moveProgress` in `OverworldRenderer.ts`. Adds no sprites, no API calls.
- **Ambient tiles (water, torch, grass):** Color cycling via extended `TILE_COLORS` (already planned). Also no PixelLab needed.
- **Idle breathing:** Programmatic sine-wave vertical translate on sprite draw. No sprites needed.
- **Saved:** ~60 gens we were ready to spend on walk frames; remain banked for future work (region expansion, NPC portraits, etc.).

## Follow-up
No code changes from the spike. The three probe scripts (`spike-walk-cycles.mjs`, `spike-probe.mjs`, `spike-probe2.mjs`, `spike-probe3.mjs`) can be deleted or kept as API-shape references. The `spike-out/` directory contains the rotate samples for reference.

**Next:** Phase 1 — Ambient Life, all programmatic.
