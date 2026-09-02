import { childIdsOf } from './snapshot';
import type { A2uiComponent } from './types';

export type TreeNode = {
  id: string;
  type: string;
  children: TreeNode[];
};

export const CONTAINER_TYPES = new Set(['Row', 'Column', 'List']);

export function buildTree(components: A2uiComponent[]): TreeNode[] {
  const byId = new Map(components.map((item) => [item.id, item]));
  const referenced = new Set(components.flatMap(childIdsOf));
  const roots = components.filter((item) => !referenced.has(item.id));
  const walk = (id: string, seen: Set<string>): TreeNode | null => {
    if (seen.has(id)) {
      return null;
    }
    const component = byId.get(id);
    if (!component) {
      return { id, type: '?', children: [] };
    }
    seen.add(id);
    return {
      id,
      type: component.component,
      children: childIdsOf(component)
        .map((childId) => walk(childId, seen))
        .filter((node): node is TreeNode => node !== null),
    };
  };
  const seen = new Set<string>();
  return roots
    .map((item) => walk(item.id, seen))
    .filter((node): node is TreeNode => node !== null);
}

export function findParent(
  components: A2uiComponent[],
  id: string,
): A2uiComponent | undefined {
  return components.find((item) => childIdsOf(item).includes(id));
}

export function canInsertInto(type: string): boolean {
  return CONTAINER_TYPES.has(type);
}

export function nextId(components: A2uiComponent[], prefix: string): string {
  const ids = new Set(components.map((item) => item.id));
  let index = 1;
  while (ids.has(`${prefix}-${index}`)) {
    index += 1;
  }
  return `${prefix}-${index}`;
}

export function collectSubtree(
  components: A2uiComponent[],
  id: string,
): Set<string> {
  const byId = new Map(components.map((item) => [item.id, item]));
  const ids = new Set<string>();
  const visit = (current: string) => {
    if (ids.has(current)) {
      return;
    }
    ids.add(current);
    const component = byId.get(current);
    if (component) {
      for (const child of childIdsOf(component)) {
        visit(child);
      }
    }
  };
  visit(id);
  return ids;
}
