import { afterEach, beforeEach, vi } from 'vitest';

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

const local = new MemoryStorage();
const session = new MemoryStorage();

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: local,
});
Object.defineProperty(globalThis, 'sessionStorage', {
  configurable: true,
  value: session,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent() {
      return false;
    },
  }),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  writable: true,
  value: ResizeObserverStub,
});

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: vi.fn(async () => undefined),
  },
});

Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  configurable: true,
  writable: true,
  value: true,
});

const VIEW = { width: 1440, height: 900 };

function stubBox(box: { width: number; height: number }): DOMRect {
  return {
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: box.width,
    bottom: box.height,
    width: box.width,
    height: box.height,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

for (const key of ['offsetWidth', 'clientWidth'] as const) {
  Object.defineProperty(HTMLElement.prototype, key, {
    configurable: true,
    get() {
      return VIEW.width;
    },
  });
}

for (const key of ['offsetHeight', 'clientHeight'] as const) {
  Object.defineProperty(HTMLElement.prototype, key, {
    configurable: true,
    get() {
      return VIEW.height;
    },
  });
}

HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
  return stubBox(VIEW);
};

beforeEach(() => {
  local.clear();
  session.clear();
});

afterEach(() => {
  local.clear();
  session.clear();
});
