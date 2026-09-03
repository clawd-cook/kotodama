const SHEET_SKIP = { href: '#sheet', label: '跳到纸页' } as const;
const FORM_SKIP = { href: '#channel-form', label: '跳到表单' } as const;

export const ROOMS = [
  {
    key: 'create',
    path: '/',
    label: '开始创建',
    skip: SHEET_SKIP,
    keepAlive: true,
  },
  {
    key: 'catalog',
    path: '/catalog',
    label: '基础组件',
    skip: SHEET_SKIP,
  },
  {
    key: 'examples',
    path: '/examples',
    label: '精选案例',
    skip: SHEET_SKIP,
  },
  {
    key: 'settings',
    path: '/settings',
    label: '设置',
    skip: FORM_SKIP,
  },
] as const;

export type Room = (typeof ROOMS)[number];
export type RoutedRoom = Exclude<Room, { keepAlive: true }>;

export function isRoutedRoom(room: Room): room is RoutedRoom {
  return !('keepAlive' in room && room.keepAlive);
}

export function keepAliveRoom(): Room {
  const room = ROOMS.find((entry) => 'keepAlive' in entry && entry.keepAlive);
  if (!room) {
    throw new Error('工作室 needs a keep-alive 工坊');
  }
  return room;
}

export function roomByPath(pathname: string): Room {
  const workshop = keepAliveRoom();
  let match: Room = workshop;
  for (const room of ROOMS) {
    if ('keepAlive' in room && room.keepAlive) {
      continue;
    }
    if (
      (pathname === room.path || pathname.startsWith(`${room.path}/`)) &&
      room.path.length > match.path.length
    ) {
      match = room;
    }
  }
  return match;
}
