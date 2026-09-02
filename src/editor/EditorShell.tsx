import { Button, Divider, Drawer, Layout, Modal, Space, Splitter, Switch, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BottomDock } from './BottomDock';
import { useEditor } from './EditorState';
import { Inspector } from './Inspector';
import { PreviewPane } from './Preview';
import { Sidebar } from './Sidebar';
import { toMessages } from './snapshot';
import { loadChromeLayout, saveChromeLayout } from './storage';

const SPEECH_MIN = 240;
const SPEECH_MAX = 320;
const DOCK_MIN = 160;
const DOCK_MAX = 480;
const DOCK_STRIP = 40;

export function EditorShell({
  theme,
  onThemeChange,
}: {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}) {
  const {
    snapshot,
    selectedId,
    setSelectedId,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    removeSelected,
    duplicateSelected,
    openJson,
  } = useEditor();
  const [resetCount, setResetCount] = useState(0);
  const [chrome, setChrome] = useState(loadChromeLayout);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const download = () => {
    const text = JSON.stringify(toMessages(snapshot), null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kotodama.json';
    link.click();
    URL.revokeObjectURL(url);
    void message.success('已下载 kotodama.json。');
  };

  const confirmReset = () => {
    Modal.confirm({
      title: '新建这一页？当前页会清掉。说话也会从头开始。',
      okText: '新建',
      cancelText: '留下',
      onOk: () => {
        reset();
        setResetCount((count) => count + 1);
      },
    });
  };

  return (
    <Layout className="editor-root" data-theme={theme}>
      <a className="skip-link" href="#sheet">
        跳到纸页
      </a>
      <Layout.Header className="editor-header">
        <span className="editor-mark">
          <span className="editor-seal" aria-hidden />
          <h1 className="editor-wordmark" translate="no">
            言灵
          </h1>
        </span>
        <Space size={4} split={<Divider type="vertical" />}>
          <Space size={0}>
            <Button type="text" size="small" onClick={() => fileRef.current?.click()}>
              打开
            </Button>
            <Button type="text" size="small" onClick={download}>
              下载
            </Button>
          </Space>
          <Space size={0}>
            <Button type="text" size="small" onClick={undo} disabled={!canUndo}>
              撤销
            </Button>
            <Button type="text" size="small" onClick={redo} disabled={!canRedo}>
              重做
            </Button>
            <Button type="text" size="small" onClick={confirmReset}>
              新建
            </Button>
          </Space>
          <label className="editor-theme">
            深色
            <Switch
              size="small"
              checked={theme === 'dark'}
              aria-label="深色"
              onChange={(checked) => onThemeChange(checked ? 'dark' : 'light')}
            />
          </label>
        </Space>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="打开 JSON"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) {
              return;
            }
            const text = await file.text();
            const error = openJson(text);
            if (error) {
              void message.error(error);
            }
          }}
        />
      </Layout.Header>
      <div className="editor-body">
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
              <PreviewPane theme={theme} />
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
    </Layout>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}
