import {
  type A2uiComponent,
  type A2uiMessage,
  BASIC_CATALOG_ID,
  type Snapshot,
} from './types';
import { ALLOWED_COMPONENTS } from './validate';

export const SURFACE_ID = 'main';

export function emptyDataModel(): Record<string, unknown> {
  return {};
}

export function toMessages(snapshot: Snapshot): A2uiMessage[] {
  return [
    {
      version: 'v0.9',
      createSurface: {
        surfaceId: snapshot.surfaceId,
        catalogId: snapshot.catalogId,
        sendDataModel: snapshot.sendDataModel,
      },
    },
    {
      version: 'v0.9',
      updateComponents: {
        surfaceId: snapshot.surfaceId,
        components: snapshot.components,
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: snapshot.surfaceId,
        path: '/',
        value: snapshot.dataModel ?? {},
      },
    },
  ];
}

function applyDataPath(
  target: unknown,
  path: string | undefined,
  value: unknown,
): unknown {
  if (!path || path === '/') {
    return value;
  }
  const segments = path.split('/').filter(Boolean);
  const root =
    target && typeof target === 'object' && !Array.isArray(target)
      ? { ...(target as Record<string, unknown>) }
      : {};
  let cursor: Record<string, unknown> = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const key = segments[i];
    const next = cursor[key];
    cursor[key] =
      next && typeof next === 'object' && !Array.isArray(next)
        ? { ...(next as Record<string, unknown>) }
        : {};
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]] = value as never;
  return root;
}

type SurfaceAcc = {
  catalogId: string;
  sendDataModel: boolean;
  components: Map<string, A2uiComponent>;
  dataModel: unknown;
};

function ensureSurface(
  bySurface: Map<string, SurfaceAcc>,
  surfaceId: string,
): SurfaceAcc {
  const existing = bySurface.get(surfaceId);
  if (existing) {
    return existing;
  }
  const created: SurfaceAcc = {
    catalogId: BASIC_CATALOG_ID,
    sendDataModel: true,
    components: new Map(),
    dataModel: {},
  };
  bySurface.set(surfaceId, created);
  return created;
}

const ALLOWED_TYPE = new Set<string>(ALLOWED_COMPONENTS);
const RESERVED_KEYS = new Set(['id', 'weight', 'component', 'type']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function flattenChildren(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') {
        return item;
      }
      if (isRecord(item) && typeof item.componentId === 'string') {
        return item.componentId;
      }
      return item;
    });
  }
  if (isRecord(value) && Array.isArray(value.explicitList)) {
    return flattenChildren(value.explicitList);
  }
  return value;
}

function slotIdsFromChildren(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === 'string');
}

