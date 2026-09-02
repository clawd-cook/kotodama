import {
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Space,
  Switch,
  Typography,
} from 'antd';
import { useMemo } from 'react';
import { z } from 'zod';
import { useEditor } from './EditorState';
import { editorCatalog } from './wrapCatalog';

const HIDDEN = new Set([
  'children',
  'child',
  'trigger',
  'content',
  'tabs',
  'checks',
  'accessibility',
]);

function unwrap(schema: z.ZodTypeAny): z.ZodTypeAny {
  let current = schema;
  while (
    current instanceof z.ZodOptional ||
    current instanceof z.ZodDefault ||
    current instanceof z.ZodNullable
  ) {
    current = current._def.innerType as z.ZodTypeAny;
  }
  return current;
}

function isPathObject(value: unknown): value is { path: string } {
  return Boolean(
    value && typeof value === 'object' && 'path' in value && !('call' in value),
  );
}

function isDynamicUnion(schema: z.ZodTypeAny): boolean {
  const inner = unwrap(schema);
  if (!(inner instanceof z.ZodUnion)) {
    return false;
  }
  return inner.options.some((option: z.ZodTypeAny) => {
    const unwrapped = unwrap(option);
    return unwrapped instanceof z.ZodObject && 'path' in unwrapped.shape;
  });
}

function enumValues(schema: z.ZodTypeAny): string[] | null {
  const inner = unwrap(schema);
  if (inner instanceof z.ZodEnum) {
    return inner.options as string[];
  }
  return null;
}

export function Inspector() {
  const { snapshot, selectedId, updateSelectedProps } = useEditor();
  const component = snapshot.components.find((item) => item.id === selectedId);
  const impl = component
    ? editorCatalog.components.get(component.component)
    : undefined;
  const shape = useMemo(() => {
    if (!impl) {
      return null;
    }
    const inner = unwrap(impl.schema);
    if (inner instanceof z.ZodObject) {
      return inner.shape as Record<string, z.ZodTypeAny>;
    }
    return null;
  }, [impl]);

  if (!component) {
    return <Empty description="选中预览或树中的组件" />;
  }
  if (!shape) {
    return <Empty description="没有 schema" />;
  }

  const { id, component: type, ...props } = component;

  const setField = (key: string, value: unknown) => {
    updateSelectedProps({ ...props, [key]: value });
  };

  return (
    <div className="inspector">
      <Typography.Text type="secondary">
        {type} · {id}
      </Typography.Text>
      <Form layout="vertical" size="small" style={{ marginTop: 12 }}>
        {Object.entries(shape)
          .filter(([key]) => !HIDDEN.has(key))
          .map(([key, fieldSchema]) => {
            const value = props[key];
            const enums = enumValues(fieldSchema);
            const inner = unwrap(fieldSchema);

            if (isDynamicUnion(fieldSchema)) {
              const mode = isPathObject(value) ? 'path' : 'literal';
              const literalValue =
                typeof value === 'string' ||
                typeof value === 'number' ||
                typeof value === 'boolean'
                  ? String(value)
                  : '';
              const pathValue = isPathObject(value) ? value.path : '';
              return (
                <Form.Item key={key} label={key}>
                  <Radio.Group
                    size="small"
                    value={mode}
                    onChange={(event) => {
                      if (event.target.value === 'path') {
                        setField(key, { path: pathValue || `/${key}` });
                      } else {
                        setField(key, literalValue);
                      }
                    }}
                    options={[
                      { label: '字面量', value: 'literal' },
                      { label: '绑定', value: 'path' },
                    ]}
                    optionType="button"
                  />
                  {mode === 'path' ? (
                    <Input
                      style={{ marginTop: 8 }}
                      value={pathValue}
                      placeholder="/title"
                      onChange={(event) =>
                        setField(key, { path: event.target.value })
                      }
                    />
                  ) : inner instanceof z.ZodUnion &&
                    inner.options.some(
                      (option: z.ZodTypeAny) =>
                        unwrap(option) instanceof z.ZodNumber,
                    ) ? (
                    <InputNumber
                      style={{ marginTop: 8, width: '100%' }}
                      value={
                        typeof value === 'number'
                          ? value
                          : Number(literalValue) || 0
                      }
                      onChange={(next) => setField(key, next ?? 0)}
                    />
                  ) : inner instanceof z.ZodUnion &&
                    inner.options.some(
                      (option: z.ZodTypeAny) =>
                        unwrap(option) instanceof z.ZodBoolean,
                    ) ? (
                    <div style={{ marginTop: 8 }}>
                      <Switch
                        checked={Boolean(value)}
                        onChange={(checked) => setField(key, checked)}
                      />
                    </div>
                  ) : (
                    <Input
                      style={{ marginTop: 8 }}
                      value={literalValue}
                      onChange={(event) => setField(key, event.target.value)}
                    />
                  )}
                </Form.Item>
              );
            }

            if (enums) {
              return (
                <Form.Item key={key} label={key}>
                  <Select
                    allowClear
                    value={typeof value === 'string' ? value : undefined}
                    options={enums.map((item) => ({
                      label: item,
                      value: item,
                    }))}
                    onChange={(next) => setField(key, next)}
                  />
                </Form.Item>
              );
            }

            if (inner instanceof z.ZodNumber) {
              return (
                <Form.Item key={key} label={key}>
                  <InputNumber
                    style={{ width: '100%' }}
                    value={typeof value === 'number' ? value : undefined}
                    onChange={(next) => setField(key, next ?? undefined)}
                  />
                </Form.Item>
              );
            }

            if (inner instanceof z.ZodBoolean) {
              return (
                <Form.Item key={key} label={key}>
                  <Switch
                    checked={Boolean(value)}
                    onChange={(checked) => setField(key, checked)}
                  />
                </Form.Item>
              );
            }

            if (inner instanceof z.ZodString) {
              return (
                <Form.Item key={key} label={key}>
                  <Input
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => setField(key, event.target.value)}
                  />
                </Form.Item>
              );
            }

            return (
              <Form.Item key={key} label={key}>
                <Input.TextArea
                  rows={3}
                  value={JSON.stringify(value ?? '', null, 2)}
                  onChange={(event) => {
                    try {
                      setField(key, JSON.parse(event.target.value));
                    } catch {
                      /* keep typing */
                    }
                  }}
                />
              </Form.Item>
            );
          })}
      </Form>
      <Space>
        <Button
          size="small"
          disabled={selectedId === 'root'}
          danger
          type="link"
        >
          子节点请在树或面板中编辑
        </Button>
      </Space>
    </div>
  );
}
