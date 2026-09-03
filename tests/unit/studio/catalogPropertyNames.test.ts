import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@a2ui/web_core/v0_9/basic_catalog', () => ({
  BASIC_COMPONENTS: [
    {
      name: 'FnShape',
      schema: {
        _def: {
          shape: () => ({ foo: true, placeholder: true }),
        },
      },
    },
    {
      name: 'Empty',
      schema: {},
    },
  ],
}));

describe('catalogPropertyNames schema shapes', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('invokes a function shape and falls back to an empty object', async () => {
    const { catalogPropertyNames: names } = await import(
      '@src/studio/catalog/catalogPropertyNames'
    );
    expect(names('FnShape')).toEqual(['foo']);
    expect(names('Empty')).toEqual([]);
    expect(names('Missing')).toEqual([]);
  });
});
