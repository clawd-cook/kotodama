import { describe, expect, it } from 'vitest';
import { applyDocument } from '../editor/applyDocument';
import login from '../editor/fixtures/login.json';
import { emptySnapshot } from '../editor/storage';
import { createScreen } from './createScreen';

describe('R create room', () => {
  it('R-01 empty page opens landing; valid page opens workshop', () => {
    expect(
      createScreen({ snapshot: emptySnapshot(), visitedWorkshop: false }),
    ).toBe('landing');

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

  it('R-02 visited workshop stays in workshop even if the page is empty', () => {
    expect(
      createScreen({ snapshot: emptySnapshot(), visitedWorkshop: true }),
    ).toBe('workshop');
  });
});
