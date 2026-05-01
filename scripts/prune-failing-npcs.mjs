#!/usr/bin/env node

/**
 * prune-failing-npcs.mjs
 *
 * Reads worldIntegrity.test.ts and removes all NPC entries that fail validation
 * (OOB, on walls, on boulders). Keeps only clean entries.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const NPC_FILE = join(ROOT, 'src', 'data', 'npcDatabase.ts');

try {
  const result = execSync('npx vitest run src/data/__tests__/worldIntegrity.test.ts 2>&1', {
    cwd: ROOT, timeout: 60000, encoding: 'utf8', maxBuffer: 1024 * 1024,
    env: { ...process.env, PATH: '/opt/homebrew/bin:' + process.env.PATH }
  });

  // Extract failing NPC IDs from the output
  const idPattern = /out-of-bounds: (\w+):(\w+)|on non-walkable tile.*: (\w+):(\w+)/g;
  const badIds = new Set();
  let m;
  while ((m = idPattern.exec(result)) !== null) {
    const id = m[2] || m[4];
    if (id) badIds.add(id);
  }

  if (badIds.size === 0) {
    console.log("No failing NPCs found — world is clean!");
    process.exit(0);
  }

  console.log(`Found ${badIds.size} failing NPC IDs to remove`);

  let source = readFileSync(NPC_FILE, 'utf8');
  const lines = source.split('\n');
  let removed = 0;
  const outLines = [];

  for (const line of lines) {
    const idMatch = line.match(/id:\s*'(\w+)'/);
    if (idMatch && badIds.has(idMatch[1])) {
      removed++;
      continue;
    }
    outLines.push(line);
  }

  writeFileSync(NPC_FILE, outLines.join('\n'));
  console.log(`Removed ${removed} failing NPC entries from npcDatabase.ts`);
} catch (e) {
  console.log("Script error:", e.message);
}
