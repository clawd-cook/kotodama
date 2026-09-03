import {
  buildTree,
  canInsertInto,
  collectSubtree,
  findParent,
  nextId,
} from '@src/editor/tree';
import type { A2uiComponent } from '@src/editor/types';
import { describe, expect, it } from 'vitest';

const tree: A2uiComponent[] = [
  { id: 'root', component: 'Column', children: ['title', 'card'] },
  { id: 'title', component: 'Text', text: '标题' },
  { id: 'card', component: 'Card', child: 'body' },
  { id: 'body', component: 'Column', children: ['field'] },
  { id: 'field', component: 'TextField', label: '名' },
];

describe('buildTree', () => {
  it('roots unreferenced nodes and walks children', () => {
    const nodes = buildTree(tree);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      id: 'root',
      type: 'Column',
      children: [
        { id: 'title', type: 'Text', children: [] },
        {
          id: 'card',
          type: 'Card',
          children: [
            {
              id: 'body',
              type: 'Column',
              children: [{ id: 'field', type: 'TextField', children: [] }],
            },
          ],
        },
      ],
    });
  });

  it('does not hang on cycles', () => {
    const cyclic: A2uiComponent[] = [
      { id: 'a', component: 'Column', children: ['b'] },
      { id: 'b', component: 'Column', children: ['a'] },
    ];
    expect(() => buildTree(cyclic)).not.toThrow();
    const ids = JSON.stringify(buildTree(cyclic));
    expect((ids.match(/"id":"a"/g) ?? []).length).toBeLessThanOrEqual(1);
  });
});

describe('tree helpers', () => {
  it('finds parents by child id', () => {
    expect(findParent(tree, 'field')?.id).toBe('body');
    expect(findParent(tree, 'root')).toBeUndefined();
  });

  it('only inserts into Row, Column, and List', () => {
    expect(canInsertInto('Column')).toBe(true);
    expect(canInsertInto('Row')).toBe(true);
    expect(canInsertInto('List')).toBe(true);
    expect(canInsertInto('Card')).toBe(false);
    expect(canInsertInto('Text')).toBe(false);
  });

  it('allocates the next unused prefixed id', () => {
    expect(nextId(tree, 'text')).toBe('text-1');
    expect(nextId([...tree, { id: 'text-1', component: 'Text' }], 'text')).toBe(
      'text-2',
    );
  });

  it('collects a subtree including the start node', () => {
    expect([...collectSubtree(tree, 'card')].toSorted()).toEqual([
      'body',
      'card',
      'field',
    ]);
    expect(collectSubtree(tree, 'title').has('title')).toBe(true);
    expect(collectSubtree(tree, 'title').size).toBe(1);
  });
});
