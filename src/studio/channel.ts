export type ChannelFields = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ResolvedChannel = ChannelFields & { ready: boolean };

export const CHANNEL_STORAGE_KEY = 'kotodama.channel:v1';

export function emptyChannel(): ChannelFields {
  return { baseUrl: '', apiKey: '', model: '' };
}

function pick(ui: string, env: string): string {
  const trimmed = ui.trim();
  return trimmed === '' ? env : trimmed;
}

export function resolveChannel(
  ui: ChannelFields,
  env: ChannelFields,
): ResolvedChannel {
  const baseUrl = pick(ui.baseUrl, env.baseUrl);
  const apiKey = pick(ui.apiKey, env.apiKey);
  const model = pick(ui.model, env.model);
  return {
    baseUrl,
    apiKey,
    model,
    ready: Boolean(baseUrl && apiKey && model),
  };
}

export function loadChannel(): ChannelFields {
  try {
    const raw = localStorage.getItem(CHANNEL_STORAGE_KEY);
    if (!raw) {
      return emptyChannel();
    }
    const parsed = JSON.parse(raw) as Partial<ChannelFields>;
    return {
      baseUrl: typeof parsed.baseUrl === 'string' ? parsed.baseUrl : '',
      apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
      model: typeof parsed.model === 'string' ? parsed.model : '',
    };
  } catch {
    return emptyChannel();
  }
}

export function saveChannel(ui: ChannelFields): 'saved' | 'cleared' {
  const next = {
    baseUrl: ui.baseUrl.trim(),
    apiKey: ui.apiKey.trim(),
    model: ui.model.trim(),
  };
  if (!next.baseUrl && !next.apiKey && !next.model) {
    localStorage.removeItem(CHANNEL_STORAGE_KEY);
    return 'cleared';
  }
  localStorage.setItem(CHANNEL_STORAGE_KEY, JSON.stringify(next));
  return 'saved';
}

export function channelOverride(
  ui: ChannelFields,
): Partial<ChannelFields> | undefined {
  const next: Partial<ChannelFields> = {};
  const baseUrl = ui.baseUrl.trim();
  const apiKey = ui.apiKey.trim();
  const model = ui.model.trim();
  if (baseUrl) {
    next.baseUrl = baseUrl;
  }
  if (apiKey) {
    next.apiKey = apiKey;
  }
  if (model) {
    next.model = model;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}
