// Parse each region map and emit IDs of NPCs where wanders: true.
import { readdirSync, readFileSync } from 'fs';

const dir = 'src/overworld/maps';
const files = readdirSync(dir).filter(f => f.endsWith('.ts') && f !== 'registry.ts');

const wanderers = [];
for (const f of files) {
  const src = readFileSync(`${dir}/${f}`, 'utf8');
  // Match each NPCDef { ... } block
  const blocks = src.split(/\{\s*\n\s*id:\s*['"]/).slice(1);
  for (const block of blocks) {
    const idMatch = block.match(/^([^'"]+)['"]/);
    if (!idMatch) continue;
    const id = idMatch[1];
    // Look inside the block (until the closing } at top level) for wanders: true
    const endIdx = block.indexOf('\n  },');
    const body = endIdx > -1 ? block.slice(0, endIdx) : block.slice(0, 2000);
    if (/\bwanders:\s*true/.test(body)) wanderers.push(id);
  }
}
console.log(wanderers.join('\n'));
console.log(`\n# total wanderers: ${wanderers.length}`);
