import { createChatProxy } from '@server/chat-proxy';

export function postCompletions(body: unknown) {
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

export function invoke(
  handle: ReturnType<typeof createChatProxy>,
  req: object,
): Promise<{ status: number; body: string; headers: Record<string, string> }> {
  return new Promise((resolve) => {
    const headers: Record<string, string> = {};
    const res = {
      statusCode: 0,
      setHeader(name: string, value: string) {
        headers[name] = value;
      },
      end(chunk?: string) {
        resolve({ status: res.statusCode, body: chunk ?? '', headers });
      },
    };
    handle(req, res, () => {
      resolve({ status: res.statusCode, body: '', headers });
    });
  });
}

export function getHealth() {
  return {
    method: 'GET',
    url: '/api/chat/health',
    on() {},
  };
}
