import { useEffect } from 'react';
import { useEditor } from './EditorState';
import { PaperPreview } from './PaperPreview';
import { editorCatalog, SelectionProvider } from './wrapCatalog';

export function PreviewPane({
  theme,
  sheetId = 'sheet',
}: {
  theme: 'light' | 'dark';
  sheetId?: string;
}) {
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
  const empty = snapshot.components.length === 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: clear stale errors when the surface snapshot changes
  useEffect(() => {
    clearErrors('preview');
    clearErrors('protocol');
  }, [
    clearErrors,
    snapshot.catalogId,
    snapshot.components,
    snapshot.surfaceId,
  ]);

  return (
    <SelectionProvider
      value={{
        selectedId,
        hoveredId,
        onSelect: setSelectedId,
        onHover: setHoveredId,
      }}
    >
      <PaperPreview
        snapshot={snapshot}
        theme={theme}
        catalog={editorCatalog}
        drop
        flush
        interactive
        sheetId={sheetId}
        onEvent={logEvent}
        onDataModel={syncDataModelFromPreview}
        onSelectNone={() => setSelectedId(null)}
        onError={
          empty
            ? undefined
            : (message) => {
                logError(
                  message,
                  message === '没有可预览的页面' ? 'protocol' : 'preview',
                );
              }
        }
      />
    </SelectionProvider>
  );
}
