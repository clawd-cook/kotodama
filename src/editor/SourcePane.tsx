import Editor from '@monaco-editor/react';
import { Alert, Button, message } from 'antd';
import { useEffect, useId, useRef } from 'react';
import { useEditor } from './EditorState';

const MONACO_JSON = {
  minimap: { enabled: false },
  fontSize: 13,
  lineHeight: 20,
  automaticLayout: true,
  padding: { top: 8, bottom: 8 },
  scrollBeyondLastLine: false,
};

export function SourcePane({
  theme,
  onClose,
}: {
  theme: 'light' | 'dark';
  onClose: () => void;
}) {
  const headingId = useId();
  const { jsonText, jsonError, applyJson, setJsonText } = useEditor();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
    return () => {
      if (timer.current) {
        window.clearTimeout(timer.current);
      }
    };
  }, []);

  const onJsonChange = (value?: string) => {
    const text = value ?? '';
    setJsonText(text);
    if (timer.current) {
      window.clearTimeout(timer.current);
    }
    timer.current = window.setTimeout(() => applyJson(text), 300);
  };

  const copy = () => {
    void navigator.clipboard.writeText(jsonText).then(() => {
      void message.success('已复制 JSON。');
    });
  };

  return (
    <section className="source-pane" aria-labelledby={headingId}>
      <div className="source-pane-head">
        <h2 id={headingId} className="studio-section-title" translate="no">
          JSON
        </h2>
        <div className="source-pane-actions">
          <Button type="text" size="small" onClick={copy}>
            复制
          </Button>
          <Button type="text" size="small" onClick={onClose}>
            收起
          </Button>
        </div>
      </div>
      {jsonError ? <Alert type="error" showIcon message={jsonError} /> : null}
      <div className="source-pane-editor">
        <Editor
          height="100%"
          defaultLanguage="json"
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          value={jsonText}
          onChange={onJsonChange}
          options={MONACO_JSON}
        />
      </div>
    </section>
  );
}

export function SourceStrip({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className="source-strip"
      aria-label="打开源文件"
      onClick={onOpen}
    >
      JSON
    </button>
  );
}
