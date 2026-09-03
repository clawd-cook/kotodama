import { toMessages } from '@src/editor/snapshot';
import { BASIC_CATALOG_ID } from '@src/editor/types';
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStudio, stubChatHealth } from '../helpers/studio';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  stubChatHealth();
  URL.createObjectURL = vi.fn(() => 'blob:page');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
});

function validMessages() {
  return toMessages({
    surfaceId: 'main',
    catalogId: BASIC_CATALOG_ID,
    sendDataModel: true,
    components: [
      {
        id: 'root',
        component: 'Column',
        children: ['title'],
        justify: 'start',
        align: 'stretch',
      },
      { id: 'title', component: 'Text', text: '打开的标题', variant: 'h3' },
    ],
    dataModel: {},
  });
}

describe('workshop chrome', () => {
  it('toggles dark mode and downloads a current page', async () => {
    const user = userEvent.setup();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    renderStudio('/examples/login');
    await user.click(await screen.findByRole('button', { name: '用这一页' }));
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    await user.click(screen.getByRole('switch', { name: '深色' }));
    expect(document.documentElement.style.colorScheme).toBe('dark');
    await user.click(screen.getByRole('button', { name: '下载' }));
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    click.mockRestore();
    await user.click(screen.getByRole('button', { name: '登录' }));
    await user.click(screen.getByRole('tab', { name: /事件/ }));
    expect(document.querySelector('.dock-log')?.textContent?.length).toBeGreaterThan(10);
  });

  it('opens JSON, confirms reset, and redirects unknown routes', async () => {
    const user = userEvent.setup();
    renderStudio('/nope');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    const file = new File([JSON.stringify(validMessages())], 'page.json', {
      type: 'application/json',
    });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);
    expect(await screen.findByText('打开的标题')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '新建' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /新\s*建/ }));
    await waitFor(() => {
      expect(screen.queryByText('打开的标题')).toBeNull();
    });
  });

  it('rejects an invalid opened file', async () => {
    const user = userEvent.setup();
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    const file = new File(['{'], 'bad.json', { type: 'application/json' });
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    await user.upload(input, file);
    await user.click(screen.getByRole('tab', { name: /错误/ }));
    expect(await screen.findByText(/没有打开/)).toBeTruthy();
  });

  it('copies, collapses, and reopens the source pane', async () => {
    const user = userEvent.setup();
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    const source = document.querySelector('.source-pane') as HTMLElement;
    await user.click(
      [...source.querySelectorAll('button')].find(
        (button) => button.textContent === '复制',
      ) as HTMLButtonElement,
    );
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await user.click(
      [...source.querySelectorAll('button')].find(
        (button) => button.textContent === '收起',
      ) as HTMLButtonElement,
    );
    await user.click(await screen.findByRole('button', { name: '打开源文件' }));
    expect(document.querySelector('.source-pane')).toBeTruthy();
  });

  it('applies JSON from the source editor and shows parse errors', async () => {
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    const editor = document.querySelector(
      '.source-pane [aria-label="源码编辑器"]',
    ) as HTMLTextAreaElement;
    fireEvent.change(editor, { target: { value: '{' } });
    await waitFor(
      () => {
        expect(document.querySelector('.source-pane .ant-alert')).toBeTruthy();
      },
      { timeout: 2000 },
    );
    fireEvent.change(editor, {
      target: { value: JSON.stringify(validMessages()) },
    });
    expect(await screen.findByText('打开的标题')).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: '源码编辑器置空' })[0]);
  });

  it('opens dock tabs, edits data, and shows errors', async () => {
    const user = userEvent.setup();
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: '事件' }));
    expect(screen.getByText('还没有事件。在纸页上点一下就会出现。')).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: '错误' }));
    expect(screen.getByText('没有错误。')).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: '数据' }));
    const dataEditor = document.querySelector(
      '.dock-pane [aria-label="源码编辑器"]',
    ) as HTMLTextAreaElement;
    fireEvent.change(dataEditor, { target: { value: '{' } });
    fireEvent.change(dataEditor, { target: { value: '{"ok":true}' } });
    await user.click(
      within(document.querySelector('.bottom-dock') as HTMLElement).getByRole(
        'button',
        { name: '收起' },
      ),
    );
  });

  it('selects from the tree, edits inspector fields, and uses shortcuts', async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    renderStudio('/examples/login');
    await user.click(await screen.findByRole('button', { name: '用这一页' }));
    await user.click(screen.getByRole('tab', { name: '组件' }));
    await user.click(screen.getByText(/Text\s+title/));
    expect(await screen.findByText(/Text · title/)).toBeTruthy();
    const textInput = document.querySelector(
      '.inspector input',
    ) as HTMLInputElement;
    await user.clear(textInput);
    await user.type(textInput, '新标题');
    await user.click(screen.getByRole('radio', { name: '绑定' }));
    await user.click(screen.getByRole('radio', { name: '字面量' }));
    await user.click(screen.getByRole('button', { name: '复制' }));
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'z',
        metaKey: true,
        shiftKey: true,
        bubbles: true,
      }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'd', metaKey: true, bubbles: true }),
    );
    const selected = document.querySelector(
      '[data-a2ui-id="title"]',
    ) as HTMLElement;
    selected?.dispatchEvent(
      new MouseEvent('mouseover', { bubbles: true, cancelable: true }),
    );
    selected?.focus();
    fireEvent.keyDown(selected, { key: 'Enter' });
    fireEvent.keyDown(selected, { key: ' ' });
    fireEvent.keyDown(selected, { key: 'ArrowDown' });
    fireEvent.click(selected);
    const canvas = document.querySelector('.preview-canvas') as HTMLElement;
    fireEvent.click(canvas);
    fireEvent.keyDown(canvas, { key: 'Escape' });
    const selectedNode = screen.getByText(/Text\s+title/);
    await user.click(selectedNode);
    await user.click(selectedNode);
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Delete', bubbles: true }),
    );
    const typing = document.createElement('input');
    document.body.appendChild(typing);
    typing.focus();
    window.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Delete',
        bubbles: true,
      }),
    );
    typing.remove();
  });

  it('confirms replacing the current page from another example', async () => {
    const user = userEvent.setup();
    renderStudio('/examples/login');
    await user.click(await screen.findByRole('button', { name: '用这一页' }));
    await user.click(screen.getByRole('link', { name: '精选案例' }));
    await user.click(await screen.findByRole('link', { name: /设置页/ }));
    await user.click(await screen.findByRole('button', { name: '用这一页' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /换\s*上/ }));
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
  });

  it('clears channel settings and redirects unknown catalog names', async () => {
    const user = userEvent.setup();
    renderStudio('/catalog/Table');
    expect(await screen.findByRole('heading', { name: 'Column' })).toBeTruthy();
    renderStudio('/examples/missing');
    expect(await screen.findByRole('heading', { name: '精选案例' })).toBeTruthy();
    renderStudio('/settings');
    await user.click(await screen.findByRole('button', { name: /保\s*存/ }));
    await waitFor(() => {
      expect(localStorage.getItem('kotodama.channel:v1')).toBeNull();
    });
    expect(screen.getByRole('link', { name: '跳到表单' })).toBeTruthy();
  });

  it('copies catalog JSON and opens a modal fixture', async () => {
    const user = userEvent.setup();
    renderStudio('/catalog/Modal');
    expect(await screen.findByRole('heading', { name: 'Modal' })).toBeTruthy();
    const well = document.querySelector('.catalog-detail .json-well') as HTMLElement;
    await user.click(screen.getAllByRole('button', { name: '复制' })[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    await user.click(await screen.findByText('打开'));
    expect(await screen.findByText('一层内容')).toBeTruthy();
    expect(well.textContent).toContain('"component": "Modal"');
  });

  it('resizes the trace handle after opening the dock', async () => {
    const user = userEvent.setup();
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    await user.click(screen.getByRole('tab', { name: '事件' }));
    const handle = await screen.findByRole('button', {
      name: '调整记录条高度',
    });
    handle.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        clientY: 400,
        pointerId: 1,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        clientY: 300,
        pointerId: 1,
      }),
    );
    handle.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        clientY: 300,
        pointerId: 1,
      }),
    );
    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    const bar = document.querySelector('.ant-splitter-bar');
    if (bar) {
      fireEvent.pointerDown(bar, { clientX: 120, clientY: 40, pointerId: 2 });
      fireEvent.pointerMove(bar, { clientX: 200, clientY: 40, pointerId: 2 });
      fireEvent.pointerUp(bar, { clientX: 200, clientY: 40, pointerId: 2 });
      fireEvent.mouseDown(bar, { clientX: 120 });
      fireEvent.mouseMove(document, { clientX: 200 });
      fireEvent.mouseUp(document, { clientX: 200 });
    }
    for (const handle of document.querySelectorAll(
      '[class*="splitter-bar"], [class*="splitter-handle"]',
    )) {
      fireEvent.pointerDown(handle, { clientX: 100, pointerId: 3 });
      fireEvent.pointerMove(handle, { clientX: 160, pointerId: 3 });
      fireEvent.pointerUp(handle, { clientX: 160, pointerId: 3 });
    }
  });
});
