import { Button, Modal, message, Space } from 'antd';
import { useRef } from 'react';
import { useEditor } from './EditorState';
import { toMessages } from './snapshot';
import { isCurrentPage } from './storage';

export function WorkshopFileActions() {
  const { snapshot, openJson } = useEditor();
  const fileRef = useRef<HTMLInputElement>(null);
  const current = isCurrentPage(snapshot);

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

  return (
    <Space size={0}>
      <Button type="text" size="small" onClick={() => fileRef.current?.click()}>
        打开
      </Button>
      <Button type="text" size="small" onClick={download} disabled={!current}>
        下载
      </Button>
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
    </Space>
  );
}

export function WorkshopHistoryActions({
  onAfterReset,
}: {
  onAfterReset: () => void;
}) {
  const { undo, redo, reset, canUndo, canRedo } = useEditor();

  const confirmReset = () => {
    Modal.confirm({
      title: '新建这一页？当前页会清掉。说话也会从头开始。',
      okText: '新建',
      cancelText: '留下',
      onOk: () => {
        reset();
        onAfterReset();
      },
    });
  };

  return (
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
  );
}
