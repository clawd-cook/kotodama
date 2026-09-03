import { isRoutedRoom, keepAliveRoom, ROOMS, roomByPath } from '@src/studio/rooms';
import { describe, expect, it } from 'vitest';

describe('roomByPath', () => {
  it('returns the keep-alive 工坊 for / and unknown paths', () => {
    const workshop = keepAliveRoom();
    expect(workshop.path).toBe('/');
    expect(workshop.keepAlive).toBe(true);
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

  it('lists four 房间 and one keep-alive 工坊', () => {
    expect(ROOMS.map((room) => room.key)).toEqual([
      'create',
      'catalog',
      'examples',
      'settings',
    ]);
    expect(ROOMS.filter(isRoutedRoom)).toHaveLength(3);
    expect(isRoutedRoom(keepAliveRoom())).toBe(false);
  });
});
