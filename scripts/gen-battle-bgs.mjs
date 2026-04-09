import { readFileSync, writeFileSync, mkdirSync } from 'fs';
const key = readFileSync('.env', 'utf8').match(/PIXELLAB_SECRET=(.+)/)?.[1]?.trim();
const headers = { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' };
mkdirSync('public/sprites/backgrounds', { recursive: true });

async function gen(desc, filename) {
  console.log(`Generating: ${desc.substring(0, 60)}...`);
  const start = Date.now();
  const res = await fetch('https://api.pixellab.ai/v2/create-image-pixflux', {
    method: 'POST', headers,
    body: JSON.stringify({
      description: desc,
      image_size: { width: 320, height: 180 },
      no_background: false,
    }),
  });
  const data = await res.json();
  if (data.image?.base64) {
    writeFileSync(filename, Buffer.from(data.image.base64, 'base64'));
    console.log(`  Saved: ${filename} (${((Date.now()-start)/1000).toFixed(1)}s)`);
  } else {
    console.log(`  Error: ${JSON.stringify(data).substring(0, 200)}`);
  }
}

// Generate battle backgrounds for each region
await gen(
  'pixel art side view of martial arts gym interior, green training mats on floor, wooden walls, technique posters, warm lighting, no characters, clean background for fighting game',
  'public/sprites/backgrounds/bg-home.png'
);

await gen(
  'pixel art side view of industrial warehouse gym, teal blue mats, corrugated metal walls, neon strip lights, speakers hanging, gritty urban, no characters',
  'public/sprites/backgrounds/bg-scramble.png'
);

await gen(
  'pixel art side view of traditional Japanese dojo, tatami mats, dark wood walls, hanging scrolls with kanji, paper lanterns, serene atmosphere, no characters',
  'public/sprites/backgrounds/bg-oldtown.png'
);

await gen(
  'pixel art side view of wrestling room, red rubber mats, padded walls, no windows, harsh fluorescent lights, motivational banners, tough atmosphere, no characters',
  'public/sprites/backgrounds/bg-steel.png'
);

await gen(
  'pixel art side view of beach side open air gym, blue mats under palm tree shade, ocean waves in background, sunset colors, tropical relaxed vibe, no characters',
  'public/sprites/backgrounds/bg-coral.png'
);

await gen(
  'pixel art side view of underground fight gym, dim red and yellow lighting, concrete walls, combat posters, boxing bags hanging, dark moody atmosphere, no characters',
  'public/sprites/backgrounds/bg-sambo.png'
);

await gen(
  'pixel art side view of high tech training facility, white mats, glass walls, screens showing data, modern clean minimalist, blue LED accent lights, no characters',
  'public/sprites/backgrounds/bg-nova.png'
);

await gen(
  'pixel art side view of cliffside mega gym, ocean view through large windows, champion banners hanging from ceiling, premium mats, epic atmosphere, no characters',
  'public/sprites/backgrounds/bg-iron.png'
);

await gen(
  'pixel art side view of grand championship coliseum arena, large competition mats, crowd bleachers in background, spotlights, huge banners, tournament stage, no characters',
  'public/sprites/backgrounds/bg-summit.png'
);

const bal = await fetch('https://api.pixellab.ai/v2/balance', { headers });
console.log('\nBalance:', await bal.text());
