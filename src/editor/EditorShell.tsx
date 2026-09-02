import { Drawer, Splitter } from 'antd';
import { useEffect, useState } from 'react';
import { BottomDock } from './BottomDock';
import { useEditor } from './EditorState';
import { Inspector } from './Inspector';
import { PreviewPane } from './Preview';
import { Sidebar } from './Sidebar';
import { SourcePane, SourceStrip } from './SourcePane';
import {
  loadChromeLayout,
  saveChromeLayout,
  SOURCE_MAX,
  SOURCE_MIN,
  SOURCE_STRIP,
  SPEECH_MAX,
  SPEECH_MIN,
  TRACE_MAX,
  TRACE_MIN,
  TRACE_STRIP,
} from './storage';

export function EditorShell({
  theme,
  resetCount,
  sheetId,
}: {
  theme: 'light' | 'dark';
  resetCount: number;
  sheetId?: string;
}) {
  const {
    selectedId,
    setSelectedId,
    undo,
    redo,
    duplicateSelected,
    removeSelected,
  } = useEditor();
  const [chrome, setChrome] = useState(loadChromeLayout);

  useEffect(() => {
    saveChromeLayout(chrome);
  }, [chrome]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) {
        return;
      }
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        removeSelected();
      }
      if (meta && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelected();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [duplicateSelected, redo, removeSelected, undo]);

  return (
    <div className="editor-body">
      <h1 className="studio-visually-hidden">工坊</h1>
      <Splitter
        key={chrome.sourceOpen ? 'source-open' : 'source-shut'}
        className="editor-stage-split"
        onResizeEnd={(sizes) => {
          const speech = sizes[0];
          const source = sizes[2];
          setChrome((current) => ({
            ...current,
            speech:
              typeof speech === 'number'
                ? Math.min(SPEECH_MAX, Math.max(SPEECH_MIN, Math.round(speech)))
                : current.speech,
            source:
              current.sourceOpen &&
              typeof source === 'number' &&
              source >= SOURCE_MIN
                ? Math.min(SOURCE_MAX, Math.max(SOURCE_MIN, Math.round(source)))
                : current.source,
          }));
        }}
      >
        <Splitter.Panel
          defaultSize={chrome.speech}
          min={SPEECH_MIN}
          max={SPEECH_MAX}
        >
          <Sidebar resetCount={resetCount} theme={theme} />
        </Splitter.Panel>
        <Splitter.Panel min={280}>
          <div className="editor-stage">
            <div className="editor-preview">
              <PreviewPane theme={theme} sheetId={sheetId} />
              <Drawer
                title="属性"
                placement="right"
                width={280}
                open={Boolean(selectedId)}
                onClose={() => setSelectedId(null)}
                mask={false}
                getContainer={false}
                rootClassName="inspector-drawer"
                zIndex={30}
                styles={{
                  body: { padding: 16, overflow: 'auto' },
                }}
              >
                <Inspector />
              </Drawer>
            </div>
            <div
              className={
                chrome.traceOpen ? 'editor-trace is-open' : 'editor-trace'
              }
              style={{
                height: chrome.traceOpen ? chrome.traceSize : TRACE_STRIP,
              }}
            >
              {chrome.traceOpen ? (
                <button
                  type="button"
                  className="editor-trace-handle"
                  aria-label="调整记录条高度"
                  onPointerDown={(event) => {
                    event.preventDefault();
                    const handle = event.currentTarget;
                    handle.setPointerCapture(event.pointerId);
                    const startY = event.clientY;
                    const start = chrome.traceSize;
                    const onMove = (move: PointerEvent) => {
                      const next = Math.min(
                        TRACE_MAX,
                        Math.max(TRACE_MIN, start + (startY - move.clientY)),
                      );
                      setChrome((current) => ({
                        ...current,
                        traceSize: Math.round(next),
                      }));
                    };
                    const onUp = () => {
                      handle.releasePointerCapture(event.pointerId);
                      handle.removeEventListener('pointermove', onMove);
                      handle.removeEventListener('pointerup', onUp);
                    };
                    handle.addEventListener('pointermove', onMove);
                    handle.addEventListener('pointerup', onUp);
                  }}
                />
              ) : null}
              <BottomDock
                theme={theme}
                open={chrome.traceOpen}
                size={chrome.traceSize}
                onOpen={() =>
                  setChrome((current) => ({ ...current, traceOpen: true }))
                }
                onClose={() =>
                  setChrome((current) => ({ ...current, traceOpen: false }))
                }
              />
            </div>
          </div>
        </Splitter.Panel>
        {chrome.sourceOpen ? (
          <Splitter.Panel
            defaultSize={chrome.source}
            min={SOURCE_MIN}
            max={SOURCE_MAX}
          >
            <SourcePane
              theme={theme}
              onClose={() =>
                setChrome((current) => ({ ...current, sourceOpen: false }))
              }
            />
          </Splitter.Panel>
        ) : (
          <Splitter.Panel
            defaultSize={SOURCE_STRIP}
            min={SOURCE_STRIP}
            max={SOURCE_STRIP}
            resizable={false}
          >
            <SourceStrip
              onOpen={() =>
                setChrome((current) => ({ ...current, sourceOpen: true }))
              }
            />
          </Splitter.Panel>
        )}
      </Splitter>
    </div>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}
