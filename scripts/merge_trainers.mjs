import { readFileSync, writeFileSync } from 'fs';

const npcPath = '/Users/pbrusco/projects/poke/src/data/npcDatabase.ts';
const entriesPath = '/Users/pbrusco/projects/poke/scripts/out/new_trainers_to_append.txt';

const npcContent = readFileSync(npcPath, 'utf-8');
const entriesContent = readFileSync(entriesPath, 'utf-8');

// ── Find the buildNPCDatabase return block ──
const npcFuncStart = npcContent.indexOf('export function buildNPCDatabase(');
const npcReturnStart = npcContent.indexOf('return {', npcFuncStart);
const buildItemStart = npcContent.indexOf('export function buildItemDatabase(');

// The return { ... } block of buildNPCDatabase
const npcReturnBlock = npcContent.slice(npcReturnStart, buildItemStart);
const npcBlockOffset = npcReturnStart;

// ── Parse new_trainers_to_append.txt into Map<MapID, {raw, id}[]> ──
function findMapSectionsInTxt(text) {
  const maps = [];
  const sectionRe = /      \/\/ ── (\w+) \(generated from pokered\) ──\n/g;
  let match;
  while ((match = sectionRe.exec(text)) !== null) {
    maps.push({ mapId: match[1], startAt: match.index, headerLen: match[0].length });
  }
  return maps;
}

function extractEntries(text, startPos, nextStartPos) {
  let endPos = nextStartPos ?? text.length;
  while (endPos > startPos && /\s/.test(text[endPos - 1])) endPos--;
  const slice = text.slice(startPos, endPos);
  const entries = [];
  let i = 0;
  while (i < slice.length) {
    while (i < slice.length && (/\s/.test(slice[i]) || slice[i] === ',')) i++;
    if (i >= slice.length) break;
    if (slice[i] !== '{') { i++; continue; }
    let depth = 0, j = i;
    while (j < slice.length) {
      if (slice[j] === '{') depth++;
      else if (slice[j] === '}') { depth--; if (depth === 0) { j++; break; } }
      j++;
    }
    const raw = slice.slice(i, j);
    const idMatch = raw.match(/id:\s*'([^']+)'/);
    if (idMatch) entries.push({ raw: raw.trimEnd(), id: idMatch[1] });
    i = j;
  }
  return entries;
}

const sectionMaps = findMapSectionsInTxt(entriesContent);
const newEntriesByMap = new Map();
for (let si = 0; si < sectionMaps.length; si++) {
  const { mapId, startAt, headerLen } = sectionMaps[si];
  const entryStart = startAt + headerLen;
  const nextStart = si + 1 < sectionMaps.length ? sectionMaps[si + 1].startAt : null;
  const entries = extractEntries(entriesContent, entryStart, nextStart);
  newEntriesByMap.set(mapId, entries);
}

// ── Parse map sections within buildNPCDatabase return block ──
function findMapSectionsInBlock(text) {
  const sections = [];
  const re = /    ([A-Z][A-Z_0-9]*):\s*\[/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const mapId = match[1];
    const contentStart = match.index + match[0].length;
    let depth = 1, pos = contentStart;
    let inString = false, stringChar = '';
    while (depth > 0 && pos < text.length) {
      const ch = text[pos];
      if (inString) {
        if (ch === '\\') { pos += 2; continue; }
        if (ch === stringChar) inString = false;
        pos++; continue;
      }
      if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; pos++; continue; }
      if (ch === '[') depth++;
      else if (ch === ']') depth--;
      pos++;
    }
    sections.push({ mapId, contentStart, closingBracketPos: pos - 1 });
  }
  return sections;
}

const npcSections = findMapSectionsInBlock(npcReturnBlock);

// Collect existing IDs
const existingIdsByMap = new Map();
for (const s of npcSections) {
  const content = npcReturnBlock.slice(s.contentStart, s.closingBracketPos);
  const ids = new Set([...content.matchAll(/id:\s*'([^']+)'/g)].map(m => m[1]));
  existingIdsByMap.set(s.mapId, ids);
}

// Build modifications
const toProcess = [];
for (const s of npcSections) {
  const newEntries = newEntriesByMap.get(s.mapId);
  if (!newEntries || newEntries.length === 0) continue;
  const existingIds = existingIdsByMap.get(s.mapId);
  const toInsert = newEntries.filter(e => !existingIds || !existingIds.has(e.id));
  if (toInsert.length === 0) continue;
  // Absolute position in the full file
  const absClosingBracket = npcBlockOffset + s.closingBracketPos;
  toProcess.push({ mapId: s.mapId, closingBracketPos: absClosingBracket, toInsert });
}

toProcess.sort((a, b) => b.closingBracketPos - a.closingBracketPos);

let output = npcContent;
const modifications = [];

for (const { mapId, closingBracketPos, toInsert } of toProcess) {
  const prefix = output.slice(0, closingBracketPos);
  const lastOpenBracket = prefix.lastIndexOf('[');
  const sectionContent = prefix.slice(lastOpenBracket + 1);
  const trimmed = sectionContent.trim();
  const needsComma = trimmed.length > 0 && !trimmed.endsWith(',');
  
  const insertionText = toInsert.map(e => '\n      ' + e.raw + ',').join('');
  
  output = output.slice(0, closingBracketPos)
    + (needsComma ? ',' : '')
    + insertionText
    + '\n    '
    + output.slice(closingBracketPos);
  
  modifications.push({ mapId, count: toInsert.length });
}

writeFileSync(npcPath, output, 'utf-8');

console.log('Modifications:');
for (const m of modifications.sort((a,b) => a.mapId.localeCompare(b.mapId))) {
  console.log(`  ${m.mapId}: +${m.count} entries`);
}
console.log(`\nTotal maps modified: ${modifications.length}`);
console.log(`Total entries inserted: ${modifications.reduce((s, m) => s + m.count, 0)}`);
