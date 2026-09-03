import { createRoom, ROOMS, roomByPath } from '@src/studio/rooms';
import { describe, expect, it } from 'vitest';

describe('roomByPath', () => {
  it('returns 开始创建 for / and unknown paths', () => {
    const workshop = createRoom();
    expect(workshop.path).toBe('/');
    expect(roomByPath('/')).toBe(workshop);
    expect(roomByPath('/nope')).toBe(workshop);
    expect(roomByPath('/cataloguing')).toBe(workshop);
  });

  it('matches 图鉴, 精选案例, and 设置 by path prefix', () => {
    expect(roomByPath('/catalog').key).toBe('catalog');
    expect(roomByPath('/catalog/Button').key).toBe('catalog');
    expect(roomByPath('/examples').key).toBe('examples');
    expect(roomByPath('/examples/login').key).toBe('examples');
    expect(roomByPath('/settings').key).toBe('settings');
    expect(roomByPath('/settings/').key).toBe('settings');
  });

  it('gives each 房间 its skip target', () => {
    expect(roomByPath('/').skip).toEqual({
      href: '#sheet',
      label: '跳到纸页',
    });
    expect(roomByPath('/catalog/Column').skip).toEqual({
      href: '#sheet',
      label: '跳到纸页',
    });
    expect(roomByPath('/settings').skip).toEqual({
      href: '#channel-form',
      label: '跳到表单',
    });
  });

  it('lists four 房间', () => {
    expect(ROOMS.map((room) => room.key)).toEqual([
      'create',
      'catalog',
      'examples',
      'settings',
    ]);
    expect(createRoom().key).toBe('create');
  });
});
