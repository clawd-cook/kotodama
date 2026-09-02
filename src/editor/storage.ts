import { createDemoSnapshot } from './demo';
import { foldMessages } from './snapshot';
import type { Snapshot } from './types';

const DRAFT_KEY = 'kotodama.draft';
const THEME_KEY = 'kotodama.theme';
const LAYOUT_KEY = 'kotodama.layout';

export function loadDraft(): Snapshot {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) {
      return createDemoSnapshot();
    }
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === 'object' && 'components' in parsed) {
      return parsed as Snapshot;
    }
    return foldMessages(parsed);
  } catch {
    return createDemoSnapshot();
  }
}

export function saveDraft(snapshot: Snapshot) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(snapshot));
}

export function loadTheme(): 'light' | 'dark' {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

export function saveTheme(theme: 'light' | 'dark') {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadLayout(): number[] | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? (JSON.parse(raw) as number[]) : null;
  } catch {
    return null;
  }
}

export function saveLayout(sizes: number[]) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(sizes));
}
