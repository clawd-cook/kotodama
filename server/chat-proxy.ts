import {
  resolveChannel,
  type ChannelFields,
} from '../src/studio/channel';

type NodeReq = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  on(event: string, listener: (...args: never[]) => void): void;
};

type NodeRes = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string): void;
};

function pathnameOf(req: object): string {
  const raw = String(
    (req as { url?: string }).url ??
      (req as { originalUrl?: string }).originalUrl ??
      '',
  );
  return raw.split('?')[0];
}

function readBody(req: NodeReq): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on(
      'data',
      ((chunk: Uint8Array | string) => {
        chunks.push(
          typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk,
        );
      }) as (...args: never[]) => void,
    );
    req.on(
      'end',
      (() => {
        const total = chunks.reduce((sum, item) => sum + item.byteLength, 0);
        const merged = new Uint8Array(total);
        let offset = 0;
        for (const item of chunks) {
          merged.set(item, offset);
          offset += item.byteLength;
        }
        resolve(merged);
      }) as (...args: never[]) => void,
    );
    req.on('error', reject as (...args: never[]) => void);
  });
}

function envFields(env: Record<string, string>): ChannelFields {
  return {
    baseUrl: env.OPENAI_BASE_URL ?? '',
    apiKey: env.OPENAI_API_KEY ?? '',
    model: env.OPENAI_MODEL ?? '',
  };
}

function channelFromBody(value: unknown): ChannelFields {
  if (!value || typeof value !== 'object') {
    return { baseUrl: '', apiKey: '', model: '' };
  }
  const record = value as Record<string, unknown>;
  return {
    baseUrl: typeof record.baseUrl === 'string' ? record.baseUrl : '',
    apiKey: typeof record.apiKey === 'string' ? record.apiKey : '',
    model: typeof record.model === 'string' ? record.model : '',
  };
}

export function createChatProxy(
  env: Record<string, string>,
  fetchImpl: typeof fetch = fetch,
) {
  const model = env.OPENAI_MODEL ?? '';
  const configured = Boolean(
    env.OPENAI_BASE_URL && env.OPENAI_API_KEY && env.OPENAI_MODEL,
  );

  return (req: object, res: object, next: () => void) => {
    const nodeReq = req as NodeReq;
    const path = pathnameOf(req);
    const method = String(nodeReq.method ?? '').toUpperCase();

    if (method === 'GET' && path === '/api/chat/health') {
      const nodeRes = res as NodeRes;
      nodeRes.statusCode = 200;
      nodeRes.setHeader('Content-Type', 'application/json');
      nodeRes.end(JSON.stringify({ ok: true, configured, model }));
      return;
    }

    if (method !== 'POST' || path !== '/api/chat/completions') {
      next();
      return;
    }

    void (async () => {
      const nodeRes = res as NodeRes;
      try {
        const raw = await readBody(nodeReq);
        const payload = JSON.parse(
          new TextDecoder().decode(raw) || '{}',
        ) as Record<string, unknown>;
        const resolved = resolveChannel(
          channelFromBody(payload.kotodamaChannel),
          envFields(env),
        );
        delete payload.kotodamaChannel;
        payload.model = resolved.model;
        payload.stream = payload.stream !== false;
        const url = `${resolved.baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
        const response = await fetchImpl(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resolved.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        nodeRes.statusCode = response.status;
        nodeRes.setHeader(
          'Content-Type',
          response.headers.get('Content-Type') ?? 'application/json',
        );
        nodeRes.end(await response.text());
      } catch (error) {
        nodeRes.statusCode = 400;
        nodeRes.setHeader('Content-Type', 'application/json');
        const message = error instanceof Error ? error.message : String(error);
        nodeRes.end(JSON.stringify({ error: { message } }));
      }
    })();
  };
}
