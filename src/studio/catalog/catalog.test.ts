import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyDocument } from '../../editor/applyDocument';
import { emptySnapshot } from '../../editor/storage';
import type { A2uiMessage } from '../../editor/types';
import { ALLOWED_COMPONENTS } from '../../editor/validate';

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'fixtures');
const ALLOWED = new Set<string>(ALLOWED_COMPONENTS);

function fixtureText(name: string): string {
  return readFileSync(join(FIXTURE_DIR, `${name}.json`), 'utf8');
}

function componentNames(text: string): string[] {
  const messages = JSON.parse(text) as A2uiMessage[];
  return messages.flatMap(
    (item) =>
      item.updateComponents?.components.map(
        (component) => component.component,
      ) ?? [],
  );
}

describe('G catalog gallery', () => {
  it('G-01 every catalog fixture is a valid page', () => {
    for (const name of ALLOWED_COMPONENTS) {
      const text = fixtureText(name);
      const result = applyDocument(text, emptySnapshot());
      expect(result.ok, name).toBe(true);
      const names = componentNames(text);
      for (const component of names) {
        expect(ALLOWED.has(component), component).toBe(true);
      }
      expect(names, name).toContain(name);
    }
  });
});
