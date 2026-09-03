import { A2uiSurface } from '@a2ui/react/v0_9';
import { MessageProcessor } from '@a2ui/web_core/v0_9';
import { antdCatalog } from '@kotodama/antd-catalog';
import { applyDocument } from '@src/editor/applyDocument';
import { toMessages } from '@src/editor/snapshot';
import { emptySnapshot } from '@src/editor/storage';
import type { Snapshot } from '@src/editor/types';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

export function generatedModel(snapshot: Snapshot) {
  return {
    surfaceId: snapshot.surfaceId,
    catalogId: snapshot.catalogId,
    sendDataModel: snapshot.sendDataModel,
    components: snapshot.components,
    dataModel: snapshot.dataModel,
  };
}

export function mustApply(doc: unknown): Snapshot {
  const result = applyDocument(JSON.stringify(doc), emptySnapshot());
  if (!result.ok) {
    throw new Error(result.message);
  }
  return result.snapshot;
}

export function normalizeGeneratedText(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

export async function renderGeneratedSurface(snapshot: Snapshot) {
  const processor = new MessageProcessor([antdCatalog], () => undefined);
  processor.processMessages(toMessages(snapshot) as never);
  const surface = Array.from(processor.model.surfacesMap.values())[0];
  if (!surface) {
    processor.model.dispose();
    throw new Error('没有可预览的页面');
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  await act(async () => {
    root.render(<A2uiSurface surface={surface} />);
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  return {
    container,
    text: normalizeGeneratedText(container.textContent),
    markup: generatedMarkup(container),
    async cleanup() {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      processor.model.dispose();
    },
  };
}

export function generatedMarkup(container: HTMLElement) {
  return {
    text: normalizeGeneratedText(container.textContent),
    media: [...container.querySelectorAll('img, video, audio, svg, hr')].map(
      (el) => ({
        tag: el.tagName.toLowerCase(),
        src: el.getAttribute('src'),
        alt: el.getAttribute('alt'),
        role: el.getAttribute('role'),
      }),
    ),
    tags: [...new Set([...container.querySelectorAll('*')].map((el) => el.tagName.toLowerCase()))].toSorted(),
  };
}
