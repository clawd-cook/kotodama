import { useMatches } from 'react-router';

const SHEET_SKIP = { href: '#sheet', label: '跳到纸页' } as const;
const FORM_SKIP = { href: '#channel-form', label: '跳到表单' } as const;

export type NavKey = 'create' | 'catalog' | 'examples' | 'settings';

export type NavHandle = {
  navKey: NavKey;
  skip: { href: string; label: string };
};

export const NAV_HANDLES = {
  create: { navKey: 'create', skip: SHEET_SKIP },
  catalog: { navKey: 'catalog', skip: SHEET_SKIP },
  examples: { navKey: 'examples', skip: SHEET_SKIP },
  settings: { navKey: 'settings', skip: FORM_SKIP },
} as const satisfies Record<NavKey, NavHandle>;

export const NAV_ITEMS = [
  { key: 'create', path: '/', label: '开始创建' },
  { key: 'catalog', path: '/catalog', label: '基础组件' },
  { key: 'examples', path: '/examples', label: '精选案例' },
  { key: 'settings', path: '/settings', label: '设置' },
] as const;

export function isNavHandle(handle: unknown): handle is NavHandle {
  return (
    typeof handle === 'object' &&
    handle !== null &&
    'navKey' in handle &&
    'skip' in handle
  );
}

export function useActiveNav(): NavHandle {
  const matches = useMatches();
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const handle = matches[index]?.handle;
    if (isNavHandle(handle)) {
      return handle;
    }
  }
  return NAV_HANDLES.create;
}
