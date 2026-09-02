import { describe, expect, it } from 'vitest';
import { resolveChannel } from './channel';

const ENV = {
  baseUrl: 'https://env.example',
  apiKey: 'env-key',
  model: 'env-model',
};

describe('H channel resolve', () => {
  it('H-01 empty ui uses env and is ready', () => {
    expect(resolveChannel({ baseUrl: '', apiKey: '', model: '' }, ENV)).toEqual(
      {
        baseUrl: 'https://env.example',
        apiKey: 'env-key',
        model: 'env-model',
        ready: true,
      },
    );
  });

  it('H-02 ui model overrides env model', () => {
    expect(
      resolveChannel({ baseUrl: '', apiKey: '', model: 'ui-model' }, ENV),
    ).toEqual({
      baseUrl: 'https://env.example',
      apiKey: 'env-key',
      model: 'ui-model',
      ready: true,
    });
  });

  it('H-03 full ui overrides env', () => {
    expect(
      resolveChannel(
        {
          baseUrl: 'https://ui.example',
          apiKey: 'ui-key',
          model: 'ui-model',
        },
        ENV,
      ),
    ).toEqual({
      baseUrl: 'https://ui.example',
      apiKey: 'ui-key',
      model: 'ui-model',
      ready: true,
    });
  });

  it('H-04 missing api key is not ready', () => {
    expect(
      resolveChannel(
        { baseUrl: 'https://ui.example', apiKey: '', model: '' },
        { baseUrl: 'https://env.example', apiKey: '', model: 'env-model' },
      ),
    ).toEqual({
      baseUrl: 'https://ui.example',
      apiKey: '',
      model: 'env-model',
      ready: false,
    });
  });

  it('H-05 empty ui and env is not ready', () => {
    expect(
      resolveChannel(
        { baseUrl: '', apiKey: '', model: '' },
        { baseUrl: '', apiKey: '', model: '' },
      ),
    ).toEqual({
      baseUrl: '',
      apiKey: '',
      model: '',
      ready: false,
    });
  });
});
