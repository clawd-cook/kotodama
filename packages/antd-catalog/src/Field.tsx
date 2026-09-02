import { Form } from 'antd';
import type { ReactNode } from 'react';
import { weightStyle } from './style';

export function Field({
  label,
  error,
  weight,
  children,
}: {
  label?: ReactNode;
  error?: string;
  weight?: number;
  children: ReactNode;
}) {
  return (
    <Form.Item
      layout="vertical"
      label={label || undefined}
      validateStatus={error ? 'error' : undefined}
      help={error}
      style={{ ...weightStyle(weight), marginBottom: 0, minWidth: 0 }}
    >
      {children}
    </Form.Item>
  );
}
