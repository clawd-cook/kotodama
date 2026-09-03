import { antdApi } from '@catalog/api';
import { antdCatalog, BASIC_CATALOG_ID, catalogComponents } from '@catalog/catalog';
import { mapAlign, mapJustify, weightStyle } from '@catalog/style';
import { ALLOWED_COMPONENTS } from '@src/editor/validate';
import { describe, expect, it } from 'vitest';

describe('antd catalog', () => {
  it('uses the basic catalog id and every allowed component', () => {
    expect(antdCatalog.id).toBe(BASIC_CATALOG_ID);
    expect(catalogComponents.map((item) => item.name).toSorted()).toEqual(
      [...ALLOWED_COMPONENTS].toSorted(),
    );
  });

  it('passthroughs schemas that support it', () => {
    const schema = { passthrough: () => 'open' };
    expect(antdApi({ name: 'Text', schema }).schema).toBe('open');
    const closed = { name: 'Text', schema: {} };
    expect(antdApi(closed)).toBe(closed);
  });
});

describe('style helpers', () => {
  it('maps justify and align tokens', () => {
    expect(mapJustify('end')).toBe('flex-end');
    expect(mapJustify('center')).toBe('center');
    expect(mapJustify('spaceBetween')).toBe('space-between');
    expect(mapJustify('spaceAround')).toBe('space-around');
    expect(mapJustify('spaceEvenly')).toBe('space-evenly');
    expect(mapJustify(undefined)).toBe('flex-start');
    expect(mapAlign('start')).toBe('flex-start');
    expect(mapAlign('center')).toBe('center');
    expect(mapAlign('end')).toBe('flex-end');
    expect(mapAlign(undefined)).toBe('stretch');
  });

  it('only emits flex when weight is set', () => {
    expect(weightStyle()).toEqual({});
    expect(weightStyle(2)).toEqual({ flex: 2 });
  });
});
