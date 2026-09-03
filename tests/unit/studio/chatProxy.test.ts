import { createChatProxy } from '@server/chat-proxy';
import { describe, expect, it } from 'vitest';
import { getHealth, invoke, postCompletions } from '../../helpers/chat-proxy';

const ENV = {
  OPENAI_BASE_URL: 'https://env.example',
  OPENAI_API_KEY: 'env-key',
  OPENAI_MODEL: 'env-model',
};

const CHANNEL_UNREADY = '通道没配好。去设置里填 Base URL、API Key 和模型名。';

describe('X chat proxy', () => {
  it('X-01 proxy fetches upstream with the resolved channel', async () => {
    const fetches: { url: string; init?: RequestInit }[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      fetches.push({ url: String(url), init });
      return new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    };
    const handle = createChatProxy(ENV, fetchImpl);
    const req = postCompletions({
      model: 'ignored',
      messages: [],
      kotodamaChannel: {
        baseUrl: 'https://ui.example',
        apiKey: 'ui-key',
        model: 'ui-model',
      },
    });
    await invoke(handle, req);
    expect(fetches).toHaveLength(1);
    expect(fetches[0]?.url).toBe('https://ui.example/v1/chat/completions');
    const headers = new Headers(fetches[0]?.init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer ui-key');
    const upstream = JSON.parse(String(fetches[0]?.init?.body));
    expect(upstream.model).toBe('ui-model');
    expect(upstream.stream).toBe(true);
    expect(upstream).not.toHaveProperty('kotodamaChannel');
  });

  it('strips a trailing slash from the base URL', async () => {
    const fetches: { url: string }[] = [];
    const handle = createChatProxy(ENV, async (url) => {
      fetches.push({ url: String(url) });
      return new Response('{}');
    });
    await invoke(
      handle,
      postCompletions({
        kotodamaChannel: {
          baseUrl: 'https://ui.example/',
          apiKey: 'ui-key',
          model: 'ui-model',
        },
      }),
    );
    expect(fetches[0]?.url).toBe('https://ui.example/v1/chat/completions');
  });

  it('X-02 unready channel is 503 and does not fetch', async () => {
    const fetches: unknown[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
      fetches.push({ url, init });
      return new Response('{}');
    };
    const handle = createChatProxy(
      { OPENAI_BASE_URL: '', OPENAI_API_KEY: '', OPENAI_MODEL: '' },
      fetchImpl,
    );
    const result = await invoke(handle, postCompletions({ messages: [] }));
    expect(result.status).toBe(503);
    expect(JSON.parse(result.body)).toEqual({
      error: { message: CHANNEL_UNREADY },
    });
    expect(fetches).toHaveLength(0);
  });

  it('X-03 health never echoes the key', async () => {
    const handle = createChatProxy(
      {
        OPENAI_BASE_URL: 'https://env.example',
        OPENAI_API_KEY: 'secret-key',
        OPENAI_MODEL: 'env-model',
      },
      async () => new Response('{}'),
    );
    const result = await invoke(handle, getHealth());
    const json = JSON.parse(result.body) as {
      ok?: boolean;
      apiKey?: unknown;
      env?: { hasApiKey?: boolean; apiKey?: unknown };
    };
    expect(json.ok).toBe(true);
    expect(json.env?.hasApiKey).toBe(true);
    expect(json).not.toHaveProperty('apiKey');
    expect(json.env).not.toHaveProperty('apiKey');
    expect(result.body).not.toContain('secret-key');
  });

  it('returns 400 for invalid JSON bodies', async () => {
    const listeners: Record<string, Array<(chunk?: Uint8Array) => void>> = {
      data: [],
      end: [],
      error: [],
    };
    const req = {
      method: 'POST',
      url: '/api/chat/completions',
      on(event: string, listener: (...args: never[]) => void) {
        listeners[event]?.push(listener as (chunk?: Uint8Array) => void);
      },
    };
    queueMicrotask(() => {
      const encoded = new TextEncoder().encode('{');
      for (const listener of listeners.data) {
        listener(encoded);
      }
      for (const listener of listeners.end) {
        listener();
      }
    });
    const result = await invoke(createChatProxy(ENV, async () => new Response('{}')), req);
    expect(result.status).toBe(400);
    expect(JSON.parse(result.body).error.message).toBeTruthy();
  });

  it('passes unrelated requests to next', async () => {
    let called = false;
    const handle = createChatProxy(ENV, async () => new Response('{}'));
    handle(
      { method: 'GET', url: '/other', on() {} },
      { statusCode: 0, setHeader() {}, end() {} },
      () => {
        called = true;
      },
    );
    expect(called).toBe(true);
  });

  it('reads originalUrl, string chunks, and empty bodies', async () => {
    const fetches: { url: string; body: string }[] = [];
    const handle = createChatProxy(ENV, async (url, init) => {
      fetches.push({ url: String(url), body: String(init?.body) });
      return new Response('{}', { status: 201 });
    });
    const listeners: Record<string, Array<(chunk?: Uint8Array | string) => void>> = {
      data: [],
      end: [],
      error: [],
    };
    const req = {
      method: 'POST',
      originalUrl: '/api/chat/completions?x=1',
      on(event: string, listener: (...args: never[]) => void) {
        listeners[event]?.push(listener as (chunk?: Uint8Array | string) => void);
      },
    };
    queueMicrotask(() => {
      for (const listener of listeners.data) {
        listener('');
      }
      for (const listener of listeners.end) {
        listener();
      }
    });
    const result = await invoke(handle, req);
    expect(result.status).toBe(201);
    expect(JSON.parse(fetches[0]?.body ?? '{}').stream).toBe(true);
  });

  it('forwards stream false and defaults missing channel fields', async () => {
    const fetches: { init?: RequestInit }[] = [];
    const handle = createChatProxy(ENV, async (url, init) => {
      fetches.push({ init });
      return {
        status: 200,
        headers: { get: () => null },
        text: async () => 'ok',
      } as unknown as Response;
    });
    const result = await invoke(
      handle,
      postCompletions({
        stream: false,
        kotodamaChannel: 'nope',
      }),
    );
    expect(result.status).toBe(200);
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(String(fetches[0]?.init?.body)).stream).toBe(false);
  });

  it('uses env fields when the body channel is partial', async () => {
    const fetches: { url: string }[] = [];
    const handle = createChatProxy(ENV, async (url) => {
      fetches.push({ url: String(url) });
      return new Response('{}', {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    });
    const result = await invoke(
      handle,
      postCompletions({
        kotodamaChannel: { baseUrl: 1, apiKey: 2, model: 3 },
      }),
    );
    expect(fetches[0]?.url).toBe('https://env.example/v1/chat/completions');
    expect(result.headers['Content-Type']).toBe('text/event-stream');
  });

  it('returns 400 when the request stream errors', async () => {
    const listeners: Record<string, Array<(chunk?: unknown) => void>> = {
      data: [],
      end: [],
      error: [],
    };
    const req = {
      method: 'POST',
      url: '/api/chat/completions',
      on(event: string, listener: (...args: never[]) => void) {
        listeners[event]?.push(listener as (chunk?: unknown) => void);
      },
    };
    queueMicrotask(() => {
      for (const listener of listeners.error) {
        listener(new Error('boom'));
      }
    });
    const result = await invoke(createChatProxy(ENV, async () => new Response('{}')), req);
    expect(result.status).toBe(400);
    expect(JSON.parse(result.body).error.message).toBe('boom');
  });

  it('health reports missing env keys', async () => {
    const result = await invoke(
      createChatProxy({}, async () => new Response('{}')),
      getHealth(),
    );
    expect(JSON.parse(result.body)).toEqual({
      ok: true,
      env: { baseUrl: '', model: '', hasApiKey: false },
    });
  });
});
