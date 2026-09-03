import {
  childIdsOf,
  emptyDataModel,
  flattenComponent,
  foldMessages,
  SURFACE_ID,
  toMessages,
} from '@src/editor/snapshot';
import { BASIC_CATALOG_ID } from '@src/editor/types';
import { describe, expect, it } from 'vitest';
import { BASIC_CATALOG } from '../../helpers/apply';

describe('flattenComponent', () => {
  it('returns null without an id', () => {
    expect(flattenComponent({ component: 'Text', text: 'x' })).toBeNull();
    expect(flattenComponent(null)).toBeNull();
  });

  it('keeps a string component name', () => {
    expect(
      flattenComponent({ id: 'title', component: 'Text', text: '你好' }),
    ).toMatchObject({ id: 'title', component: 'Text', text: '你好' });
  });

  it('unwraps nested component maps', () => {
    expect(
      flattenComponent({
        id: 'root',
        component: {
          Column: { children: { explicitList: ['a', 'b'] }, justify: 'start' },
        },
      }),
    ).toMatchObject({
      id: 'root',
      component: 'Column',
      children: ['a', 'b'],
      justify: 'start',
    });
  });

  it('unwraps { componentId } children', () => {
    expect(
      flattenComponent({
        id: 'row',
        component: 'Row',
        children: [{ componentId: 'one' }, 'two'],
      }),
    ).toMatchObject({ children: ['one', 'two'] });
  });

  it('uses type when component is missing', () => {
    expect(
      flattenComponent({
        id: 'go',
        type: 'Button',
        child: 'label',
        variant: 'primary',
      }),
    ).toMatchObject({
      id: 'go',
      component: 'Button',
      child: 'label',
      action: { event: { name: 'go' } },
    });
  });

  it('heals Modal children into trigger and content', () => {
    expect(
      flattenComponent({
        id: 'dialog',
        component: 'Modal',
        children: ['open', 'body'],
      }),
    ).toMatchObject({
      component: 'Modal',
      trigger: 'open',
      content: 'body',
    });
  });

  it('heals a single Modal child into content', () => {
    expect(
      flattenComponent({
        id: 'dialog',
        component: 'Modal',
        children: ['only'],
      }),
    ).toMatchObject({ content: 'only' });
  });

  it('reads a nested component.type map', () => {
    expect(
      flattenComponent({
        id: 'title',
        component: { type: 'Text', text: '你好', variant: 'body' },
      }),
    ).toMatchObject({ id: 'title', component: 'Text', text: '你好' });
  });

  it('picks a mapped type from extra keys when component is missing', () => {
    expect(
      flattenComponent({
        id: 'title',
        Text: { text: '你好', variant: 'body' },
      }),
    ).toMatchObject({ component: 'Text', text: '你好' });
  });

  it('unwraps explicitList children and componentId refs', () => {
    expect(
      flattenComponent({
        id: 'root',
        component: 'Column',
        children: { explicitList: [{ componentId: 'a' }, 'b'] },
      }),
    ).toMatchObject({ children: ['a', 'b'] });
  });

  it('heals Card and Button children into child slots', () => {
    expect(
      flattenComponent({
        id: 'card',
        component: 'Card',
        children: ['body'],
      }),
    ).toMatchObject({ child: 'body' });
    expect(
      flattenComponent({
        id: 'go',
        component: 'Button',
        children: ['label'],
      }),
    ).toMatchObject({
      child: 'label',
      action: { event: { name: 'go' } },
    });
  });

  it('keeps a Button functionCall action', () => {
    expect(
      flattenComponent({
        id: 'go',
        component: 'Button',
        action: { functionCall: { name: 'submit' } },
      }),
    ).toMatchObject({
      action: { functionCall: { name: 'submit' } },
    });
  });

  it('heals a string Modal children slot', () => {
    expect(
      flattenComponent({
        id: 'dialog',
        component: 'Modal',
        children: 'only',
      }),
    ).toMatchObject({ content: 'only' });
  });

  it('returns an empty type when a mapped type is ambiguous', () => {
    expect(
      flattenComponent({
        id: 'x',
        component: { Column: { children: [] }, Row: { children: [] } },
      }),
    ).toMatchObject({ id: 'x', component: '' });
  });
});

