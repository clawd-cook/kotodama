import { A2uiSurface } from '@a2ui/react/v0_9';
import type { ReactComponentImplementation } from '@a2ui/react/v0_9';
import { MessageProcessor, type SurfaceModel } from '@a2ui/web_core/v0_9';
import { Empty } from 'antd';
import { useEffect, useState } from 'react';
import { useEditor } from './EditorState';
import { toMessages } from './snapshot';
import { SelectionProvider, editorCatalog } from './wrapCatalog';

export function PreviewPane() {
  const {
    snapshot,
    selectedId,
    hoveredId,
    setSelectedId,
    setHoveredId,
    logEvent,
    logError,
    clearErrors,
    syncDataModelFromPreview,
  } = useEditor();
  const [surface, setSurface] =
    useState<SurfaceModel<ReactComponentImplementation> | null>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: data model is synced in the following effect
  useEffect(() => {
    clearErrors('preview');
    clearErrors('protocol');
    try {
      const processor = new MessageProcessor([editorCatalog], (action) => {
        logEvent(action);
      });
      processor.processMessages(toMessages(snapshot) as never);
      const surfaces = Array.from(processor.model.surfacesMap.values());
      if (surfaces.length > 1) {
        logError('只渲染第一个 surface，其余已忽略', 'protocol');
      }
      const next = surfaces[0];
      if (!next) {
        setSurface(null);
        logError('没有可渲染的 surface', 'protocol');
        processor.model.dispose();
        return;
      }
      const sub = next.dataModel.subscribe('/', (value) => {
        syncDataModelFromPreview(value ?? {});
      });
      setSurface(next);
      return () => {
        sub.unsubscribe();
        processor.model.dispose();
      };
    } catch (error) {
      setSurface(null);
      logError(
        error instanceof Error ? error.message : String(error),
        'preview',
      );
      return undefined;
    }
  }, [snapshot.components, snapshot.surfaceId, snapshot.catalogId]);

  useEffect(() => {
    if (!surface) {
      return;
    }
    const current = surface.dataModel.get('/');
    if (JSON.stringify(current) !== JSON.stringify(snapshot.dataModel)) {
      surface.dataModel.set('/', snapshot.dataModel ?? {});
    }
  }, [snapshot.dataModel, surface]);

  return (
    <SelectionProvider
      value={{
        selectedId,
        hoveredId,
        onSelect: setSelectedId,
        onHover: setHoveredId,
      }}
    >
      <div
        className="preview-canvas"
        tabIndex={-1}
        onClick={() => setSelectedId(null)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setSelectedId(null);
          }
        }}
      >
        {surface ? (
          <A2uiSurface surface={surface} />
        ) : (
          <Empty description="无法预览" />
        )}
      </div>
    </SelectionProvider>
  );
}
