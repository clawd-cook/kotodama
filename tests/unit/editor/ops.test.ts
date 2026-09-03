import { PALETTE } from '@src/editor/demo';
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

  it('inserts every palette type onto the root column', () => {
    for (const item of PALETTE) {
      const { snapshot, selectedId } = insertComponent(
        rootColumn(),
        item.type,
        'root',
      );
      expect(snapshot.components.some((node) => node.id === selectedId)).toBe(
        true,
      );
      expect(
        snapshot.components.find((node) => node.id === 'root')?.children,
      ).toContain(selectedId);
    }
  });

  it('uses a generic node for unknown types', () => {
    const { snapshot, selectedId } = insertComponent(
      rootColumn(),
      'UnknownWidget',
      'root',
    );
    expect(
      snapshot.components.find((item) => item.id === selectedId)?.component,
    ).toBe('UnknownWidget');
  });

  it('appends onto root when nothing is selected', () => {
    const { selectedId } = insertComponent(rootColumn(), 'Text', null);
    expect(selectedId).toBe('text-1');
  });

  it('inserts after a Button child by falling back to root', () => {
    const withButton = insertComponent(rootColumn(), 'Button', 'root');
    const labelId = withButton.snapshot.components.find(
      (item) => item.component === 'Text',
    )?.id;
    const next = insertComponent(withButton.snapshot, 'Icon', labelId ?? null);
    expect(
      next.snapshot.components.find((item) => item.id === 'root')?.children,
    ).toContain(next.selectedId);
  });

  it('inserts after a filled Card rather than replacing its child', () => {
    const withCard = insertComponent(rootColumn(), 'Card', 'root');
    const cardId = withCard.selectedId;
    const next = insertComponent(withCard.snapshot, 'Text', cardId);
    const card = next.snapshot.components.find((item) => item.id === cardId);
    expect(card?.child).toBeTruthy();
    expect(card?.child).not.toBe(next.selectedId);
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

  it('clears Modal trigger and content slots', () => {
    const modal = insertComponent(rootColumn(), 'Modal', 'root');
    const node = modal.snapshot.components.find(
      (item) => item.component === 'Modal',
    );
    const withoutTrigger = deleteComponent(
      modal.snapshot,
      String(node?.trigger),
    );
    expect(
      withoutTrigger.components.find((item) => item.component === 'Modal')
        ?.trigger,
    ).toBeUndefined();
    const withoutContent = deleteComponent(
      modal.snapshot,
      String(node?.content),
    );
    expect(
      withoutContent.components.find((item) => item.component === 'Modal')
        ?.content,
    ).toBeUndefined();
  });

  it('drops a Tabs panel from the tabs list', () => {
    const tabs = insertComponent(rootColumn(), 'Tabs', 'root');
    const node = tabs.snapshot.components.find(
      (item) => item.component === 'Tabs',
    );
    const firstChild = (node?.tabs as { child?: string }[])[0]?.child;
    const next = deleteComponent(tabs.snapshot, String(firstChild));
    const updated = next.components.find((item) => item.component === 'Tabs');
    expect((updated?.tabs as { child?: string }[]).map((tab) => tab.child)).not.toContain(
      firstChild,
    );
  });

  it('clears a Card child slot', () => {
    const card = insertComponent(rootColumn(), 'Card', 'root');
    const childId = card.snapshot.components.find((item) => item.id === card.selectedId)
      ?.child;
    const next = deleteComponent(card.snapshot, String(childId));
    expect(
      next.components.find((item) => item.id === card.selectedId)?.child,
    ).toBeUndefined();
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

  it('remaps Modal trigger and content ids', () => {
    const modal = insertComponent(rootColumn(), 'Modal', 'root');
    const { snapshot, selectedId } = duplicateComponent(
      modal.snapshot,
      modal.selectedId,
    );
    const clone = snapshot.components.find((item) => item.id === selectedId);
    const original = modal.snapshot.components.find(
      (item) => item.id === modal.selectedId,
    );
    expect(clone?.trigger).not.toBe(original?.trigger);
    expect(clone?.content).not.toBe(original?.content);
    expect(snapshot.components.some((item) => item.id === clone?.trigger)).toBe(
      true,
    );
  });

  it('appends a duplicated Card child onto root', () => {
    const card = insertComponent(rootColumn(), 'Card', 'root');
    const childId = String(
      card.snapshot.components.find((item) => item.id === card.selectedId)
        ?.child,
    );
    const { snapshot, selectedId } = duplicateComponent(card.snapshot, childId);
    expect(
      snapshot.components.find((item) => item.id === 'root')?.children,
    ).toContain(selectedId);
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
