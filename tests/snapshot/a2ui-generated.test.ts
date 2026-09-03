import { createDemoSnapshot } from '@src/editor/demo';
import filteredList from '@src/editor/fixtures/filtered-list.json';
import login from '@src/editor/fixtures/login.json';
import loginOtp from '@src/editor/fixtures/login-otp.json';
import settings from '@src/editor/fixtures/settings.json';
import { toMessages } from '@src/editor/snapshot';
import { CATALOG_PAGES } from '@src/studio/catalog/catalogPages';
import { describe, expect, it } from 'vitest';
import { generatedModel, mustApply } from '../helpers/a2ui';

const EXAMPLES = {
  login,
  settings,
  'filtered-list': filteredList,
  'login-otp': loginOtp,
} as const;

describe('A2UI generated page models', () => {
  it('snapshots the demo surface after generation', () => {
    const snapshot = createDemoSnapshot();
    expect(generatedModel(snapshot)).toMatchSnapshot('demo-model');
    expect(toMessages(snapshot)).toMatchSnapshot('demo-messages');
  });

  it.each(Object.entries(EXAMPLES))(
    'snapshots generated content for example %s',
    (id, doc) => {
      const snapshot = mustApply(doc);
      expect(generatedModel(snapshot)).toMatchSnapshot(`${id}-model`);
      expect(toMessages(snapshot)).toMatchSnapshot(`${id}-messages`);
    },
  );

  it.each(Object.entries(CATALOG_PAGES))(
    'snapshots generated content for catalog %s',
    (name, messages) => {
      const snapshot = mustApply(messages);
      expect(generatedModel(snapshot)).toMatchSnapshot(`${name}-model`);
    },
  );
});
