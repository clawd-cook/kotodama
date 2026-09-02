type NodeReq = {
  method?: string;
  url?: string;
  headers?: Record<string, string | string[] | undefined>;
  kotodamaBody?: string;
  on(event: string, listener: (...args: never[]) => void): void;
};

type NodeRes = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(chunk?: string): void;
};

function pathnameOf(req: object): string {
  const raw = String(
    (req as { url?: string }).url ?? (req as { originalUrl?: string }).originalUrl ?? '',
  );
  return raw.split('?')[0];
}

function readBody(req: NodeReq): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    req.on('data', ((chunk: Uint8Array | string) => {
      chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk);
    }) as (...args: never[]) => void);
    req.on('end', (() => {
      const total = chunks.reduce((sum, item) => sum + item.byteLength, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const item of chunks) {
        merged.set(item, offset);
        offset += item.byteLength;
      }
      resolve(merged);
    }) as (...args: never[]) => void);
    req.on('error', reject as (...args: never[]) => void);
  });
}

export function createChatProxy(env: Record<string, string>) {
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
        const payload = JSON.parse(new TextDecoder().decode(raw) || '{}') as Record<
          string,
          unknown
        >;
        if (model) {
          payload.model = model;
        }
        payload.stream = payload.stream !== false;
        nodeReq.kotodamaBody = JSON.stringify(payload);
        next();
      } catch (error) {
        nodeRes.statusCode = 400;
        nodeRes.setHeader('Content-Type', 'application/json');
        const message = error instanceof Error ? error.message : String(error);
        nodeRes.end(JSON.stringify({ error: { message } }));
      }
    })();
  };
}
