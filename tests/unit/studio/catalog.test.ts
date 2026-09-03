import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BASIC_COMPONENTS } from '@a2ui/web_core/v0_9/basic_catalog';
import { applyDocument } from '@src/editor/applyDocument';
import { emptySnapshot } from '@src/editor/storage';
import type { A2uiMessage } from '@src/editor/types';
import { ALLOWED_COMPONENTS } from '@src/editor/validate';
import { catalogPropertyNames } from '@src/pages/catalog/catalogPropertyNames';
import { describe, expect, it } from 'vitest';

const FIXTURE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../src/pages/catalog/fixtures',
);
const ALLOWED = new Set<string>(ALLOWED_COMPONENTS);
const FORBIDDEN = ['id', 'component', 'placeholder', 'className'];

type CatalogApi = {
  name: string;
  schema: {
    shape?: Record<string, unknown>;
    _def?: {
      shape?: Record<string, unknown> | (() => Record<string, unknown>);
    };
  };
};

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

function schemaFieldNames(name: string): Set<string> {
  const api = (BASIC_COMPONENTS as CatalogApi[]).find(
    (item) => item.name === name,
  );
  const raw = api?.schema.shape ?? api?.schema._def?.shape;
  const shape = typeof raw === 'function' ? raw() : raw;
  return new Set(Object.keys(shape ?? {}));
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

  it('G-02 property names stay inside the catalog schema', () => {
    for (const name of ALLOWED_COMPONENTS) {
      const allowed = schemaFieldNames(name);
      const names = catalogPropertyNames(name);
      for (const prop of names) {
        expect(allowed.has(prop), `${name}.${prop}`).toBe(true);
      }
      for (const prop of FORBIDDEN) {
        expect(names, name).not.toContain(prop);
      }
    }
  });
});
