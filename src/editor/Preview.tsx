import { A2uiSurface } from '@a2ui/react/v0_9';
import type { ReactComponentImplementation } from '@a2ui/react/v0_9';
import { MessageProcessor, type SurfaceModel } from '@a2ui/web_core/v0_9';
import { ConfigProvider, Empty, theme as antdTheme } from 'antd';
import { useEffect, useState } from 'react';
import { useEditor } from './EditorState';
import { toMessages } from './snapshot';
import { SelectionProvider, editorCatalog } from './wrapCatalog';

export function PreviewPane({ theme }: { theme: 'light' | 'dark' }) {
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
  const [dropClass, setDropClass] = useState('preview-sheet-drop');

  // biome-ignore lint/correctness/useExhaustiveDependencies: data model is synced in the following effect
  useEffect(() => {
    clearErrors('preview');
    clearErrors('protocol');
    setDropClass('preview-sheet-drop');
    const timer = window.setTimeout(() => setDropClass(''), 200);
    try {
      const processor = new MessageProcessor([editorCatalog], (action) => {
        logEvent(action);
      });
      processor.processMessages(toMessages(snapshot) as never);
      const next = Array.from(processor.model.surfacesMap.values())[0];
      if (!next) {
        setSurface(null);
        logError('没有可预览的页面', 'protocol');
        processor.model.dispose();
        return () => window.clearTimeout(timer);
      }
      const sub = next.dataModel.subscribe('/', (value) => {
        syncDataModelFromPreview(value ?? {});
      });
      setSurface(next);
      return () => {
        window.clearTimeout(timer);
        sub.unsubscribe();
        processor.model.dispose();
      };
    } catch (error) {
      setSurface(null);
      logError(
        error instanceof Error ? error.message : String(error),
        'preview',
      );
      return () => window.clearTimeout(timer);
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
        <ConfigProvider
          theme={{
            algorithm:
              theme === 'dark'
                ? antdTheme.darkAlgorithm
                : antdTheme.defaultAlgorithm,
            token: { ...antdTheme.defaultSeed },
          }}
        >
          <div className={`preview-sheet ${dropClass}`.trim()}>
            {surface ? (
              <A2uiSurface surface={surface} />
            ) : (
              <Empty description="没有可预览的页面" />
            )}
          </div>
        </ConfigProvider>
      </div>
    </SelectionProvider>
  );
}
