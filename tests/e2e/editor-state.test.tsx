import { PALETTE } from '@src/editor/demo';
import { EditorProvider, useEditor } from '@src/editor/EditorState';
import { toMessages } from '@src/editor/snapshot';
import { emptySnapshot } from '@src/editor/storage';
import { BASIC_CATALOG_ID } from '@src/editor/types';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

function validPage() {
  return {
    surfaceId: 'main',
    catalogId: BASIC_CATALOG_ID,
    sendDataModel: true,
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
    dataModel: { title: '标题' },
  };
}

function Harness() {
  const editor = useEditor();
  return (
    <div>
      <pre data-testid="ids">
        {editor.snapshot.components.map((item) => item.id).join(',')}
      </pre>
      <pre data-testid="selected">{editor.selectedId ?? ''}</pre>
      <pre data-testid="hovered">{editor.hoveredId ?? ''}</pre>
      <pre data-testid="errors">
        {editor.errors.map((item) => `${item.source}:${item.message}`).join('|')}
      </pre>
      <pre data-testid="events">{String(editor.events.length)}</pre>
      <pre data-testid="undo">{String(editor.canUndo)}</pre>
      <pre data-testid="redo">{String(editor.canRedo)}</pre>
      <pre data-testid="json-error">{editor.jsonError ?? ''}</pre>
      <pre data-testid="data">{JSON.stringify(editor.snapshot.dataModel)}</pre>
      <button type="button" onClick={() => editor.insert('Text')}>
        insert-text
      </button>
      <button type="button" onClick={() => editor.insert('UnknownWidget')}>
        insert-bad
      </button>
      {PALETTE.map((item) => (
        <button
          key={item.type}
          type="button"
          onClick={() => editor.insert(item.type)}
        >
          insert-{item.type}
        </button>
      ))}
      <button type="button" onClick={() => editor.removeSelected()}>
        remove
      </button>
      <button type="button" onClick={() => editor.duplicateSelected()}>
        duplicate
      </button>
      <button
        type="button"
        onClick={() => editor.updateSelectedProps({ text: '改过', variant: 'h1' })}
      >
        update-ok
      </button>
      <button
        type="button"
        onClick={() => editor.updateSelectedProps({ className: 'nope' })}
      >
        update-bad
      </button>
      <button type="button" onClick={() => editor.setSelectedId('root')}>
        select-root
      </button>
      <button type="button" onClick={() => editor.setSelectedId('title')}>
        select-title
      </button>
      <button type="button" onClick={() => editor.setHoveredId('title')}>
        hover-title
      </button>
      <button
        type="button"
        onClick={() => editor.setDataModel({ title: '模型' })}
      >
        set-data
      </button>
      <button
        type="button"
        onClick={() => editor.syncDataModelFromPreview({ live: true })}
      >
        sync-data
      </button>
      <button
        type="button"
        onClick={() => editor.applyJson(JSON.stringify(toMessages(validPage())))}
      >
        apply-ok
      </button>
      <button type="button" onClick={() => editor.applyJson('{')}>
        apply-bad
      </button>
      <button
        type="button"
        onClick={() => editor.openJson(JSON.stringify(toMessages(validPage())))}
      >
        open-ok
      </button>
      <button type="button" onClick={() => editor.openJson('{')}>
        open-bad
      </button>
      <button
        type="button"
        onClick={() => editor.loadPage(JSON.stringify(toMessages(validPage())))}
      >
        load-ok
      </button>
      <button type="button" onClick={() => editor.loadPage('{')}>
        load-bad
      </button>
      <button type="button" onClick={() => editor.setJsonText('draft')}>
        set-json
      </button>
      <button type="button" onClick={() => editor.undo()}>
        undo
      </button>
      <button type="button" onClick={() => editor.redo()}>
        redo
      </button>
      <button type="button" onClick={() => editor.reset()}>
        reset
      </button>
      <button type="button" onClick={() => editor.logEvent({ name: 'click' })}>
        log-event
      </button>
      <button
        type="button"
        onClick={() => editor.logError('预览失败', 'preview')}
      >
        log-error
      </button>
      <button type="button" onClick={() => editor.clearErrors('preview')}>
        clear-preview
      </button>
      <button type="button" onClick={() => editor.clearErrors()}>
        clear-all
      </button>
    </div>
  );
}

function renderEditor() {
  return render(
    <EditorProvider>
      <Harness />
    </EditorProvider>,
  );
}

