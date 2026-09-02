import { describe, expect, it } from 'vitest';
import { createChatProxy } from '../../server/chat-proxy';

const ENV = {
  OPENAI_BASE_URL: 'https://env.example',
  OPENAI_API_KEY: 'env-key',
  OPENAI_MODEL: 'env-model',
};

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
    await new Promise<void>((resolve) => {
      handle(
        req,
        {
          statusCode: 0,
          setHeader() {},
          end() {
            resolve();
          },
        },
        () => {
          resolve();
        },
      );
    });
    expect(fetches).toHaveLength(1);
    expect(fetches[0]?.url).toBe('https://ui.example/v1/chat/completions');
    const headers = new Headers(fetches[0]?.init?.headers);
    expect(headers.get('Authorization')).toBe('Bearer ui-key');
    const upstream = JSON.parse(String(fetches[0]?.init?.body));
    expect(upstream.model).toBe('ui-model');
    expect(upstream).not.toHaveProperty('kotodamaChannel');
  });
});
