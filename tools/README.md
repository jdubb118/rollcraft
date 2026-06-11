# tools/

Test + asset harnesses. The Playwright scripts (`e2e.mjs`, `battleshots.mjs`,
`sharecard.mjs`) import `playwright`, which is NOT a dependency of this repo —
run them from the workspace root where playwright is installed:

```
cd ~/.openclaw/workspace
npx vite preview --port 4173 --outDir rollcraft/dist &   # or: cd rollcraft && npx vite preview
node rollcraft/tools/e2e.mjs http://localhost:4173       # full smoke: create→battle→overworld→challenge
node rollcraft/tools/battleshots.mjs http://localhost:4173  # screenshot every battle turn (position layouts)
node rollcraft/tools/sharecard.mjs http://localhost:4173    # promotion share-card download test
python3 rollcraft/tools/spritetest.py <deploy-url>          # live PixelLab gen (SPENDS 1 CREDIT)
```

`og-card.html` is the source for `public/og.png` (1200×630):
```
node ~/.openclaw/workspace/scripts/screenshot.mjs "file://$PWD/tools/og-card.html" public/og.png --width 1200 --height 630 --wait 2000
```
