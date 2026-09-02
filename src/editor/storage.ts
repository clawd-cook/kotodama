import { foldMessages, SURFACE_ID, toMessages } from './snapshot';
import { BASIC_CATALOG_ID, type Snapshot } from './types';
import { validateSnapshot } from './validate';

export function emptySnapshot(): Snapshot {
  return {
    surfaceId: SURFACE_ID,
    catalogId: BASIC_CATALOG_ID,
    sendDataModel: true,
    components: [],
    dataModel: {},
  };
}

export function isCurrentPage(snapshot: Snapshot): boolean {
  return validateSnapshot(snapshot, toMessages(snapshot)) === null;
}

export function parseDraft(raw: string | null): Snapshot {
  if (!raw) {
    return emptySnapshot();
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    const snapshot =
      parsed && typeof parsed === 'object' && 'components' in parsed
        ? (parsed as Snapshot)
        : foldMessages(parsed);
    if (!isCurrentPage(snapshot)) {
      return emptySnapshot();
    }
    return snapshot;
  } catch {
    return emptySnapshot();
  }
}

const DRAFT_KEY = 'kotodama.draft';
const THEME_KEY = 'kotodama.theme';
const CHROME_KEY = 'kotodama.chrome';

export const SPEECH_MIN = 240;
export const SPEECH_MAX = 320;
export const SOURCE_MIN = 280;
export const SOURCE_MAX = 400;
export const SOURCE_STRIP = 40;
export const TRACE_MIN = 160;
export const TRACE_MAX = 280;
export const TRACE_STRIP = 40;

export type ChromeLayout = {
  speech: number;
  source: number;
  sourceOpen: boolean;
  traceOpen: boolean;
  traceSize: number;
};

export const DEFAULT_CHROME: ChromeLayout = {
  speech: 280,
  source: 320,
  sourceOpen: true,
  traceOpen: false,
  traceSize: 160,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function loadDraft(): Snapshot {
  try {
    return parseDraft(localStorage.getItem(DRAFT_KEY));
  } catch {
    return emptySnapshot();
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
      source: clamp(
        Number(parsed.source) || DEFAULT_CHROME.source,
        SOURCE_MIN,
        SOURCE_MAX,
      ),
      sourceOpen:
        typeof parsed.sourceOpen === 'boolean'
          ? parsed.sourceOpen
          : DEFAULT_CHROME.sourceOpen,
      traceOpen: Boolean(parsed.traceOpen),
      traceSize: clamp(
        Number(parsed.traceSize) || DEFAULT_CHROME.traceSize,
        TRACE_MIN,
        TRACE_MAX,
      ),
    };
  } catch {
    return { ...DEFAULT_CHROME };
  }
}

export function saveChromeLayout(layout: ChromeLayout) {
  localStorage.setItem(CHROME_KEY, JSON.stringify(layout));
}
