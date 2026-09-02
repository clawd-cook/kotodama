import Editor from '@monaco-editor/react';
import { Alert, Button, Tabs } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useEditor } from './EditorState';

export function BottomDock({
  theme,
  open,
  onOpen,
  onClose,
}: {
  theme: 'light' | 'dark';
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const {
    jsonText,
    jsonError,
    applyJson,
    setJsonText,
    snapshot,
    setDataModel,
    events,
    errors,
  } = useEditor();
  const timer = useRef<number | undefined>(undefined);
  const [activeKey, setActiveKey] = useState('json');

  useEffect(() => {
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }
    window.dispatchEvent(new Event('resize'));
  }, [open]);

  const onJsonChange = (value?: string) => {
    const text = value ?? '';
    setJsonText(text);
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => applyJson(text), 300);
  };

  const dataText = JSON.stringify(snapshot.dataModel ?? {}, null, 2);

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
          key: 'json',
          label: 'JSON',
          children: (
            <div className="dock-pane">
              {jsonError ? (
                <Alert type="error" showIcon message={jsonError} />
              ) : null}
              <Editor
                height="100%"
                defaultLanguage="json"
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                value={jsonText}
                onChange={onJsonChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  automaticLayout: true,
                }}
              />
            </div>
          ),
        },
        {
          key: 'data',
          label: '数据',
          children: (
            <div className="dock-pane">
              <Editor
                height="100%"
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
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  automaticLayout: true,
                }}
              />
            </div>
          ),
        },
        {
          key: 'events',
          label: `事件${events.length ? ` (${events.length})` : ''}`,
          children: (
            <pre className="dock-log">
              {events.length === 0
                ? '还没有事件。在纸页上点一下就会出现。'
                : JSON.stringify(events, null, 2)}
            </pre>
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