describe('EditorProvider', () => {
  it('inserts, undoes, and restores a Text node', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'insert-text' }));
    expect(screen.getByTestId('ids').textContent).toContain('text-1');
    expect(screen.getByTestId('selected').textContent).toBe('text-1');
    expect(screen.getByTestId('undo').textContent).toBe('true');
    await user.click(screen.getByRole('button', { name: 'undo' }));
    expect(screen.getByTestId('ids').textContent).not.toContain('text-1');
    expect(screen.getByTestId('redo').textContent).toBe('true');
    await user.click(screen.getByRole('button', { name: 'redo' }));
    expect(screen.getByTestId('ids').textContent).toContain('text-1');
  });

  it('records insert failures and no-ops empty undo/redo/delete', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'undo' }));
    await user.click(screen.getByRole('button', { name: 'redo' }));
    await user.click(screen.getByRole('button', { name: 'remove' }));
    await user.click(screen.getByRole('button', { name: 'duplicate' }));
    await user.click(screen.getByRole('button', { name: 'update-ok' }));
    await user.click(screen.getByRole('button', { name: 'insert-bad' }));
    expect(screen.getByTestId('errors').textContent).toContain('json:');
    await user.click(screen.getByRole('button', { name: 'select-root' }));
    await user.click(screen.getByRole('button', { name: 'remove' }));
    expect(screen.getByTestId('selected').textContent).toBe('root');
  });

  it('applies, opens, and loads JSON, including failures', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'apply-ok' }));
    expect(screen.getByTestId('ids').textContent).toContain('title');
    await user.click(screen.getByRole('button', { name: 'apply-bad' }));
    expect(screen.getByTestId('json-error').textContent).toContain('JSON');
    await user.click(screen.getByRole('button', { name: 'open-ok' }));
    expect(screen.getByTestId('json-error').textContent).toBe('');
    await user.click(screen.getByRole('button', { name: 'open-bad' }));
    expect(screen.getByTestId('errors').textContent).toContain('没有打开');
    await user.click(screen.getByRole('button', { name: 'load-ok' }));
    expect(screen.getByTestId('selected').textContent).toBe('');
    await user.click(screen.getByRole('button', { name: 'load-bad' }));
    await user.click(screen.getByRole('button', { name: 'set-json' }));
    await user.click(screen.getByRole('button', { name: 'reset' }));
    expect(screen.getByTestId('ids').textContent).toBe(
      emptySnapshot()
        .components.map((item) => item.id)
        .join(','),
    );
  });

  it('updates props, data, events, and errors', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'apply-ok' }));
    await user.click(screen.getByRole('button', { name: 'select-title' }));
    await user.click(screen.getByRole('button', { name: 'hover-title' }));
    expect(screen.getByTestId('hovered').textContent).toBe('title');
    await user.click(screen.getByRole('button', { name: 'update-ok' }));
    await user.click(screen.getByRole('button', { name: 'update-bad' }));
    expect(screen.getByTestId('errors').textContent).toContain('json:');
    await user.click(screen.getByRole('button', { name: 'duplicate' }));
    expect(screen.getByTestId('ids').textContent).toContain('text-1');
    await user.click(screen.getByRole('button', { name: 'remove' }));
    await user.click(screen.getByRole('button', { name: 'set-data' }));
    expect(screen.getByTestId('data').textContent).toContain('模型');
    await user.click(screen.getByRole('button', { name: 'sync-data' }));
    expect(screen.getByTestId('data').textContent).toContain('live');
    await user.click(screen.getByRole('button', { name: 'log-event' }));
    expect(screen.getByTestId('events').textContent).toBe('1');
    await user.click(screen.getByRole('button', { name: 'log-error' }));
    expect(screen.getByTestId('errors').textContent).toContain('preview:');
    await user.click(screen.getByRole('button', { name: 'clear-preview' }));
    await user.click(screen.getByRole('button', { name: 'clear-all' }));
    expect(screen.getByTestId('errors').textContent).toBe('');
  });

  it('inserts every palette type onto an empty page', async () => {
    const user = userEvent.setup();
    renderEditor();
    await user.click(screen.getByRole('button', { name: 'apply-ok' }));
    for (const item of PALETTE) {
      await user.click(screen.getByRole('button', { name: `insert-${item.type}` }));
    }
    expect(screen.getByTestId('ids').textContent?.split(',').length).toBeGreaterThan(
      PALETTE.length,
    );
  });

  it('throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Probe() {
      useEditor();
      return null;
    }
    expect(() => render(<Probe />)).toThrow(
      'useEditor must be used within EditorProvider',
    );
    spy.mockRestore();
  });
});
