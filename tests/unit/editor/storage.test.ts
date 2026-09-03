// @vitest-environment happy-dom

import { applyDocument } from '@src/editor/applyDocument';
import login from '@src/editor/fixtures/login.json';
import {
  DEFAULT_CHROME,
  emptySnapshot,
  loadChromeLayout,
  loadDraft,
  loadTheme,
  parseDraft,
  saveChromeLayout,
  saveDraft,
  saveTheme,
  SOURCE_MAX,
  SPEECH_MIN,
} from '@src/editor/storage';
import { afterEach, describe, expect, it } from 'vitest';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length() {
    return this.store.size;
  }
  clear() {
    this.store.clear();
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
}

const memory = new MemoryStorage();

afterEach(() => {
  memory.clear();
});

describe('storage', () => {
  it('round-trips a valid draft through localStorage', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memory,
    });
    const applied = applyDocument(JSON.stringify(login), emptySnapshot());
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      return;
    }
    saveDraft(applied.snapshot);
    expect(loadDraft().dataModel).toEqual(applied.snapshot.dataModel);
  });

  it('loads an empty draft when storage is missing', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memory,
    });
    expect(loadDraft()).toEqual(emptySnapshot());
  });

  it('saves and loads theme', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memory,
    });
    saveTheme('dark');
    expect(loadTheme()).toBe('dark');
    saveTheme('light');
    expect(loadTheme()).toBe('light');
  });

  it('falls back to matchMedia when theme is unset', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memory,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: () => ({ matches: true }),
    });
    expect(loadTheme()).toBe('dark');
  });

  it('clamps chrome layout numbers and ignores junk', () => {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: memory,
    });
    saveChromeLayout({
      speech: 10,
      source: 9999,
      sourceOpen: false,
      traceOpen: true,
      traceSize: 200,
    });
    const loaded = loadChromeLayout();
    expect(loaded.speech).toBe(SPEECH_MIN);
    expect(loaded.source).toBe(SOURCE_MAX);
    expect(loaded.sourceOpen).toBe(false);
    expect(loaded.traceOpen).toBe(true);

    memory.setItem('kotodama.chrome', '{');
    expect(loadChromeLayout()).toEqual(DEFAULT_CHROME);
  });

  it('parseDraft rejects invalid JSON', () => {
    expect(parseDraft('not-json').components).toHaveLength(0);
  });
});
