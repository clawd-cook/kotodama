import { BASIC_CATALOG_ID } from '@kotodama/antd-catalog';
import type { A2uiComponent, A2uiMessage, Snapshot } from './types';

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
      const surface = bySurface.get(surfaceId);
      if (!surface) {
        continue;
      }
      for (const component of components ?? []) {
        if (component?.id) {
          surface.components.set(component.id, { ...component });
        }
      }
    }
    if (message.updateDataModel) {
      const { surfaceId, path, value } = message.updateDataModel;
      const surface = bySurface.get(surfaceId);
      if (!surface) {
        continue;
      }
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
  ensureRootId(components);

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

function ensureRootId(components: A2uiComponent[]) {
  if (components.some((item) => item.id === 'root')) {
    return;
  }
  const referenced = new Set(components.flatMap(childIdsOf));
  const root = components.find((item) => !referenced.has(item.id));
  if (root) {
    root.id = 'root';
  }
}

export { childIdsOf };
