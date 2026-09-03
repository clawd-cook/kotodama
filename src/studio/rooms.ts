const SHEET_SKIP = { href: '#sheet', label: '跳到纸页' } as const;
const FORM_SKIP = { href: '#channel-form', label: '跳到表单' } as const;

export const ROOMS = [
  {
    key: 'create',
    path: '/',
    label: '开始创建',
    skip: SHEET_SKIP,
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

export function createRoom(): Room {
  const room = ROOMS.find((entry) => entry.key === 'create');
  if (!room) {
    throw new Error('工作室 needs 开始创建');
  }
  return room;
}

export function roomByPath(pathname: string): Room {
  const workshop = createRoom();
  let match: Room = workshop;
  for (const room of ROOMS) {
    if (room.key === workshop.key) {
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
