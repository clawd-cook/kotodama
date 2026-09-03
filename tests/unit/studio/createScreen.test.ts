import { applyDocument } from '@src/editor/applyDocument';
import login from '@src/editor/fixtures/login.json';
import { emptySnapshot } from '@src/editor/storage';
import { createScreen } from '@src/studio/createScreen';
import { describe, expect, it } from 'vitest';

describe('R create room', () => {
  it('R-01 create room is always the workshop', () => {
    expect(
      createScreen({ snapshot: emptySnapshot(), visitedWorkshop: false }),
    ).toBe('workshop');

    const applied = applyDocument(JSON.stringify(login), emptySnapshot());
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      return;
    }
    expect(
      createScreen({
        snapshot: applied.snapshot,
        visitedWorkshop: false,
      }),
    ).toBe('workshop');
  });
});
