export type ChannelFields = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export type ResolvedChannel = ChannelFields & { ready: boolean };

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
