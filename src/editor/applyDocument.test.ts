import { describe, expect, it } from 'vitest';
import { applyDocument } from './applyDocument';
import { createDemoSnapshot } from './demo';
import { foldMessages, toMessages } from './snapshot';
import type { A2uiMessage, Snapshot } from './types';

const TITLE = '任务管理';
const QUERY = '查询';

function currentPage(): Snapshot {
  return createDemoSnapshot();
}

function demoMessages(): A2uiMessage[] {
  return structuredClone(toMessages(createDemoSnapshot()));
}

function withComponentName(name: string): string {
  const messages = demoMessages();
  const update = messages.find((item) => item.updateComponents);
  const components = update?.updateComponents?.components ?? [];
  const target = components.find((item) => item.component === 'Text');
  if (target) {
    target.component = name;
  }
  return JSON.stringify(messages);
}

function assertUnchanged(current: Snapshot) {
  expect(current.dataModel).toMatchObject({ title: TITLE });
}

describe('W write gate', () => {
  it('W-01 unknown Table does not replace the page', () => {
    const current = currentPage();
    const result = applyDocument(withComponentName('Table'), current);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Table');
      expect(/[\u4e00-\u9fff]/.test(result.message)).toBe(true);
    }
    assertUnchanged(current);
  });

  it('W-01b unknown Form does not replace the page', () => {
    const current = currentPage();
    const result = applyDocument(withComponentName('Form'), current);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('Form');
    }
    assertUnchanged(current);
  });

  it('W-02 valid demo document becomes the page', () => {
    const current = currentPage();
    const result = applyDocument(
      JSON.stringify(toMessages(createDemoSnapshot())),
      current,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.snapshot.surfaceId).toBe('main');
      expect(
        result.snapshot.components.some((item) => item.id === 'root'),
      ).toBe(true);
      expect((result.snapshot.dataModel as { title?: string }).title).toBe(
        TITLE,
      );
    }
  });

  it('C-01 demo round-trip keeps copy', () => {
    const folded = foldMessages(toMessages(createDemoSnapshot()));
    expect((folded.dataModel as { title?: string }).title).toBe(TITLE);
    expect((folded.dataModel as { queryLabel?: string }).queryLabel).toBe(
      QUERY,
    );
    expect(folded.components.some((item) => item.id === 'root')).toBe(true);
    expect(folded.surfaceId).toBe('main');
    const applied = applyDocument(
      JSON.stringify(toMessages(folded)),
      currentPage(),
    );
    expect(applied.ok).toBe(true);
  });

  it('W-03 missing root does not rename another node', () => {
    const current = currentPage();
    const result = applyDocument(
      JSON.stringify([
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'main',
            catalogId:
              'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
            sendDataModel: true,
          },
        },
        {
          version: 'v0.9',
          updateComponents: {
            surfaceId: 'main',
            components: [
              {
                id: 'title',
                component: 'Text',
                text: '标题',
                variant: 'h3',
              },
            ],
          },
        },
        {
          version: 'v0.9',
          updateDataModel: {
            surfaceId: 'main',
            path: '/',
            value: { title: '无根' },
          },
        },
      ]),
      current,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('root');
    }
    expect((current.dataModel as { queryLabel?: string }).queryLabel).toBe(
      QUERY,
    );
  });

  it('W-04 extra TextField placeholder is rejected', () => {
    const current = currentPage();
    const messages = demoMessages();
    const field = messages
      .find((item) => item.updateComponents)
      ?.updateComponents?.components.find(
        (item) => item.component === 'TextField',
      );
    if (field) {
      field.placeholder = '请输入';
    }
    const result = applyDocument(JSON.stringify(messages), current);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('placeholder');
    }
    assertUnchanged(current);
  });

  it('W-04b extra TextField className is rejected', () => {
    const current = currentPage();
    const messages = demoMessages();
    const field = messages
      .find((item) => item.updateComponents)
      ?.updateComponents?.components.find(
        (item) => item.component === 'TextField',
      );
    if (field) {
      field.className = 'ant-input';
    }
    const result = applyDocument(JSON.stringify(messages), current);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('className');
    }
    assertUnchanged(current);
  });

  it('W-05 inline children are rejected', () => {
    const current = currentPage();
    const messages = demoMessages();
    const root = messages
      .find((item) => item.updateComponents)
      ?.updateComponents?.components.find((item) => item.id === 'root');
    if (root) {
      root.children = [{ id: 'inline', component: 'Text', text: '内联' }];
    }
    const result = applyDocument(JSON.stringify(messages), current);
    expect(result.ok).toBe(false);
    assertUnchanged(current);
  });

  it('W-06 second surface is rejected', () => {
    const current = currentPage();
    const messages = demoMessages();
    messages.push({
      version: 'v0.9',
      createSurface: {
        surfaceId: 'other',
        catalogId:
          'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json',
        sendDataModel: true,
      },
    });
    const result = applyDocument(JSON.stringify(messages), current);
    expect(result.ok).toBe(false);
    assertUnchanged(current);
  });

  it('W-07 non-JSON is rejected', () => {
    const current = currentPage();
    const result = applyDocument('这不是 JSON', current);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(/[\u4e00-\u9fff]/.test(result.message)).toBe(true);
    }
    assertUnchanged(current);
  });

  it('W-08 deleteSurface is rejected', () => {
    const current = currentPage();
    const messages = demoMessages();
    messages.push({
      version: 'v0.9',
      deleteSurface: { surfaceId: 'main' },
    });
    const result = applyDocument(JSON.stringify(messages), current);
    expect(result.ok).toBe(false);
    assertUnchanged(current);
  });

  it('W-09 wrong catalogId is rejected', () => {
    const current = currentPage();
    const messages = demoMessages();
    const create = messages.find((item) => item.createSurface);
    if (create?.createSurface) {
      create.createSurface.catalogId = 'https://example.com/not-basic.json';
    }
    const result = applyDocument(JSON.stringify(messages), current);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/目录|catalogId/);
    }
    assertUnchanged(current);
  });

  it('W-10 nested A2UI component maps still become a page', () => {
    const catalogId =
      'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';
    const result = applyDocument(
      JSON.stringify([
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'main',
            catalogId,
            sendDataModel: true,
          },
        },
        {
          version: 'v0.9',
          updateComponents: {
            surfaceId: 'main',
            components: [
              {
                id: 'root',
                component: {
                  Column: {
                    children: { explicitList: ['title', 'submit'] },
                    justify: 'start',
                    align: 'stretch',
                  },
                },
              },
              {
                id: 'title',
                Text: {
                  text: { path: '/title' },
                  variant: 'h3',
                },
              },
              {
                id: 'submit',
                type: 'Button',
                child: 'label',
                variant: 'primary',
                action: { event: { name: 'login' } },
              },
              {
                id: 'label',
                component: { Text: { text: { path: '/submitLabel' } } },
              },
            ],
          },
        },
        {
          version: 'v0.9',
          updateDataModel: {
            surfaceId: 'main',
            path: '/',
            value: { title: '登录', submitLabel: '登录' },
          },
        },
      ]),
      currentPage(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(
      result.snapshot.components.find((item) => item.id === 'root')?.component,
    ).toBe('Column');
    expect(
      result.snapshot.components.find((item) => item.id === 'root')?.children,
    ).toEqual(['title', 'submit']);
    expect(
      result.snapshot.components.find((item) => item.id === 'title')?.component,
    ).toBe('Text');
    expect(
      result.snapshot.components.find((item) => item.id === 'submit')?.component,
    ).toBe('Button');
  });

  it('W-11 Modal children become trigger and content', () => {
    const catalogId =
      'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';
    const result = applyDocument(
      JSON.stringify([
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'main',
            catalogId,
            sendDataModel: true,
          },
        },
        {
          version: 'v0.9',
          updateComponents: {
            surfaceId: 'main',
            components: [
              {
                id: 'root',
                component: 'Column',
                children: ['row_modal'],
              },
              {
                id: 'row_modal',
                component: 'Modal',
                children: ['open_btn', 'modal_body'],
              },
              {
                id: 'open_btn',
                component: 'Button',
                children: ['btn_label'],
                variant: 'default',
              },
              {
                id: 'btn_label',
                component: 'Text',
                text: '查看序号',
              },
              {
                id: 'modal_body',
                component: 'Text',
                text: { path: '/rowIndex' },
                variant: 'body',
              },
            ],
          },
        },
        {
          version: 'v0.9',
          updateDataModel: {
            surfaceId: 'main',
            path: '/',
            value: { rowIndex: '1' },
          },
        },
      ]),
      currentPage(),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const modal = result.snapshot.components.find(
      (item) => item.id === 'row_modal',
    );
    expect(modal?.component).toBe('Modal');
    expect(modal?.trigger).toBe('open_btn');
    expect(modal?.content).toBe('modal_body');
    expect(modal?.children).toBeUndefined();
    const button = result.snapshot.components.find(
      (item) => item.id === 'open_btn',
    );
    expect(button?.child).toBe('btn_label');
    expect(button?.children).toBeUndefined();
  });
});
