import { canInsertInto, collectSubtree, findParent, nextId } from './tree';
import type { A2uiComponent, Snapshot } from './types';

function clone<T>(value: T): T {
  return structuredClone(value);
}

function prefixFor(type: string): string {
  return type.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function replaceChildId(
  component: A2uiComponent,
  from: string,
  to: string,
): A2uiComponent {
  const next = { ...component };
  if (Array.isArray(next.children)) {
    next.children = (next.children as unknown[]).map((item) =>
      item === from ? to : item,
    );
  }
  if (next.child === from) {
    next.child = to;
  }
  if (next.trigger === from) {
    next.trigger = to;
  }
  if (next.content === from) {
    next.content = to;
  }
  if (Array.isArray(next.tabs)) {
    next.tabs = (next.tabs as { child?: string }[]).map((tab) =>
      tab.child === from ? { ...tab, child: to } : tab,
    );
  }
  return next;
}

function appendChild(component: A2uiComponent, childId: string): A2uiComponent {
  if (canInsertInto(component.component)) {
    const children = Array.isArray(component.children)
      ? [...(component.children as string[])]
      : [];
    children.push(childId);
    return { ...component, children };
  }
  if (component.component === 'Card' && !component.child) {
    return { ...component, child: childId };
  }
  return component;
}

function insertAfter(
  component: A2uiComponent,
  siblingId: string,
  childId: string,
): A2uiComponent {
  if (Array.isArray(component.children)) {
    const children = [...(component.children as string[])];
    const index = children.indexOf(siblingId);
    children.splice(index >= 0 ? index + 1 : children.length, 0, childId);
    return { ...component, children };
  }
  return component;
}

function createNodes(
  type: string,
  components: A2uiComponent[],
): { rootId: string; nodes: A2uiComponent[] } {
  const id = nextId(components, prefixFor(type));
  const used = [...components];

  switch (type) {
    case 'Text':
      return {
        rootId: id,
        nodes: [{ id, component: 'Text', text: '文本', variant: 'body' }],
      };
    case 'Image':
      return {
        rootId: id,
        nodes: [
          {
            id,
            component: 'Image',
            url: 'https://placehold.co/320x180',
            description: '图片',
          },
        ],
      };
    case 'Icon':
      return { rootId: id, nodes: [{ id, component: 'Icon', name: 'star' }] };
    case 'Video':
      return { rootId: id, nodes: [{ id, component: 'Video', url: '' }] };
    case 'AudioPlayer':
      return {
        rootId: id,
        nodes: [{ id, component: 'AudioPlayer', url: '', description: '音频' }],
      };
    case 'Divider':
      return {
        rootId: id,
        nodes: [{ id, component: 'Divider', axis: 'horizontal' }],
      };
    case 'Row':
    case 'Column':
      return {
        rootId: id,
        nodes: [
          {
            id,
            component: type,
            children: [],
            justify: 'start',
            align: 'stretch',
          },
        ],
      };
    case 'List': {
      const textId = nextId([...used], 'text');
      return {
        rootId: id,
        nodes: [
          { id, component: 'List', children: [textId], direction: 'vertical' },
          { id: textId, component: 'Text', text: '列表项', variant: 'body' },
        ],
      };
    }
    case 'Card': {
      const columnId = nextId([...used], 'column');
      const textId = nextId(
        [...used, { id: columnId, component: 'Column' }],
        'text',
      );
      return {
        rootId: id,
        nodes: [
          { id, component: 'Card', child: columnId },
          { id: columnId, component: 'Column', children: [textId] },
          { id: textId, component: 'Text', text: '卡片内容', variant: 'body' },
        ],
      };
    }
    case 'Tabs': {
      const a = nextId([...used], 'text');
      const b = nextId([...used, { id: a, component: 'Text' }], 'text');
      return {
        rootId: id,
        nodes: [
          {
            id,
            component: 'Tabs',
            tabs: [
              { title: '标签 1', child: a },
              { title: '标签 2', child: b },
            ],
          },
          { id: a, component: 'Text', text: '第一页', variant: 'body' },
          { id: b, component: 'Text', text: '第二页', variant: 'body' },
        ],
      };
    }
    case 'Modal': {
      const trigger = nextId([...used], 'button');
      const label = nextId(
        [...used, { id: trigger, component: 'Button' }],
        'text',
      );
      const content = nextId(
        [
          ...used,
          { id: trigger, component: 'Button' },
          { id: label, component: 'Text' },
        ],
        'text',
      );
      return {
        rootId: id,
        nodes: [
          { id, component: 'Modal', trigger, content },
          {
            id: trigger,
            component: 'Button',
            child: label,
            variant: 'default',
          },
          { id: label, component: 'Text', text: '打开' },
          { id: content, component: 'Text', text: '弹层内容', variant: 'body' },
        ],
      };
    }
    case 'Button': {
      const label = nextId([...used], 'text');
      return {
        rootId: id,
        nodes: [
          { id, component: 'Button', child: label, variant: 'default' },
          { id: label, component: 'Text', text: '按钮' },
        ],
      };
    }
    case 'TextField':
      return {
        rootId: id,
        nodes: [
          {
            id,
            component: 'TextField',
            label: '输入',
            value: '',
            variant: 'shortText',
          },
        ],
      };
    case 'CheckBox':
      return {
        rootId: id,
        nodes: [{ id, component: 'CheckBox', label: '选项', value: false }],
      };
    case 'ChoicePicker':
      return {
        rootId: id,
        nodes: [
          {
            id,
            component: 'ChoicePicker',
            label: '选择',
            variant: 'mutuallyExclusive',
            options: [
              { label: 'A', value: 'a' },
              { label: 'B', value: 'b' },
            ],
            value: { path: `/${id}` },
          },
        ],
      };
    case 'Slider':
      return {
        rootId: id,
        nodes: [
          {
            id,
            component: 'Slider',
            label: '数值',
            min: 0,
            max: 100,
            value: 50,
          },
        ],
      };
    case 'DateTimeInput':
      return {
        rootId: id,
        nodes: [
          {
            id,
            component: 'DateTimeInput',
            label: '日期',
            value: '',
            enableDate: true,
          },
        ],
      };
    default:
      return { rootId: id, nodes: [{ id, component: type }] };
  }
}

export function insertComponent(
  snapshot: Snapshot,
  type: string,
  selectedId: string | null,
): { snapshot: Snapshot; selectedId: string } {
  const { rootId, nodes } = createNodes(type, snapshot.components);
  let components = [...snapshot.components, ...nodes];
  const selected = selectedId
    ? components.find((item) => item.id === selectedId)
    : undefined;

  if (selected && canInsertInto(selected.component)) {
    components = components.map((item) =>
      item.id === selected.id ? appendChild(item, rootId) : item,
    );
  } else if (selected?.component === 'Card' && !selected.child) {
    components = components.map((item) =>
      item.id === selected.id ? appendChild(item, rootId) : item,
    );
  } else if (selected && selected.id !== 'root') {
    const parent = findParent(components, selected.id);
    if (parent && Array.isArray(parent.children)) {
      components = components.map((item) =>
        item.id === parent.id ? insertAfter(item, selected.id, rootId) : item,
      );
    } else {
      components = components.map((item) =>
        item.id === 'root' ? appendChild(item, rootId) : item,
      );
    }
  } else {
    components = components.map((item) =>
      item.id === 'root' ? appendChild(item, rootId) : item,
    );
  }

  return { snapshot: { ...snapshot, components }, selectedId: rootId };
}

export function deleteComponent(snapshot: Snapshot, id: string): Snapshot {
  if (id === 'root') {
    return snapshot;
  }
  const remove = collectSubtree(snapshot.components, id);
  const parent = findParent(snapshot.components, id);
  let components = snapshot.components.filter((item) => !remove.has(item.id));
  if (parent) {
    components = components.map((item) => {
      if (item.id !== parent.id) {
        return item;
      }
      const next = { ...item };
      if (Array.isArray(next.children)) {
        next.children = (next.children as string[]).filter(
          (child) => child !== id,
        );
      }
      if (next.child === id) {
        next.child = undefined;
      }
      if (next.trigger === id) {
        next.trigger = undefined;
      }
      if (next.content === id) {
        next.content = undefined;
      }
      if (Array.isArray(next.tabs)) {
        next.tabs = (next.tabs as { child?: string }[]).filter(
          (tab) => tab.child !== id,
        );
      }
      return next;
    });
  }
  return { ...snapshot, components };
}

export function duplicateComponent(
  snapshot: Snapshot,
  id: string,
): { snapshot: Snapshot; selectedId: string } {
  const subtree = [...collectSubtree(snapshot.components, id)];
  const byId = new Map(snapshot.components.map((item) => [item.id, item]));
  const remap = new Map<string, string>();
  let components = [...snapshot.components];
  for (const current of subtree) {
    const source = byId.get(current);
    if (!source) {
      continue;
    }
    remap.set(current, nextId(components, prefixFor(source.component)));
    components = [
      ...components,
      { id: remap.get(current) as string, component: source.component },
    ];
  }
  const clones: A2uiComponent[] = [];
  for (const current of subtree) {
    const source = clone(byId.get(current) as A2uiComponent);
    source.id = remap.get(current) as string;
    for (const [from, to] of remap) {
      Object.assign(source, replaceChildId(source, from, to));
    }
    clones.push(source);
  }
  components = snapshot.components.concat(clones);
  const parent = findParent(snapshot.components, id);
  const newRoot = remap.get(id) as string;
  if (parent && Array.isArray(parent.children)) {
    components = components.map((item) =>
      item.id === parent.id ? insertAfter(item, id, newRoot) : item,
    );
  } else if (parent?.child === id) {
    components = components.map((item) =>
      item.id === 'root' ? appendChild(item, newRoot) : item,
    );
  }
  return { snapshot: { ...snapshot, components }, selectedId: newRoot };
}

export function updateComponentProps(
  snapshot: Snapshot,
  id: string,
  props: Record<string, unknown>,
): Snapshot {
  return {
    ...snapshot,
    components: snapshot.components.map((item) =>
      item.id === id
        ? { id: item.id, component: item.component, ...props }
        : item,
    ),
  };
}
