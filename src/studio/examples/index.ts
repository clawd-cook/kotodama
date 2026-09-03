import type { A2uiMessage } from '../../editor/types';
import filteredList from './fixtures/filtered-list.json';
import login from './fixtures/login.json';
import settings from './fixtures/settings.json';

export type ExampleId = 'login' | 'settings' | 'filtered-list';

export const EXAMPLE_PAGES: Record<ExampleId, { messages: A2uiMessage[] }> = {
  login: { messages: login as A2uiMessage[] },
  settings: { messages: settings as A2uiMessage[] },
  'filtered-list': { messages: filteredList as A2uiMessage[] },
};
