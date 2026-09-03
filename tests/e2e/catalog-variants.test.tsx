import { ChildList } from '@catalog/ChildList';
import { Field } from '@catalog/Field';
import {
  antdCatalog,
  BASIC_CATALOG_ID,
  catalogComponents,
  ChildList as ExportedChildList,
} from '@kotodama/antd-catalog';
import { PaperPreview } from '@src/paper/PaperPreview';
import { CATALOG_PAGES } from '@src/pages/catalog/catalogPages';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStudio, stubChatHealth } from '../helpers/studio';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  stubChatHealth();
});

function snapshot(
  components: Record<string, unknown>[],
  dataModel: Record<string, unknown> = {},
) {
  return {
    surfaceId: 'main',
    catalogId: BASIC_CATALOG_ID,
    sendDataModel: true,
    components,
    dataModel,
  };
}

describe('catalog barrel and helpers', () => {
  it('re-exports the catalog and ChildList', () => {
    expect(antdCatalog.id).toBe(BASIC_CATALOG_ID);
    expect(catalogComponents.length).toBeGreaterThan(0);
    expect(ExportedChildList).toBe(ChildList);
  });

  it('renders object child refs and an empty list', () => {
    const { container: empty } = render(
      <ChildList
        childList={undefined}
        context={{} as never}
        buildChild={() => <span>no</span>}
      />,
    );
    expect(empty.textContent).toBe('');
    const { container } = render(
      <ChildList
        childList={[{ id: 'row', basePath: '/items/0' }]}
        context={{} as never}
        buildChild={(id, basePath) => (
          <span>
            {id}:{basePath}
          </span>
        )}
      />,
    );
    expect(container.textContent).toBe('row:/items/0');
    const { container: named } = render(
      <ChildList
        childList={['plain']}
        context={{} as never}
        buildChild={(id) => <span>{id}</span>}
      />,
    );
    expect(named.textContent).toBe('plain');
  });

  it('shows a field error', () => {
    render(
      <Field label="名称" error="必填" weight={1}>
        <input />
      </Field>,
    );
    expect(screen.getByText('必填')).toBeTruthy();
    const { container } = render(
      <Field>
        <input aria-label="无标签" />
      </Field>,
    );
    expect(container.querySelector('.ant-form-item-label')).toBeNull();
  });
});

describe('catalog pages', () => {
  it('renders every catalog fixture page', async () => {
    renderStudio('/catalog/Column');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Column' }),
    ).toBeTruthy();
    for (const name of Object.keys(CATALOG_PAGES)) {
      fireEvent.click(screen.getByRole('link', { name }));
      expect(
        await screen.findByRole('heading', { level: 1, name }),
      ).toBeTruthy();
    }
  });
});

describe('catalog variants', () => {
  it('covers image, icon, text, media, and input variants', async () => {
    const cases = [
      snapshot([
        {
          id: 'root',
          component: 'Image',
          url: 'https://example.com/a.png',
          description: '图',
          variant: 'icon',
          fit: 'scaleDown',
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'Image',
          url: 'https://example.com/a.png',
          variant: 'avatar',
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'Image',
          url: 'https://example.com/a.png',
          variant: 'smallFeature',
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'Image',
          url: 'https://example.com/a.png',
          variant: 'header',
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'Icon',
          name: { svgPath: 'M0 0h24v24H0z' },
        },
      ]),
      snapshot([{ id: 'root', component: 'Icon', name: 'star' }]),
      snapshot([
        { id: 'root', component: 'Text', text: '大标题', variant: 'h1' },
      ]),
      snapshot([
        { id: 'root', component: 'Text', text: '说明', variant: 'caption' },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'TextField',
          label: '长文',
          value: 'a',
          variant: 'longText',
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'TextField',
          label: '数字',
          value: '2',
          variant: 'number',
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'TextField',
          label: '密码',
          value: 'x',
          variant: 'obscured',
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'ChoicePicker',
          label: '多选',
          variant: 'multipleSelection',
          options: [
            { label: 'A', value: 'a' },
            { label: 'B', value: 'b' },
          ],
          value: { path: '/picked' },
        },
      ], { picked: ['a'] }),
      snapshot([
        {
          id: 'root',
          component: 'DateTimeInput',
          label: '时间',
          value: '2020-01-01T10:00:00.000Z',
          enableDate: false,
          enableTime: true,
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'DateTimeInput',
          label: '日期时间',
          value: '2020-01-01T10:00:00.000Z',
          enableDate: true,
          enableTime: true,
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'DateTimeInput',
          label: '空',
          value: '',
          enableDate: false,
          enableTime: false,
        },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'List',
          children: ['item'],
          direction: 'horizontal',
        },
        { id: 'item', component: 'Text', text: '横排', variant: 'body' },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'Button',
          child: 'label',
          variant: 'primary',
          isValid: false,
        },
        { id: 'label', component: 'Text', text: '主按钮', variant: 'body' },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'Button',
          child: 'label',
          variant: 'borderless',
        },
        { id: 'label', component: 'Text', text: '链接按钮', variant: 'body' },
      ]),
      snapshot([
        { id: 'root', component: 'Divider', axis: 'vertical' },
      ]),
      snapshot([
        {
          id: 'root',
          component: 'Tabs',
          tabs: [{ title: { path: '/t' }, child: 'panel' }],
        },
        { id: 'panel', component: 'Text', text: '页', variant: 'body' },
      ]),
      snapshot([]),
    ];

    for (const page of cases) {
      const view = render(
        <PaperPreview
          snapshot={page}
          theme="light"
          catalog={antdCatalog}
          onError={() => undefined}
        />,
      );
      await waitFor(() => {
        expect(document.querySelector('.preview-sheet')).toBeTruthy();
      });
      view.unmount();
    }
  });

  it('syncs data, toasts events, and clears selection on the paper', async () => {
    const user = userEvent.setup();
    const onEvent = vi.fn();
    const onDataModel = vi.fn();
    const onError = vi.fn();
    const onSelectNone = vi.fn();
    const page = snapshot(
      [
        {
          id: 'root',
          component: 'Button',
          child: 'label',
          variant: 'primary',
          action: { event: { name: 'go' } },
        },
        { id: 'label', component: 'Text', text: '点我', variant: 'body' },
      ],
      { title: '一' },
    );
    const { rerender } = render(
      <PaperPreview
        snapshot={page}
        theme="dark"
        catalog={antdCatalog}
        drop
        flush
        interactive
        sheetId="sheet"
        onEvent={onEvent}
        onDataModel={onDataModel}
        onError={onError}
        onSelectNone={onSelectNone}
      />,
    );
    expect(await screen.findByText('点我')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '点我' }));
    await waitFor(() => {
      expect(onEvent).toHaveBeenCalled();
    });
    const canvas = document.querySelector('.preview-canvas') as HTMLElement;
    fireEvent.click(canvas);
    fireEvent.keyDown(canvas, { key: 'Escape' });
    expect(onSelectNone).toHaveBeenCalled();
    rerender(
      <PaperPreview
        snapshot={{ ...page, dataModel: { title: '二' } }}
        theme="light"
        catalog={antdCatalog}
        interactive
        onSelectNone={onSelectNone}
      />,
    );
  });
});
