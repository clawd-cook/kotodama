import { configure } from '@testing-library/react';
import { message, Modal } from 'antd';
import { afterEach, vi } from 'vitest';
import './dom';

configure({ asyncUtilTimeout: 3_000 });

const ignoreLog = /\[antd|\[antdx|not wrapped in act|Notification API/;
for (const method of ['warn', 'error'] as const) {
  const original = console[method].bind(console);
  console[method] = ((...args: unknown[]) => {
    if (ignoreLog.test(String(args[0] ?? ''))) {
      return;
    }
    original(...args);
  }) as typeof console.warn;
}

afterEach(() => {
  Modal.destroyAll();
  message.destroy();
  for (const node of document.querySelectorAll('.ant-modal-root, .ant-message')) {
    node.remove();
  }
});

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (value?: string) => void;
  }) => (
    <>
      <textarea
        aria-label="源码编辑器"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
      <button
        type="button"
        aria-label="源码编辑器置空"
        onClick={() => onChange?.(undefined)}
      />
    </>
  ),
}));
