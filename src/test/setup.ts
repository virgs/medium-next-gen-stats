import '@testing-library/jest-dom/vitest';

const chromeMock = {
  runtime: {
    getManifest: () => ({ version: '1.0.0' }),
    lastError: null,
    connect: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn((_keys: string[], callback: (result: Record<string, unknown>) => void) => {
        callback({});
      }),
      set: vi.fn((_items: Record<string, unknown>, callback?: () => void) => {
        callback?.();
      }),
      remove: vi.fn(),
    },
  },
};

Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  writable: true,
});

