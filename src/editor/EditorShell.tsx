import { Button, Layout, Modal, Space, Splitter, Switch, message } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { BottomDock } from './BottomDock';
import { useEditor } from './EditorState';
import { Inspector } from './Inspector';
import { PreviewPane } from './Preview';
import { Sidebar } from './Sidebar';
import { toMessages } from './snapshot';
import { loadLayout, saveLayout } from './storage';

export function EditorShell({
  theme,
  onThemeChange,
}: {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}) {
  const {
    snapshot,
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
  const fileRef = useRef<HTMLInputElement>(null);

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
      <Layout.Header className="editor-header">
        <span className="editor-mark">
          <span className="editor-wordmark">言灵</span>
          <span className="editor-seal" aria-hidden />
        </span>
        <Space size={16}>
          <Space>
            <Button size="small" onClick={() => fileRef.current?.click()}>
              打开
            </Button>
            <Button size="small" onClick={download}>
              下载
            </Button>
          </Space>
          <Space>
            <Button size="small" onClick={undo} disabled={!canUndo}>
              撤销
            </Button>
            <Button size="small" onClick={redo} disabled={!canRedo}>
              重做
            </Button>
            <Button size="small" onClick={confirmReset}>
              新建
            </Button>
          </Space>
          <Space>
            <span>深色</span>
            <Switch
              size="small"
              checked={theme === 'dark'}
              onChange={(checked) => onThemeChange(checked ? 'dark' : 'light')}
            />
          </Space>
        </Space>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
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
      <Splitter
        layout="vertical"
        className="editor-body"
        onResize={(sizes) => saveLayout(sizes)}
      >
        <Splitter.Panel>
          <Splitter>
            <Splitter.Panel defaultSize={360} min={240}>
              <Sidebar resetCount={resetCount} theme={theme} />
            </Splitter.Panel>
            <Splitter.Panel min={280}>
              <PreviewPane theme={theme} />
            </Splitter.Panel>
            <Splitter.Panel defaultSize={320} min={240}>
              <Inspector />
            </Splitter.Panel>
          </Splitter>
        </Splitter.Panel>
        <Splitter.Panel defaultSize={loadLayout()?.[1] ?? 280} min={160}>
          <BottomDock theme={theme} />
        </Splitter.Panel>
      </Splitter>
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
