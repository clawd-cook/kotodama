import {
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
