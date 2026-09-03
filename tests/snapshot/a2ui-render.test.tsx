import { createDemoSnapshot } from '@src/editor/demo';
import filteredList from '@src/pages/examples/fixtures/filtered-list.json';
import login from '@src/pages/examples/fixtures/login.json';
import settings from '@src/pages/examples/fixtures/settings.json';
import { CATALOG_PAGES } from '@src/pages/catalog/catalogPages';
import { afterEach, describe, expect, it } from 'vitest';
import { mustApply, renderGeneratedSurface } from '../helpers/a2ui';

const cleanups: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanups.length > 0) {
    const cleanup = cleanups.pop();
    await cleanup?.();
  }
});

async function snapshotGenerated(label: string, doc: unknown) {
  const snapshot = typeof doc === 'object' && doc && 'components' in doc
    ? (doc as ReturnType<typeof createDemoSnapshot>)
    : mustApply(doc);
  const rendered = await renderGeneratedSurface(snapshot);
  cleanups.push(rendered.cleanup);
  expect(rendered.markup).toMatchSnapshot(label);
  return rendered;
}

describe('A2UI rendered generated content', () => {
  it('renders demo copy onto the surface', async () => {
    const rendered = await snapshotGenerated('demo-text', createDemoSnapshot());
    expect(rendered.text).toContain('任务管理');
    expect(rendered.text).toContain('查询');
    expect(rendered.text).toContain('春季保洁激励');
  });

  it('renders the login example', async () => {
    const rendered = await snapshotGenerated('login-text', login);
    expect(rendered.text).toContain('登录');
    expect(rendered.text).toContain('账号');
    expect(rendered.text).toContain('密码');
  });

  it('renders the settings example', async () => {
    const rendered = await snapshotGenerated('settings-text', settings);
    expect(rendered.text).toContain('设置');
    expect(rendered.text).toContain('显示名');
  });

  it('renders the filtered-list example', async () => {
    const rendered = await snapshotGenerated(
      'filtered-list-text',
      filteredList,
    );
    expect(rendered.text).toContain('全部');
  });

  it.each(Object.entries(CATALOG_PAGES))(
    'renders catalog %s generated content',
    async (name, messages) => {
      const rendered = await snapshotGenerated(`${name}-text`, messages);
      expect(
        rendered.text.length + rendered.markup.media.length + rendered.markup.tags.length,
      ).toBeGreaterThan(0);
    },
  );
});
