import { describe, expect, it } from 'vitest';
import { applyDocument } from './applyDocument';
import login from './fixtures/login.json';
import { emptySnapshot, isCurrentPage, parseDraft } from './storage';
import { BASIC_CATALOG_ID } from './types';

function assertEmptyDraft(snapshot: ReturnType<typeof parseDraft>) {
  expect(snapshot.components).toHaveLength(0);
  expect(snapshot.dataModel).toEqual({});
  expect(JSON.stringify(snapshot)).not.toContain('任务管理');
}

describe('D draft', () => {
  it('D-01 empty snapshot is not a current page', () => {
    const snapshot = emptySnapshot();
    expect(snapshot.components).toHaveLength(0);
    expect(snapshot.dataModel).toEqual({});
    expect(snapshot.surfaceId).toBe('main');
    expect(snapshot.catalogId).toBe(BASIC_CATALOG_ID);
    expect(isCurrentPage(snapshot)).toBe(false);
  });

  it('D-02 missing or invalid draft becomes empty, not demo', () => {
    assertEmptyDraft(parseDraft(null));
    assertEmptyDraft(parseDraft('{'));
    assertEmptyDraft(
      parseDraft(
        JSON.stringify({
          surfaceId: 'main',
          catalogId: BASIC_CATALOG_ID,
          sendDataModel: true,
          components: [{ id: 'title', component: 'Text', text: '任务管理' }],
          dataModel: { title: '任务管理' },
        }),
      ),
    );
  });

  it('D-03 valid draft restores literal fields', () => {
    const applied = applyDocument(JSON.stringify(login), emptySnapshot());
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      return;
    }
    const restored = parseDraft(JSON.stringify(applied.snapshot));
    expect(isCurrentPage(restored)).toBe(true);
    expect((restored.dataModel as { title?: string }).title).toBe('登录');
  });
});
