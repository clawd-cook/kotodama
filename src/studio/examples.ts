import filteredList from '../editor/fixtures/filtered-list.json';
import login from '../editor/fixtures/login.json';
import settings from '../editor/fixtures/settings.json';
import { isCurrentPage } from '../editor/storage';
import type { A2uiMessage, Snapshot } from '../editor/types';

export type ExampleId = 'login' | 'settings' | 'filtered-list';

export const EXAMPLE_PAGES: Record<ExampleId, { messages: A2uiMessage[] }> = {
  login: { messages: login as A2uiMessage[] },
  settings: { messages: settings as A2uiMessage[] },
  'filtered-list': { messages: filteredList as A2uiMessage[] },
};

export function shouldConfirmReplace(snapshot: Snapshot): boolean {
  return isCurrentPage(snapshot);
}
