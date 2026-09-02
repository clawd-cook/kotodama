import { describe, expect, it } from 'vitest';
import { createChatProxy } from '../../server/chat-proxy';

const ENV = {
  OPENAI_BASE_URL: 'https://env.example',
  OPENAI_API_KEY: 'env-key',
  OPENAI_MODEL: 'env-model',
};

const CHANNEL_UNREADY =
  '通道没配好。去设置里填 Base URL、API Key 和模型名。';

function postCompletions(body: unknown) {
  const listeners: Record<string, Array<(chunk?: Uint8Array) => void>> = {
    data: [],
    end: [],
    error: [],
  };
  const req = {
    method: 'POST',
    url: '/api/chat/completions',
    headers: {},
    on(event: string, listener: (...args: never[]) => void) {
      listeners[event]?.push(listener as (chunk?: Uint8Array) => void);
    },
  };
  queueMicrotask(() => {
    const encoded = new TextEncoder().encode(JSON.stringify(body));
    for (const listener of listeners.data) {
      listener(encoded);
    }
    for (const listener of listeners.end) {
      listener();
    }
  });
  return req;
}

function invoke(
  handle: ReturnType<typeof createChatProxy>,
  req: object,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve) => {
    const res = {
      statusCode: 0,
      setHeader() {},
      end(chunk?: string) {
        resolve({ status: res.statusCode, body: chunk ?? '' });
      },
    };
    handle(req, res, () => {
      resolve({ status: res.statusCode, body: '' });
    });
  });
}

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
    expect(upstream).not.toHaveProperty('kotodamaChannel');
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
    const result = await invoke(handle, {
      method: 'GET',
      url: '/api/chat/health',
      on() {},
    });
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
});
