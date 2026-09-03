import {
  CATALOG_BLURBS,
  CATALOG_GROUPS,
  CATALOG_PAGES,
  isCatalogName,
} from '@src/pages/catalog/catalogPages';
import { ALLOWED_COMPONENTS } from '@src/editor/validate';
import { describe, expect, it } from 'vitest';

describe('catalogPages', () => {
  it('covers every allowed component once', () => {
    const names = CATALOG_GROUPS.flatMap((group) => group.names);
    expect(names.toSorted()).toEqual([...ALLOWED_COMPONENTS].toSorted());
    expect(Object.keys(CATALOG_PAGES).toSorted()).toEqual(
      [...ALLOWED_COMPONENTS].toSorted(),
    );
    for (const name of ALLOWED_COMPONENTS) {
      expect(CATALOG_BLURBS[name].length).toBeGreaterThan(0);
    }
  });

  it('accepts only catalog names', () => {
    expect(isCatalogName('Button')).toBe(true);
    expect(isCatalogName('Table')).toBe(false);
    expect(isCatalogName('')).toBe(false);
  });
});

describe('catalogPropertyNames', () => {
  it('returns no properties for an unknown component', async () => {
    const { catalogPropertyNames } = await import(
      '@src/pages/catalog/catalogPropertyNames'
    );
    expect(catalogPropertyNames('Nope')).toEqual([]);
  });
});
