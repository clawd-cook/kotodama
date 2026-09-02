import { BASIC_COMPONENTS } from '@a2ui/web_core/v0_9/basic_catalog';
import { BASIC_CATALOG_ID } from './types';
import type { A2uiComponent, A2uiMessage, Snapshot } from './types';

export const ALLOWED_COMPONENTS = [
  'Column',
  'Row',
  'List',
  'Card',
  'Tabs',
  'Modal',
  'Divider',
  'Text',
  'Image',
  'Icon',
  'Video',
  'AudioPlayer',
  'Button',
  'TextField',
  'CheckBox',
  'ChoicePicker',
  'Slider',
  'DateTimeInput',
] as const;

export type ApplyFailure = {
  code: string;
  message: string;
};

type ZodIssueLike = {
  code?: string;
  keys?: string[];
  path?: (string | number)[];
  message?: string;
};

type CatalogSchema = {
  safeParse: (value: unknown) => {
    success: boolean;
    error?: { issues: ZodIssueLike[] };
  };
};

const SCHEMA_BY_NAME = new Map<string, CatalogSchema>(
  (BASIC_COMPONENTS as { name: string; schema: CatalogSchema }[]).map(
    (api) => [api.name, api.schema],
  ),
);

const ALLOWED_SET = new Set<string>(ALLOWED_COMPONENTS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function surfaceIdOf(message: A2uiMessage): string | undefined {
  return (
    message.createSurface?.surfaceId ??
    message.updateComponents?.surfaceId ??
    message.updateDataModel?.surfaceId ??
    message.deleteSurface?.surfaceId
  );
}

function childRefsOf(component: A2uiComponent): {
  inline: boolean;
  ids: string[];
} {
  const ids: string[] = [];
  const { children, child, trigger, content, tabs } = component;

  if (Array.isArray(children)) {
    for (const item of children) {
      if (typeof item === 'string') {
        ids.push(item);
        continue;
      }
      if (isRecord(item) && typeof item.componentId === 'string') {
        ids.push(item.componentId);
        continue;
      }
      if (isRecord(item) && typeof item.component === 'string') {
        return { inline: true, ids };
      }
      return { inline: true, ids };
    }
  } else if (isRecord(children) && typeof children.componentId === 'string') {
    ids.push(children.componentId);
  } else if (children !== undefined) {
    return { inline: true, ids };
  }

  if (typeof child === 'string') {
    ids.push(child);
  }
  if (typeof trigger === 'string') {
    ids.push(trigger);
  }
  if (typeof content === 'string') {
    ids.push(content);
  }
  if (Array.isArray(tabs)) {
    for (const tab of tabs) {
      if (isRecord(tab) && typeof tab.child === 'string') {
        ids.push(tab.child);
      }
    }
  }

  return { inline: false, ids };
}

function formatPropError(id: string, issues: ZodIssueLike[]): string {
  for (const issue of issues) {
    if (issue.code === 'unrecognized_keys' && issue.keys?.[0]) {
      return `组件 \`${id}\` 使用了未允许的属性 \`${issue.keys[0]}\``;
    }
  }
  const first = issues[0];
  const path = first?.path?.length ? first.path.join('.') : '';
  return `组件 \`${id}\` 的属性不合法${path ? `（${path}）` : ''}`;
}

export function validateSnapshot(
  snapshot: Snapshot,
  messages: unknown[],
): ApplyFailure | null {
  const surfaceIds = new Set<string>();

  for (const raw of messages) {
    if (!isRecord(raw)) {
      return { code: 'MESSAGE', message: '消息必须是对象。' };
    }
    const message = raw as A2uiMessage;
    if (message.version !== 'v0.9') {
      return { code: 'VERSION', message: '消息 version 必须是 v0.9。' };
    }
    if (message.deleteSurface) {
      return { code: 'DELETE_SURFACE', message: '不允许 deleteSurface。' };
    }
    const surfaceId = surfaceIdOf(message);
    if (surfaceId) {
      surfaceIds.add(surfaceId);
      if (surfaceId !== 'main') {
        return {
          code: 'SURFACE_ID',
          message: `surfaceId 必须是 main，不能是 ${surfaceId}。`,
        };
      }
    }
    if (
      message.createSurface &&
      message.createSurface.catalogId !== BASIC_CATALOG_ID
    ) {
      return {
        code: 'CATALOG',
        message: 'catalogId 必须是基础目录。',
      };
    }
  }

  if (surfaceIds.size > 1) {
    return { code: 'MULTI_SURFACE', message: '一份文档只能有一个 surface。' };
  }

  if (snapshot.surfaceId !== 'main') {
    return {
      code: 'SURFACE_ID',
      message: 'surfaceId 必须是 main。',
    };
  }

  if (snapshot.catalogId !== BASIC_CATALOG_ID) {
    return {
      code: 'CATALOG',
      message: 'catalogId 必须是基础目录。',
    };
  }

  if (snapshot.components.length === 0) {
    return { code: 'EMPTY', message: '没有组件。' };
  }

  const seen = new Set<string>();
  const known = new Set<string>();
  for (const component of snapshot.components) {
    if (typeof component.id !== 'string' || component.id.length === 0) {
      return { code: 'ID', message: '每个组件都需要非空 id。' };
    }
    if (seen.has(component.id)) {
      return {
        code: 'DUPLICATE_ID',
        message: `组件 id \`${component.id}\` 重复。`,
      };
    }
    seen.add(component.id);
    known.add(component.id);
  }

  if (!known.has('root')) {
    return { code: 'ROOT', message: '缺少 id 为 root 的根组件。' };
  }

  for (const component of snapshot.components) {
    if (!ALLOWED_SET.has(component.component)) {
      return {
        code: 'UNKNOWN_COMPONENT',
        message: `组件 \`${component.id}\` 使用了未允许的组件 \`${component.component}\``,
      };
    }

    const refs = childRefsOf(component);
    if (refs.inline) {
      return {
        code: 'INLINE_CHILDREN',
        message: `组件 \`${component.id}\` 的 children 必须是 id，不能内联组件。`,
      };
    }
    for (const ref of refs.ids) {
      if (!known.has(ref)) {
        return {
          code: 'DANGLING_REF',
          message: `组件 \`${component.id}\` 引用了不存在的 id \`${ref}\`。`,
        };
      }
    }

    const schema = SCHEMA_BY_NAME.get(component.component);
    if (!schema) {
      return {
        code: 'UNKNOWN_COMPONENT',
        message: `组件 \`${component.id}\` 使用了未允许的组件 \`${component.component}\``,
      };
    }

    const { id, component: _type, ...props } = component;
    const parsed = schema.safeParse(props);
    if (!parsed.success) {
      return {
        code: 'PROPS',
        message: formatPropError(id, parsed.error?.issues ?? []),
      };
    }
  }

  return null;
}
