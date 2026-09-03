import {
  deleteComponent,
  duplicateComponent,
  insertComponent,
  updateComponentProps,
} from '@src/editor/ops';
import { emptySnapshot } from '@src/editor/storage';
import { describe, expect, it } from 'vitest';
import { rootColumn } from '../../helpers/apply';

function withText() {
  return {
    ...rootColumn(['title']),
    components: [
      {
        id: 'root',
        component: 'Column',
        children: ['title'],
        justify: 'start',
        align: 'stretch',
      },
      { id: 'title', component: 'Text', text: '标题', variant: 'h3' },
    ],
  };
}

describe('insertComponent', () => {
  it('appends into the selected container', () => {
    const { snapshot, selectedId } = insertComponent(
      rootColumn(),
      'Text',
      'root',
    );
    expect(selectedId).toBe('text-1');
    expect(
      snapshot.components.find((item) => item.id === 'root')?.children,
    ).toEqual(['text-1']);
    expect(
      snapshot.components.find((item) => item.id === 'text-1')?.text,
    ).toBe('文本');
  });

  it('inserts after a selected sibling', () => {
    const { snapshot } = insertComponent(withText(), 'Button', 'title');
    expect(
      snapshot.components.find((item) => item.id === 'root')?.children,
    ).toEqual(['title', 'button-1']);
    expect(
      snapshot.components.some((item) => item.id === 'text-1'),
    ).toBe(true);
  });

  it('fills an empty Card child', () => {
    const cardPage = {
      ...emptySnapshot(),
      components: [
        {
          id: 'root',
          component: 'Column',
          children: ['card'],
          justify: 'start',
          align: 'stretch',
        },
        { id: 'card', component: 'Card' },
      ],
    };
    const { snapshot } = insertComponent(cardPage, 'Text', 'card');
    expect(snapshot.components.find((item) => item.id === 'card')?.child).toBe(
      'text-1',
    );
  });

  it('builds nested defaults for Tabs and Modal', () => {
    const tabs = insertComponent(rootColumn(), 'Tabs', 'root');
    expect(
      tabs.snapshot.components.filter((item) => item.component === 'Text'),
    ).toHaveLength(2);
    const modal = insertComponent(rootColumn(), 'Modal', 'root');
    const node = modal.snapshot.components.find(
      (item) => item.component === 'Modal',
    );
    expect(node?.trigger).toBeTruthy();
    expect(node?.content).toBeTruthy();
  });
});

describe('deleteComponent', () => {
  it('does not delete root', () => {
    const page = withText();
    expect(deleteComponent(page, 'root')).toBe(page);
  });

  it('removes a subtree and the parent ref', () => {
    const next = deleteComponent(withText(), 'title');
    expect(next.components.map((item) => item.id)).toEqual(['root']);
    expect(next.components[0]?.children).toEqual([]);
  });
});

describe('duplicateComponent', () => {
  it('clones a node after its sibling and remaps ids', () => {
    const { snapshot, selectedId } = duplicateComponent(withText(), 'title');
    expect(selectedId).toBe('text-1');
    expect(
      snapshot.components.find((item) => item.id === 'root')?.children,
    ).toEqual(['title', 'text-1']);
    expect(
      snapshot.components.find((item) => item.id === 'text-1')?.text,
    ).toBe('标题');
  });
});

describe('updateComponentProps', () => {
  it('replaces props while keeping id and type', () => {
    const next = updateComponentProps(withText(), 'title', {
      text: '新标题',
      variant: 'h1',
    });
    expect(next.components.find((item) => item.id === 'title')).toEqual({
      id: 'title',
      component: 'Text',
      text: '新标题',
      variant: 'h1',
    });
  });
});
