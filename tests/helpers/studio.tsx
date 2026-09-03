import { EditorApp } from '@src/editor/EditorApp';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

export function stubChatHealth(ok = true) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/chat/health')) {
        if (!ok) {
          throw new Error('offline');
        }
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
