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
import { useEditor } from './EditorState';
import { editorCatalog } from './wrapCatalog';

type ZodLike = {
  _def?: {
    typeName?: string;
    type?: string;
    innerType?: ZodLike;
    shape?: Record<string, ZodLike> | (() => Record<string, ZodLike>);
    options?: ZodLike[];
    values?: string[];
  };
  options?: ZodLike[] | string[];
};

const HIDDEN = new Set([
  'children',
  'child',
  'trigger',
  'content',
  'tabs',
  'checks',
  'accessibility',
]);

function kind(schema: ZodLike): string {
  const def = schema._def;
  const name = def?.typeName ?? def?.type ?? '';
  return name.replace(/^Zod/, '').toLowerCase();
}

function unwrap(schema: ZodLike): ZodLike {
  let current = schema;
  while (['optional', 'default', 'nullable'].includes(kind(current))) {
    current = current._def?.innerType as ZodLike;
  }
  return current;
}

function objectShape(schema: ZodLike): Record<string, ZodLike> | null {
  const inner = unwrap(schema);
  if (kind(inner) !== 'object') {
    return null;
  }
  const raw = inner._def?.shape;
  if (typeof raw === 'function') {
    return raw();
  }
  return raw ?? null;
}

function unionOptions(schema: ZodLike): ZodLike[] {
  return (schema._def?.options ?? schema.options ?? []) as ZodLike[];
}

function isPathObject(value: unknown): value is { path: string } {
  return Boolean(
    value && typeof value === 'object' && 'path' in value && !('call' in value),
  );
}

function isDynamicUnion(schema: ZodLike): boolean {
  const inner = unwrap(schema);
  if (kind(inner) !== 'union') {
    return false;
  }
  return unionOptions(inner).some((option) => {
    const shape = objectShape(option);
    return Boolean(shape && 'path' in shape);
  });
}

function enumValues(schema: ZodLike): string[] | null {
  const inner = unwrap(schema);
  if (kind(inner) !== 'enum') {
    return null;
  }
  const values = inner._def?.values ?? inner.options;
  return Array.isArray(values) &&
    values.every((item) => typeof item === 'string')
    ? values
    : null;
}

function unionHasKind(schema: ZodLike, target: string): boolean {
  return (
    kind(schema) === 'union' &&
    unionOptions(schema).some((option) => kind(unwrap(option)) === target)
  );
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
    return objectShape(impl.schema as ZodLike);
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
                  ) : unionHasKind(inner, 'number') ? (
                    <InputNumber
                      style={{ marginTop: 8, width: '100%' }}
                      value={
                        typeof value === 'number'
                          ? value
                          : Number(literalValue) || 0
                      }
                      onChange={(next) => setField(key, next ?? 0)}
                    />
                  ) : unionHasKind(inner, 'boolean') ? (
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

            if (kind(inner) === 'number') {
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

            if (kind(inner) === 'boolean') {
              return (
                <Form.Item key={key} label={key}>
                  <Switch
                    checked={Boolean(value)}
                    onChange={(checked) => setField(key, checked)}
                  />
                </Form.Item>
              );
            }

            if (kind(inner) === 'string') {
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
