import { Button, Form, Input, message, Typography } from 'antd';
import { useState } from 'react';
import { useChannel } from './ChannelContext';
import type { ChannelFields } from './channel';

function sourceLabel(uiValue: string): string {
  return uiValue.trim() === '' ? '当前用环境变量' : '当前用界面';
}

export function SettingsPage() {
  const { ui, save } = useChannel();
  const [fields, setFields] = useState<ChannelFields>(ui);

  const setField = (key: keyof ChannelFields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
  };

  const onSave = () => {
    const result = save(fields);
    if (result === 'cleared') {
      void message.success('已清空。下次对话用环境变量。');
      return;
    }
    void message.success('已保存。后续对话用这组通道。');
  };

  return (
    <main className="settings-desk">
      <div className="settings-sheet">
        <h1 className="studio-title">设置</h1>
        <Typography.Paragraph type="secondary">
          这三项只存在这台浏览器里。空着则用环境变量。
        </Typography.Paragraph>
        <Form id="channel-form" layout="vertical" onFinish={onSave}>
          <Form.Item
            label="Base URL"
            extra={
              <span className="settings-source">
                {sourceLabel(fields.baseUrl)}
              </span>
            }
          >
            <Input
              value={fields.baseUrl}
              placeholder="对应 OPENAI_BASE_URL"
              onChange={(event) => setField('baseUrl', event.target.value)}
            />
          </Form.Item>
          <Form.Item
            label="API Key"
            extra={
              <span className="settings-source">
                {sourceLabel(fields.apiKey)}
              </span>
            }
          >
            <Input.Password
              value={fields.apiKey}
              placeholder="对应 OPENAI_API_KEY"
              visibilityToggle
              onChange={(event) => setField('apiKey', event.target.value)}
            />
          </Form.Item>
          <Form.Item
            label="模型名"
            extra={
              <span className="settings-source">
                {sourceLabel(fields.model)}
              </span>
            }
          >
            <Input
              value={fields.model}
              placeholder="对应 OPENAI_MODEL"
              onChange={(event) => setField('model', event.target.value)}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            保存
          </Button>
        </Form>
      </div>
    </main>
  );
}
