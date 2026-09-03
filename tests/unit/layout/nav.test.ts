import { NAV_HANDLES, NAV_ITEMS, isNavHandle } from '@src/layout/nav';
import { describe, expect, it } from 'vitest';

describe('nav', () => {
  it('lists four rooms in rail order', () => {
    expect(NAV_ITEMS.map((item) => item.key)).toEqual([
      'create',
      'catalog',
      'examples',
      'settings',
    ]);
    expect(NAV_ITEMS[0]?.path).toBe('/');
  });

  it('gives each room its skip target', () => {
    expect(NAV_HANDLES.create.skip).toEqual({
      href: '#sheet',
      label: '跳到纸页',
    });
    expect(NAV_HANDLES.catalog.skip).toEqual({
      href: '#sheet',
      label: '跳到纸页',
    });
    expect(NAV_HANDLES.settings.skip).toEqual({
      href: '#channel-form',
      label: '跳到表单',
    });
  });

  it('narrows route handles', () => {
    expect(isNavHandle(NAV_HANDLES.examples)).toBe(true);
    expect(isNavHandle({ navKey: 'catalog' })).toBe(false);
    expect(isNavHandle(null)).toBe(false);
  });
});
