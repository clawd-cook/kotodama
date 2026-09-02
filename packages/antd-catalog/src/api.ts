type ZodPassthroughSchema<T> = T & {
  passthrough: () => T;
};

export function antdApi<T extends { name: string; schema: unknown }>(
  api: T,
): T {
  const schema = api.schema as ZodPassthroughSchema<T['schema']>;
  if (typeof schema?.passthrough !== 'function') {
    return api;
  }
  return { ...api, schema: schema.passthrough() };
}
