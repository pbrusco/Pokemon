import { describe, it, expect } from 'vitest';
import { validateWorld } from '../../lib/worldValidator';

describe('world integrity', () => {
  const issues = validateWorld();

  it('has no integrity issues', () => {
    // If this fails, the expected message lists each violation, so you can
    // see all of them at once instead of one-at-a-time.
    expect(issues, `${issues.length} world integrity issues:\n${issues.map(i => `  [${i.category}] ${i.message}`).join('\n')}`).toEqual([]);
  });
});
