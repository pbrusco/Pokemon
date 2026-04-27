import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const metadata = JSON.parse(readFileSync(join(ROOT, 'src/data/reference/pokered_metadata.json'), 'utf8'));

// We'll mock buildNPCDatabase and buildItemDatabase behavior by reading the file
const npcDbContent = readFileSync(join(ROOT, 'src/data/npcDatabase.ts'), 'utf8');

function countMatches(pattern) {
  const matches = npcDbContent.match(new RegExp(pattern, 'g'));
  return matches ? matches.length : 0;
}

console.log('=== KANTO FAITHFULNESS AUDIT ===\n');
console.log(`${'MAP'.padEnd(20)} | ${'NPCs (Found/Exp)'.padEnd(15)} | ${'Signs (Found/Exp)'.padEnd(15)} | ${'Status'}`);
console.log('-'.repeat(65));

for (const [id, target] of Object.entries(metadata)) {
  const mapPrefix = id.toLowerCase().split('_')[0];
  const fullPrefix = id.toLowerCase();
  
  // Look for any entity id that contains the city name or prefix
  const npcRegex = new RegExp(`id:\\s*'${fullPrefix}_[^']+'|id:\\s*'${mapPrefix}_[^']+'`, 'gi');
  const allMatches = npcDbContent.match(npcRegex) || [];
  
  const signsCount = allMatches.filter(m => m.toLowerCase().includes('sign_')).length;
  const doorsCount = allMatches.filter(m => m.toLowerCase().includes('door_')).length;
  const itemsCount = allMatches.filter(m => m.toLowerCase().includes('item_')).length;
  
  const totalNpcs = allMatches.length - signsCount - doorsCount - itemsCount;

  const npcOk = totalNpcs >= target.npcs;
  const signOk = signsCount >= target.signs;
  const status = (npcOk && signOk) ? '✅ FAITHFUL' : '🚧 IN PROGRESS';

  console.log(`${id.padEnd(20)} | ${String(totalNpcs).padStart(2)}/${target.npcs.toString().padEnd(10)} | ${String(signsCount).padStart(2)}/${target.signs.toString().padEnd(11)} | ${status}`);
}

console.log('\nNote: Layout alignment (x,y) and walkable tile checks are handled by vitest worldIntegrity.test.ts');
