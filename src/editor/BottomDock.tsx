import Editor from '@monaco-editor/react';
import { Alert, Button, Tabs } from 'antd';
import { useEffect, useState } from 'react';
import { useEditor } from './EditorState';

const MONACO_JSON = {
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: 20,
  automaticLayout: true,
  padding: { top: 8, bottom: 8 },
  scrollBeyondLastLine: false,
};

export function BottomDock({
  theme,
  open,
  size,
  onOpen,
  onClose,
}: {
  theme: 'light' | 'dark';
  open: boolean;
  size: number;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { snapshot, setDataModel, events, errors } = useEditor();
  const [activeKey, setActiveKey] = useState('data');

  useEffect(() => {
    if (!open) {
      return;
    }
    window.dispatchEvent(new Event('resize'));
  }, [open]);

  const dataText = JSON.stringify(snapshot.dataModel ?? {}, null, 2);
  const editorHeight = Math.max(96, size - 48);

  return (
    <Tabs
      size="small"
      className="bottom-dock"
      activeKey={activeKey}
      onTabClick={(key) => {
        setActiveKey(key);
        if (!open) {
          onOpen();
        }
      }}
      tabBarExtraContent={
        open ? (
          <Button size="small" type="text" onClick={onClose}>
            收起
          </Button>
        ) : null
      }
      items={[
        {
          key: 'data',
          label: '数据',
          children: (
            <div className="dock-pane">
              <Editor
                height={editorHeight}
                defaultLanguage="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={dataText}
                onChange={(value) => {
                  try {
                    setDataModel(JSON.parse(value || '{}'));
                  } catch {
                    /* ignore until valid */
                  }
                }}
                options={MONACO_JSON}
              />
            </div>
          ),
        },
        {
          key: 'events',
          label: `事件${events.length ? ` (${events.length})` : ''}`,
          children: (
            <div className="dock-pane">
              <pre className="dock-log">
                {events.length === 0
                  ? '还没有事件。在纸页上点一下就会出现。'
                  : JSON.stringify(events, null, 2)}
              </pre>
            </div>
          ),
        },
        {
          key: 'errors',
          label: `错误${errors.length ? ` (${errors.length})` : ''}`,
          children: (
            <div className="dock-pane">
              {errors.length === 0 ? (
                <pre className="dock-log">没有错误。</pre>
              ) : (
                errors.map((item) => (
                  <Alert
                    key={item.id}
                    type="error"
                    showIcon
                    message={item.message}
                  />
                ))
              )}
            </div>
          ),
        },
      ]}
    />
  );
}
