import { Button, message } from 'antd';
import { useId } from 'react';

export function JsonWell({ text }: { text: string }) {
  const headingId = useId();
  const copy = () => {
    void navigator.clipboard.writeText(text).then(() => {
      void message.success('已复制 JSON。');
    });
  };

  return (
    <section className="json-well" aria-labelledby={headingId}>
      <div className="json-well-head">
        <h2 id={headingId} className="studio-section-title">
          JSON
        </h2>
        <Button type="text" size="small" onClick={copy}>
          复制
        </Button>
      </div>
      <pre className="json-well-body">{text}</pre>
    </section>
  );
}