describe('foldMessages', () => {
  it('returns an empty main surface for junk', () => {
    expect(foldMessages(null)).toMatchObject({
      surfaceId: SURFACE_ID,
      catalogId: BASIC_CATALOG_ID,
      components: [],
      dataModel: {},
    });
  });

  it('merges data model paths', () => {
    const snapshot = foldMessages([
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'main', path: '/', value: { a: 1 } },
      },
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'main', path: '/b/c', value: 2 },
      },
    ]);
    expect(snapshot.dataModel).toEqual({ a: 1, b: { c: 2 } });
  });

  it('replaces the root when the path is /', () => {
    const snapshot = foldMessages([
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'main', path: '/', value: { title: '新' } },
      },
    ]);
    expect(snapshot.dataModel).toEqual({ title: '新' });
  });

  it('ignores non-object messages', () => {
    const snapshot = foldMessages([1, 'x', null, { version: 'v0.9' }]);
    expect(snapshot.components).toEqual([]);
  });

  it('creates a surface from updateComponents when createSurface is missing', () => {
    const snapshot = foldMessages([
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'main',
          components: [{ id: 'root', component: 'Text', text: 'hi' }],
        },
      },
    ]);
    expect(snapshot.components).toHaveLength(1);
    expect(snapshot.catalogId).toBe(BASIC_CATALOG_ID);
  });

  it('drops a deleted surface and uses an empty catalog id fallback', () => {
    const extra = foldMessages([
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'other',
          catalogId: '',
          sendDataModel: false,
        },
      },
    ]);
    expect(extra.surfaceId).toBe('other');
    expect(extra.catalogId).toBe(BASIC_CATALOG_ID);
    expect(extra.sendDataModel).toBe(false);

    const deleted = foldMessages([
      {
        version: 'v0.9',
        createSurface: {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
        },
      },
      {
        version: 'v0.9',
        updateComponents: {
          surfaceId: 'main',
          components: [{ id: 'root', component: 'Text', text: 'x' }],
        },
      },
      {
        version: 'v0.9',
        deleteSurface: { surfaceId: 'main' },
      },
    ]);
    expect(deleted.components).toEqual([]);
  });

  it('nests data model paths onto a non-object root', () => {
    const snapshot = foldMessages([
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'main', path: '/a/b', value: 1 },
      },
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'main', path: '/a/c', value: 2 },
      },
    ]);
    expect(snapshot.dataModel).toEqual({ a: { b: 1, c: 2 } });
  });

  it('replaces array segments when nesting a data path', () => {
    const snapshot = foldMessages([
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'main', path: '/', value: { a: [1] } },
      },
      {
        version: 'v0.9',
        updateDataModel: { surfaceId: 'main', path: '/a/b', value: 2 },
      },
    ]);
    expect(snapshot.dataModel).toEqual({ a: { b: 2 } });
  });
});

describe('childIdsOf', () => {
  it('collects string, componentId, slots, and tab children', () => {
    expect(
      childIdsOf({
        id: 'root',
        component: 'Column',
        children: ['a', { componentId: 'b' }, 1],
        child: 'c',
        trigger: 'd',
        content: 'e',
        tabs: [{ title: 'one', child: 'f' }, { title: 'two' }, null],
      }),
    ).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });
});

describe('emptyDataModel', () => {
  it('returns an empty object', () => {
    expect(emptyDataModel()).toEqual({});
  });
});

describe('toMessages', () => {
  it('emits create, components, and data for a snapshot', () => {
    const messages = toMessages({
      surfaceId: 'main',
      catalogId: BASIC_CATALOG_ID,
      sendDataModel: true,
      components: [{ id: 'root', component: 'Text', text: 'hi' }],
      dataModel: { title: 'hi' },
    });
    expect(messages).toHaveLength(3);
    expect(messages[0]?.createSurface?.surfaceId).toBe('main');
    expect(messages[1]?.updateComponents?.components).toHaveLength(1);
    expect(messages[2]?.updateDataModel?.value).toEqual({ title: 'hi' });
  });
});
