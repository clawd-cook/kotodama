import { configure } from '@testing-library/react';
import { message, Modal } from 'antd';
import { afterEach, vi } from 'vitest';
import './dom';

configure({ asyncUtilTimeout: 3_000 });

afterEach(() => {
  Modal.destroyAll();
  message.destroy();
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
