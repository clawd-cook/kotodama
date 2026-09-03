import type { ReactComponentImplementation } from '@a2ui/react/v0_9';
import { A2uiSurface } from '@a2ui/react/v0_9';
import {
  type Catalog,
  MessageProcessor,
  type SurfaceModel,
} from '@a2ui/web_core/v0_9';
import { theme as antdTheme, ConfigProvider, Empty, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { actionToastText } from '../editor/copy';
import { toMessages } from '../editor/snapshot';
import type { Snapshot } from '../editor/types';
import './paper.css';

export function PaperPreview({
  snapshot,
  theme,
  catalog,
  drop = false,
  flush = false,
  interactive = false,
  sheetId,
  className,
  onEvent,
  onDataModel,
  onError,
  onSelectNone,
}: {
  snapshot: Snapshot;
  theme: 'light' | 'dark';
  catalog: Catalog<ReactComponentImplementation>;
  drop?: boolean;
  flush?: boolean;
  interactive?: boolean;
  sheetId?: string;
  className?: string;
  onEvent?: (action: unknown) => void;
  onDataModel?: (value: unknown) => void;
  onError?: (message: string) => void;
  onSelectNone?: () => void;
}) {
  const [surface, setSurface] =
    useState<SurfaceModel<ReactComponentImplementation> | null>(null);
  const [dropClass, setDropClass] = useState(drop ? 'preview-sheet-drop' : '');
  const empty = snapshot.components.length === 0;
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;
  const toastEvents = Boolean(interactive || onEvent);
  const toastEventsRef = useRef(toastEvents);
  toastEventsRef.current = toastEvents;

  // biome-ignore lint/correctness/useExhaustiveDependencies: data model is synced in the following effect
  useEffect(() => {
    if (drop) {
      setDropClass('preview-sheet-drop');
    }
    const timer = window.setTimeout(() => setDropClass(''), 200);
    if (empty) {
      setSurface(null);
      return () => window.clearTimeout(timer);
    }
    try {
      const processor = new MessageProcessor([catalog], (action) => {
        onEventRef.current?.(action);
        if (toastEventsRef.current) {
          void message.info(actionToastText(action));
        }
      });
      processor.processMessages(toMessages(snapshot) as never);
      const next = Array.from(processor.model.surfacesMap.values())[0];
      if (!next) {
        setSurface(null);
        onError?.('没有可预览的页面');
        processor.model.dispose();
        return () => window.clearTimeout(timer);
      }
      const sub = next.dataModel.subscribe('/', (value) => {
        onDataModel?.(value ?? {});
      });
      setSurface(next);
      return () => {
        window.clearTimeout(timer);
        sub.unsubscribe();
        processor.model.dispose();
      };
    } catch (error) {
      setSurface(null);
      onError?.(error instanceof Error ? error.message : String(error));
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
    // biome-ignore lint/a11y/noStaticElementInteractions: click and Escape clear the editor selection
    <div
      id={sheetId}
      className={[
        'preview-canvas',
        flush ? 'is-flush' : '',
        empty ? 'is-empty' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      tabIndex={-1}
      onClick={
        interactive
          ? () => {
              onSelectNone?.();
            }
          : undefined
      }
      onKeyDown={
        interactive
          ? (event) => {
              if (event.key === 'Escape') {
                onSelectNone?.();
              }
            }
          : undefined
      }
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
        <div className="preview-sheet-frame">
          <div className={`preview-sheet ${dropClass}`.trim()}>
            {surface ? (
              <A2uiSurface surface={surface} />
            ) : (
              <Empty description="没有可预览的页面" />
            )}
          </div>
        </div>
      </ConfigProvider>
    </div>
  );
}
