import { createDemoSnapshot } from './demo';
import { foldMessages } from './snapshot';
import type { Snapshot } from './types';

const DRAFT_KEY = 'kotodama.draft';
const THEME_KEY = 'kotodama.theme';
const CHROME_KEY = 'kotodama.chrome';

const SPEECH_MIN = 240;
const SPEECH_MAX = 360;
const DOCK_MIN = 160;
const DOCK_MAX = 480;

export type ChromeLayout = {
  speech: number;
  dockOpen: boolean;
  dockSize: number;
};

export const DEFAULT_CHROME: ChromeLayout = {
  speech: 280,
  dockOpen: false,
  dockSize: 240,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

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

export function loadChromeLayout(): ChromeLayout {
  try {
    const raw = localStorage.getItem(CHROME_KEY);
    if (!raw) {
      return { ...DEFAULT_CHROME };
    }
    const parsed = JSON.parse(raw) as Partial<ChromeLayout>;
    return {
      speech: clamp(
        Number(parsed.speech) || DEFAULT_CHROME.speech,
        SPEECH_MIN,
        SPEECH_MAX,
      ),
      dockOpen: Boolean(parsed.dockOpen),
      dockSize: clamp(
        Number(parsed.dockSize) || DEFAULT_CHROME.dockSize,
        DOCK_MIN,
        DOCK_MAX,
      ),
    };
  } catch {
    return { ...DEFAULT_CHROME };
  }
}

export function saveChromeLayout(layout: ChromeLayout) {
  localStorage.setItem(CHROME_KEY, JSON.stringify(layout));
}