function slotId(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/** Modal/Card/Button 用 trigger/content/child；模型常误写成 children。 */
function healChildSlots(type: string, props: Record<string, unknown>): void {
  const ids = slotIdsFromChildren(props.children);
  if (type === 'Modal') {
    if (ids.length >= 2) {
      props.trigger = slotId(props.trigger) ?? ids[0];
      props.content = slotId(props.content) ?? ids[1];
    } else if (ids.length === 1) {
      props.content = slotId(props.content) ?? ids[0];
    }
    delete props.children;
    return;
  }
  if (type === 'Card' || type === 'Button') {
    if (ids.length >= 1) {
      props.child = slotId(props.child) ?? ids[0];
    }
    delete props.children;
  }
}

function hasButtonAction(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (isRecord(value.functionCall)) {
    return true;
  }
  return (
    isRecord(value.event) &&
    typeof value.event.name === 'string' &&
    value.event.name.length > 0
  );
}

/** 模型常漏写 Button.action；没有事件名时用组件 id，点击才能进事件日志。 */
function healButtonAction(
  type: string,
  id: string,
  props: Record<string, unknown>,
): void {
  if (type !== 'Button' || hasButtonAction(props.action)) {
    return;
  }
  props.action = { event: { name: id } };
}

function pickMappedType(
  value: unknown,
): { type: string; props: Record<string, unknown> } | null {
  if (!isRecord(value)) {
    return null;
  }
  const keys = Object.keys(value);
  const allowed = keys.filter((key) => ALLOWED_TYPE.has(key));
  const pick =
    allowed.length === 1 ? allowed[0] : keys.length === 1 ? keys[0] : undefined;
  if (!pick || !isRecord(value[pick])) {
    return null;
  }
  return { type: pick, props: { ...(value[pick] as Record<string, unknown>) } };
}

export function flattenComponent(raw: unknown): A2uiComponent | null {
  if (!isRecord(raw) || typeof raw.id !== 'string' || raw.id.length === 0) {
    return null;
  }
  let type: string | undefined;
  let props: Record<string, unknown> = { ...raw };
  delete props.id;

  if (typeof raw.component === 'string') {
    type = raw.component;
    delete props.component;
  } else {
    const mapped = pickMappedType(raw.component);
    if (mapped) {
      type = mapped.type;
      props = { ...props, ...mapped.props };
      delete props.component;
    } else if (
      isRecord(raw.component) &&
      typeof raw.component.type === 'string'
    ) {
      type = raw.component.type;
      const rest = { ...raw.component };
      delete rest.type;
      props = { ...props, ...rest };
      delete props.component;
    }
  }

  if (!type && typeof raw.type === 'string') {
    type = raw.type;
    delete props.type;
  }

  if (!type) {
    const mapped = pickMappedType(
      Object.fromEntries(
        Object.entries(raw).filter(([key]) => !RESERVED_KEYS.has(key)),
      ),
    );
    if (mapped) {
      type = mapped.type;
      props = { ...props, ...mapped.props };
      delete props[mapped.type];
    }
  }

  if (props.children !== undefined) {
    props.children = flattenChildren(props.children);
  }
  if (type) {
    healChildSlots(type, props);
    healButtonAction(type, raw.id, props);
  }
  delete props.type;
  delete props.component;

  return {
    id: raw.id,
    component: type ?? '',
    ...props,
  };
}

export function foldMessages(input: unknown): Snapshot {
  const list = Array.isArray(input) ? input : [];
  const bySurface = new Map<
    string,
    {
      catalogId: string;
      sendDataModel: boolean;
      components: Map<string, A2uiComponent>;
      dataModel: unknown;
    }
  >();
  let activeId = SURFACE_ID;
  const extras: string[] = [];

  for (const raw of list) {
    if (!raw || typeof raw !== 'object') {
      continue;
    }
    const message = raw as A2uiMessage;
    if (message.createSurface) {
      const { surfaceId, catalogId, sendDataModel } = message.createSurface;
      if (bySurface.size > 0 && !bySurface.has(surfaceId)) {
        extras.push(surfaceId);
      }
      activeId = surfaceId;
      bySurface.set(surfaceId, {
        catalogId: catalogId || BASIC_CATALOG_ID,
        sendDataModel: sendDataModel ?? true,
        components: new Map(),
        dataModel: {},
      });
    }
    if (message.deleteSurface) {
      bySurface.delete(message.deleteSurface.surfaceId);
    }
    if (message.updateComponents) {
      const { surfaceId, components } = message.updateComponents;
      const surface = ensureSurface(bySurface, surfaceId);
      activeId = surfaceId;
      for (const component of components ?? []) {
        const flat = flattenComponent(component);
        if (flat) {
          surface.components.set(flat.id, flat);
        }
      }
    }
    if (message.updateDataModel) {
      const { surfaceId, path, value } = message.updateDataModel;
      const surface = ensureSurface(bySurface, surfaceId);
      activeId = surfaceId;
      surface.dataModel = applyDataPath(surface.dataModel, path, value);
    }
  }

  const first =
    bySurface.get(activeId) ??
    bySurface.values().next().value ??
    ({
      catalogId: BASIC_CATALOG_ID,
      sendDataModel: true,
      components: new Map(),
      dataModel: {},
    } as const);

  const components = [...first.components.values()];

  return {
    surfaceId: bySurface.has(activeId) ? activeId : SURFACE_ID,
    catalogId: first.catalogId || BASIC_CATALOG_ID,
    sendDataModel: first.sendDataModel,
    components,
    dataModel: first.dataModel ?? {},
  };
}

function childIdsOf(component: A2uiComponent): string[] {
  const ids: string[] = [];
  const { children, child, trigger, content, tabs } = component;
  if (Array.isArray(children)) {
    for (const item of children) {
      if (typeof item === 'string') {
        ids.push(item);
      } else if (item && typeof item === 'object' && 'componentId' in item) {
        ids.push(String((item as { componentId: string }).componentId));
      }
    }
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
      if (
        tab &&
        typeof tab === 'object' &&
        typeof (tab as { child?: string }).child === 'string'
      ) {
        ids.push((tab as { child: string }).child);
      }
    }
  }
  return ids;
}

export { childIdsOf };
