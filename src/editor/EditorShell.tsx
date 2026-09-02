import { Button, Layout, Space, Splitter, Switch, Typography } from 'antd';
import { useEffect } from 'react';
import { BottomDock } from './BottomDock';
import { useEditor } from './EditorState';
import { Inspector } from './Inspector';
import { PreviewPane } from './Preview';
import { Sidebar } from './Sidebar';
import { loadLayout, saveLayout } from './storage';

export function EditorShell({
  theme,
  onThemeChange,
}: {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}) {
  const {
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    removeSelected,
    duplicateSelected,
  } = useEditor();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if (
        (event.key === 'Delete' || event.key === 'Backspace') &&
        !isTypingTarget(event.target)
      ) {
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
    <Layout className="editor-root">
      <Layout.Header className="editor-header">
        <Typography.Title level={4} style={{ margin: 0, color: 'inherit' }}>
          言灵
        </Typography.Title>
        <Space>
          <Button size="small" onClick={undo} disabled={!canUndo}>
            撤销
          </Button>
          <Button size="small" onClick={redo} disabled={!canRedo}>
            重做
          </Button>
          <Button size="small" onClick={reset}>
            新建
          </Button>
          <span>暗色</span>
          <Switch
            size="small"
            checked={theme === 'dark'}
            onChange={(checked) => onThemeChange(checked ? 'dark' : 'light')}
          />
        </Space>
      </Layout.Header>
      <Splitter
        layout="vertical"
        className="editor-body"
        onResize={(sizes) => saveLayout(sizes)}
      >
        <Splitter.Panel>
          <Splitter>
            <Splitter.Panel defaultSize={260} min={200}>
              <Sidebar />
            </Splitter.Panel>
            <Splitter.Panel min={280}>
              <PreviewPane />
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
