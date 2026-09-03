import { antdCatalog } from '@kotodama/antd-catalog';
import { EditorProvider } from '@src/editor/EditorState';
import { PaperPreview } from '@src/paper/PaperPreview';
import { PreviewPane } from '@src/editor/Preview';
import { saveDraft } from '@src/editor/storage';
import { BASIC_CATALOG_ID } from '@src/editor/types';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
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

describe('PreviewPane error routing', () => {
  it('treats a missing surface as a protocol error', async () => {
    processor.mode = 'empty';
    saveDraft(validPage());
    const onError = vi.fn();
    render(
      <PaperPreview
        snapshot={validPage()}
        theme="light"
        catalog={antdCatalog}
        onError={onError}
      />,
    );
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('没有可预览的页面');
    });
    render(
      <EditorProvider>
        <PreviewPane theme="light" />
      </EditorProvider>,
    );
    expect(await screen.findAllByText('没有可预览的页面')).toHaveLength(2);
  });

  it('treats a thrown Error as a preview error', async () => {
    processor.mode = 'error';
    saveDraft(validPage());
    const onError = vi.fn();
    render(
      <PaperPreview
        snapshot={validPage()}
        theme="light"
        catalog={antdCatalog}
        onError={onError}
      />,
    );
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('解析失败');
    });
    render(
      <EditorProvider>
        <PreviewPane theme="light" />
      </EditorProvider>,
    );
    expect(await screen.findAllByText('没有可预览的页面')).toBeTruthy();
  });

  it('stringifies a non-Error throw', async () => {
    processor.mode = 'string';
    const onError = vi.fn();
    render(
      <PaperPreview
        snapshot={validPage()}
        theme="light"
        catalog={antdCatalog}
        onError={onError}
      />,
    );
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith('broken');
    });
  });
});
