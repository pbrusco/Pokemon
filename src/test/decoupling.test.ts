import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const FORBIDDEN_DIRS = ['src/lib', 'src/data'];
const REACT_IMPORT_RE = /from\s+['"]react(\/[^'"]*)?['"]/;
const DOM_GLOBALS_RE = /\b(window|document|navigator|localStorage)\b/;

// Known DOM-global leaks awaiting migration to src/render/ or split into
// pure+browser pairs. New violations must NOT be added — fix the offender or
// move it out of src/lib and src/data.
const DOM_GLOBALS_ALLOWLIST: Record<string, string> = {
  // Will be split into pure eventLog + browser bridge in Phase 4.
  'src/lib/eventLog.ts': 'Phase 4: split replay recorder from window/DOM debug bridge',
  // Wraps HTMLAudioElement for all game music. Could be refactored into
  // a pure interface + browser implementation.
  'src/lib/music.ts': 'HTMLAudioElement-based audio controller; extract interface for testability',
};

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function stripComments(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

describe('engine/UI decoupling', () => {
  for (const rel of FORBIDDEN_DIRS) {
    it(`${rel} must not import from 'react'`, () => {
      const offenders: string[] = [];
      for (const file of walk(join(ROOT, rel))) {
        const src = readFileSync(file, 'utf8');
        if (REACT_IMPORT_RE.test(src)) offenders.push(relative(ROOT, file));
      }
      expect(offenders, `Engine code leaked React imports: ${offenders.join(', ')}`).toEqual([]);
    });

    it(`${rel} must not reference DOM globals (window/document/navigator/localStorage)`, () => {
      const offenders: string[] = [];
      for (const file of walk(join(ROOT, rel))) {
        const relPath = relative(ROOT, file);
        if (relPath in DOM_GLOBALS_ALLOWLIST) continue;
        const src = stripComments(readFileSync(file, 'utf8'));
        if (DOM_GLOBALS_RE.test(src)) offenders.push(relPath);
      }
      expect(
        offenders,
        `Engine code leaked DOM globals: ${offenders.join(', ')}\n` +
          `If this is intentional, add an entry to DOM_GLOBALS_ALLOWLIST with a migration note.`,
      ).toEqual([]);
    });

    it(`${rel} allowlist entries must still exist`, () => {
      const stale = Object.keys(DOM_GLOBALS_ALLOWLIST).filter((p) => {
        try {
          const src = stripComments(readFileSync(join(ROOT, p), 'utf8'));
          return !DOM_GLOBALS_RE.test(src);
        } catch {
          return true;
        }
      });
      expect(stale, `Remove these stale allowlist entries: ${stale.join(', ')}`).toEqual([]);
    });
  }
});
