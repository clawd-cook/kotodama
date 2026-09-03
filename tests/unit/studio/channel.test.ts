import {
  channelOverride,
  emptyChannel,
  loadChannel,
  resolveChannel,
  saveChannel,
} from '@src/studio/channel';
import { afterEach, describe, expect, it } from 'vitest';

const ENV = {
  baseUrl: 'https://env.example',
  apiKey: 'env-key',
  model: 'env-model',
};

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const memory = new MemoryStorage();

afterEach(() => {
  memory.clear();
});

describe('H channel resolve', () => {
  it('H-01 empty ui uses env and is ready', () => {
    expect(resolveChannel({ baseUrl: '', apiKey: '', model: '' }, ENV)).toEqual({
      baseUrl: 'https://env.example',
      apiKey: 'env-key',
      model: 'env-model',
      ready: true,
    });
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

  it('trims ui fields before picking env', () => {
    expect(
      resolveChannel({ baseUrl: '  ', apiKey: '  k  ', model: '' }, ENV),
    ).toMatchObject({
      baseUrl: 'https://env.example',
      apiKey: 'k',
      model: 'env-model',
      ready: true,
    });
  });
});

describe('channel persistence', () => {
  it('saves, loads, and clears the channel', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memory,
    });
    expect(loadChannel()).toEqual(emptyChannel());
    expect(
      saveChannel({
        baseUrl: ' https://ui.example ',
        apiKey: ' k ',
        model: ' m ',
      }),
    ).toBe('saved');
    expect(loadChannel()).toEqual({
      baseUrl: 'https://ui.example',
      apiKey: 'k',
      model: 'm',
    });
    expect(saveChannel(emptyChannel())).toBe('cleared');
    expect(loadChannel()).toEqual(emptyChannel());
  });

  it('returns only filled overrides', () => {
    expect(channelOverride(emptyChannel())).toBeUndefined();
    expect(channelOverride({ baseUrl: 'https://x', apiKey: '', model: '' })).toEqual(
      { baseUrl: 'https://x' },
    );
  });

  it('ignores junk stored under the channel key', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memory,
    });
    memory.setItem('kotodama.channel:v1', '{');
    expect(loadChannel()).toEqual(emptyChannel());
    memory.setItem(
      'kotodama.channel:v1',
      JSON.stringify({ baseUrl: 1, apiKey: 2, model: 3 }),
    );
    expect(loadChannel()).toEqual(emptyChannel());
  });
});
