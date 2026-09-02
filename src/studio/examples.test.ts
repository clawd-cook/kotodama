import { describe, expect, it } from 'vitest';
import { applyDocument } from '../editor/applyDocument';
import filteredList from '../editor/fixtures/filtered-list.json';
import login from '../editor/fixtures/login.json';
import settings from '../editor/fixtures/settings.json';
import { foldMessages } from '../editor/snapshot';
import { emptySnapshot } from '../editor/storage';
import type { A2uiMessage } from '../editor/types';
import {
  EXAMPLE_PAGES,
  shouldConfirmReplace,
  type ExampleId,
} from './examples';

const FIXTURES: Record<ExampleId, A2uiMessage[]> = {
  login: login as A2uiMessage[],
  settings: settings as A2uiMessage[],
  'filtered-list': filteredList as A2uiMessage[],
};

describe('E featured examples', () => {
  it('E-01 example ids point at golden fixture files', () => {
    expect(JSON.stringify(EXAMPLE_PAGES.login.messages)).toBe(
      JSON.stringify(login),
    );
    expect(JSON.stringify(EXAMPLE_PAGES.settings.messages)).toBe(
      JSON.stringify(settings),
    );
    expect(JSON.stringify(EXAMPLE_PAGES['filtered-list'].messages)).toBe(
      JSON.stringify(filteredList),
    );
  });

  it('E-02 applying an example onto an empty page matches a fold', () => {
    for (const id of Object.keys(FIXTURES) as ExampleId[]) {
      const result = applyDocument(
        JSON.stringify(EXAMPLE_PAGES[id].messages),
        emptySnapshot(),
      );
      expect(result.ok, id).toBe(true);
      if (!result.ok) {
        continue;
      }
      const folded = foldMessages(FIXTURES[id]);
      const byId = new Map(
        result.snapshot.components.map((component) => [component.id, component]),
      );
      for (const component of folded.components) {
        expect(byId.get(component.id), `${id}.${component.id}`).toEqual(
          component,
        );
      }
      expect(result.snapshot.dataModel, id).toEqual(folded.dataModel);
    }
    const loginResult = applyDocument(
      JSON.stringify(EXAMPLE_PAGES.login.messages),
      emptySnapshot(),
    );
    expect(loginResult.ok).toBe(true);
    if (loginResult.ok) {
      expect(
        (loginResult.snapshot.dataModel as { title?: string }).title,
      ).toBe('登录');
    }
  });

  it('E-03 replacing a valid page requires confirmation', () => {
    expect(shouldConfirmReplace(emptySnapshot())).toBe(false);
    const applied = applyDocument(
      JSON.stringify(EXAMPLE_PAGES.login.messages),
      emptySnapshot(),
    );
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      return;
    }
    expect(shouldConfirmReplace(applied.snapshot)).toBe(true);
  });
});
