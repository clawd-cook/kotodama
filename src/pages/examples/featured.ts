import type { A2uiMessage } from '../../editor/types';
import filteredList from './fixtures/filtered-list.json';
import login from './fixtures/login.json';
import settings from './fixtures/settings.json';

export type ExampleId = 'login' | 'settings' | 'filtered-list';

export const EXAMPLES: Record<
  ExampleId,
  { title: string; blurb: string; messages: A2uiMessage[] }
> = {
  login: {
    title: '登录表单',
    blurb: '账号和密码、主按钮',
    messages: login as A2uiMessage[],
  },
  settings: {
    title: '设置页',
    blurb: '分组的多项设置',
    messages: settings as A2uiMessage[],
  },
  'filtered-list': {
    title: '带筛选的列表',
    blurb: '先筛再列出结果',
    messages: filteredList as A2uiMessage[],
  },
};

export function isExampleId(id: string): id is ExampleId {
  return Object.hasOwn(EXAMPLES, id);
}

export const EXAMPLE_ORDER: ExampleId[] = [
  'login',
  'settings',
  'filtered-list',
];
