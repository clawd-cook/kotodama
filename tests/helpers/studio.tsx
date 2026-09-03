import { EditorApp } from '@src/editor/EditorApp';
import { render, screen, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { expect, vi } from 'vitest';

export function stubChatHealth(
  ok: boolean | { baseUrl?: string; model?: string; hasApiKey?: boolean } = true,
) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/chat/health')) {
        if (ok === false) {
          throw new Error('offline');
        }
        const env =
          ok === true
            ? { baseUrl: '', model: '', hasApiKey: false }
            : {
                baseUrl: ok.baseUrl ?? '',
                model: ok.model ?? '',
                hasApiKey: Boolean(ok.hasApiKey),
              };
        return new Response(JSON.stringify({ ok: true, env }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('{}', { status: 404 });
    }),
  );
}

export function renderStudio(
  path:
    | string
    | { pathname: string; search?: string; hash?: string; state?: unknown } = '/',
) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <EditorApp />
    </MemoryRouter>,
  );
}

export async function applyExamplePage(user: UserEvent) {
  await user.click(await screen.findByRole('button', { name: '用这一页' }));
  const dialog = await screen.findByRole('dialog').catch(() => null);
  if (dialog) {
    await user.click(within(dialog).getByRole('button', { name: /换\s*上/ }));
  }
  expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
}
