import { Drawer, Splitter } from 'antd';
import { useEffect, useState } from 'react';
import { BottomDock } from './BottomDock';
import { useEditor } from './EditorState';
import { Inspector } from './Inspector';
import { PreviewPane } from './Preview';
import { Sidebar } from './Sidebar';
import { loadChromeLayout, saveChromeLayout } from './storage';

const SPEECH_MIN = 240;
const SPEECH_MAX = 320;
const DOCK_MIN = 160;
const DOCK_MAX = 480;
const DOCK_STRIP = 40;

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
        className="editor-stage-split"
        onResizeEnd={(sizes) => {
          const next = sizes[0];
          if (typeof next !== 'number') {
            return;
          }
          setChrome((current) => ({
            ...current,
            speech: Math.min(
              SPEECH_MAX,
              Math.max(SPEECH_MIN, Math.round(next)),
            ),
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
        </Splitter.Panel>
      </Splitter>
      <div
        className={chrome.dockOpen ? 'editor-dock is-open' : 'editor-dock'}
        style={{
          height: chrome.dockOpen ? chrome.dockSize : DOCK_STRIP,
        }}
      >
        {chrome.dockOpen ? (
          <button
            type="button"
            className="editor-dock-handle"
            aria-label="调整源文件条高度"
            onPointerDown={(event) => {
              event.preventDefault();
              const handle = event.currentTarget;
              handle.setPointerCapture(event.pointerId);
              const startY = event.clientY;
              const start = chrome.dockSize;
              const onMove = (move: PointerEvent) => {
                const next = Math.min(
                  DOCK_MAX,
                  Math.max(DOCK_MIN, start + (startY - move.clientY)),
                );
                setChrome((current) => ({
                  ...current,
                  dockSize: Math.round(next),
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
          open={chrome.dockOpen}
          size={chrome.dockSize}
          onOpen={() =>
            setChrome((current) => ({ ...current, dockOpen: true }))
          }
          onClose={() =>
            setChrome((current) => ({ ...current, dockOpen: false }))
          }
        />
      </div>
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
