import { PreviewPane } from '@src/editor/Preview';
import { EditorProvider, useEditor } from '@src/editor/EditorState';
import { toMessages } from '@src/editor/snapshot';
import { BASIC_CATALOG_ID } from '@src/editor/types';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const processor = vi.hoisted(() => ({
  mode: 'empty' as 'empty' | 'error' | 'string',
}));

vi.mock('@a2ui/web_core/v0_9', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@a2ui/web_core/v0_9')>();
  class FakeProcessor {
    model = {
      surfacesMap: new Map(),
      dispose() {
        return undefined;
      },
    };
    processMessages() {
      if (processor.mode === 'error') {
        throw new Error('解析失败');
      }
      if (processor.mode === 'string') {
        throw 'broken';
      }
    }
  }
  return { ...actual, MessageProcessor: FakeProcessor };
});

afterEach(() => {
  cleanup();
  processor.mode = 'empty';
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
      { id: 'title', component: 'Text', text: '预览标题', variant: 'h3' },
    ],
    dataModel: {},
  };
}

function Harness() {
  const editor = useEditor();
  return (
    <div>
      <pre data-testid="errors">
        {editor.errors.map((item) => `${item.source}:${item.message}`).join('|')}
      </pre>
      <button
        type="button"
        onClick={() => editor.applyJson(JSON.stringify(toMessages(validPage())))}
      >
        seed
      </button>
      <PreviewPane theme="light" />
    </div>
  );
}

async function seedPreview() {
  const user = userEvent.setup();
  render(
    <EditorProvider>
      <Harness />
    </EditorProvider>,
  );
  await user.click(screen.getByRole('button', { name: 'seed' }));
}

describe('PreviewPane error routing', () => {
  it('logs a missing surface as a protocol error', async () => {
    processor.mode = 'empty';
    await seedPreview();
    await waitFor(() => {
      expect(screen.getByTestId('errors').textContent).toContain(
        'protocol:没有可预览的页面',
      );
    });
  });

  it('logs a thrown Error as a preview error', async () => {
    processor.mode = 'error';
    await seedPreview();
    await waitFor(() => {
      expect(screen.getByTestId('errors').textContent).toContain(
        'preview:解析失败',
      );
    });
  });

  it('stringifies a non-Error throw', async () => {
    processor.mode = 'string';
    await seedPreview();
    await waitFor(() => {
      expect(screen.getByTestId('errors').textContent).toContain(
        'preview:broken',
      );
    });
  });
});
