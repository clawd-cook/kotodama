import { describe, expect, it } from 'vitest';
import { resolveChannel } from './channel';

const ENV = {
  baseUrl: 'https://env.example',
  apiKey: 'env-key',
  model: 'env-model',
};

describe('H channel resolve', () => {
  it('H-01 empty ui uses env and is ready', () => {
    expect(
      resolveChannel({ baseUrl: '', apiKey: '', model: '' }, ENV),
    ).toEqual({
      baseUrl: 'https://env.example',
      apiKey: 'env-key',
      model: 'env-model',
      ready: true,
    });
  });
});
