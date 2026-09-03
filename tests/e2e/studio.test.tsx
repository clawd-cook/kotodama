import { EditorApp } from '@src/editor/EditorApp';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/chat/health')) {
        return new Response(
          JSON.stringify({
            ok: true,
            env: { baseUrl: '', model: '', hasApiKey: false },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
      }
      return new Response('{}', { status: 404 });
    }),
  );
});

function renderStudio(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <EditorApp />
    </MemoryRouter>,
  );
}

describe('studio shell e2e', () => {
  it('opens the workshop with chat prompts and a channel warning', async () => {
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    expect(screen.getByText('说你想要的那一页')).toBeTruthy();
    expect(screen.getByText('做一个登录表单')).toBeTruthy();
    expect(screen.getByText('通道没配好。去设置里填 Base URL、API Key 和模型名。')).toBeTruthy();
    expect(screen.getByPlaceholderText('描述你想要的界面…')).toBeTruthy();
  });

  it('navigates the rail to catalog, examples, and settings', async () => {
    const user = userEvent.setup();
    renderStudio('/');

    await user.click(screen.getByRole('link', { name: '基础组件' }));
    expect(await screen.findByRole('heading', { name: 'Column' })).toBeTruthy();
    expect(screen.getAllByText('从上到下排').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('link', { name: '精选案例' }));
    expect(await screen.findByRole('heading', { name: '精选案例' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /登录表单/ })).toBeTruthy();

    await user.click(screen.getByRole('link', { name: '设置' }));
    expect(await screen.findByRole('heading', { name: '设置' })).toBeTruthy();
    expect(screen.getByLabelText('Base URL')).toBeTruthy();
    expect(screen.getByLabelText('API Key')).toBeTruthy();
    expect(screen.getByLabelText('模型名')).toBeTruthy();
  });

  it('saves channel settings into localStorage', async () => {
    const user = userEvent.setup();
    renderStudio('/settings');
    await user.type(screen.getByLabelText('Base URL'), 'https://ui.example');
    await user.type(screen.getByLabelText('API Key'), 'ui-key');
    await user.type(screen.getByLabelText('模型名'), 'ui-model');
    await user.click(screen.getByRole('button', { name: /保\s*存/ }));
    await waitFor(() => {
      expect(localStorage.getItem('kotodama.channel:v1')).toContain(
        'https://ui.example',
      );
    });
  });

  it('opens a catalog component and shows generated JSON', async () => {
    renderStudio('/catalog/Button');
    expect(await screen.findByRole('heading', { name: 'Button' })).toBeTruthy();
    const json = document.querySelector('.catalog-detail .json-well');
    expect(json?.textContent).toContain('"component": "Button"');
    expect(await screen.findByText('确定')).toBeTruthy();
  });

  it('opens an example detail with generated login copy', async () => {
    renderStudio('/examples/login');
    expect(await screen.findByRole('heading', { name: '登录表单' })).toBeTruthy();
    expect(await screen.findByText('账号')).toBeTruthy();
    expect(screen.getByRole('button', { name: '用这一页' })).toBeTruthy();
  });
});
