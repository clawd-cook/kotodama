import { EditorApp } from '@src/editor/EditorApp';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  localStorage.clear();
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

describe('editor e2e', () => {
  it('loads an example into the workshop and inserts a Text node', async () => {
    const user = userEvent.setup();
    renderStudio('/examples/login');
    await user.click(await screen.findByRole('button', { name: '用这一页' }));
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    expect(await screen.findByText('账号')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: '组件' }));
    await user.click(screen.getByRole('button', { name: 'Text' }));
    await waitFor(() => {
      expect(screen.getByText(/Text\s+text-1/)).toBeTruthy();
    });
  });
});
