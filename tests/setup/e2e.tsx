import { vi } from 'vitest';
import './dom';

vi.mock('@monaco-editor/react', () => ({
  default: ({
    value,
    onChange,
  }: {
    value?: string;
    onChange?: (value?: string) => void;
  }) => (
    <textarea
      aria-label="源码编辑器"
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));
