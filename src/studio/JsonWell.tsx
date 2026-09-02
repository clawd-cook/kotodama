import { Button, message } from 'antd';

export function JsonWell({ text }: { text: string }) {
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      void message.success('已复制 JSON。');
    });
  };

  return (
    <div className="json-well">
      <div className="json-well-bar">
        <span>JSON</span>
        <Button type="text" size="small" onClick={copy}>
          复制
        </Button>
      </div>
      <pre className="json-well-body">{text}</pre>
    </div>
  );
}
