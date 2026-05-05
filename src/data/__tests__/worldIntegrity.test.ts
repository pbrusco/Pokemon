import { describe, it, expect } from 'vitest';
import { validateWorld } from '../../lib/worldValidator';

describe('world integrity', () => {
  it('validator runs without throwing', () => {
    const issues = validateWorld();
    expect(Array.isArray(issues)).toBe(true);
  });

  // Warp categories are the load-bearing ones for round-trip travel; locked
  // by warpRoundTrip.test.ts at the per-warp level. Here we just assert that
  // the validator-produced count doesn't regress — bump these baselines down
  // as the FireRed migration cleans up data drift.
  it('warp issue count stays under baseline', () => {
    const issues = validateWorld();
    const warpCount = issues.filter(i => i.category === 'warp').length;
    // Print actual count on first failure so we can track migration progress.
    if (warpCount > 200) {
      console.error(`[worldIntegrity] warp issues = ${warpCount}; sample:`,
        issues.filter(i => i.category === 'warp').slice(0, 5).map(i => i.message));
    }
    expect(warpCount).toBeLessThanOrEqual(200);
  });
});
