import { extractA2uiMessages, parseChatOutput } from '@src/editor/chat/parseA2ui';
import { FALLBACK_SUMMARY } from '@src/editor/copy';
import { createDemoSnapshot } from '@src/editor/demo';
import { toMessages } from '@src/editor/snapshot';
import { describe, expect, it } from 'vitest';

const messages = toMessages(createDemoSnapshot());

describe('parseChatOutput', () => {
  it('reads an envelope with summary and messages', () => {
    const parsed = parseChatOutput(
      JSON.stringify({ summary: '已换成设置页。', messages }),
    );
    expect(parsed.summary).toBe('已换成设置页。');
    expect(parsed.messages).toHaveLength(3);
  });

  it('strips markdown fences around an envelope', () => {
    const parsed = parseChatOutput(
      `\`\`\`json\n${JSON.stringify({ summary: '好了', messages })}\n\`\`\``,
    );
    expect(parsed.summary).toBe('好了');
    expect(parsed.messages).toEqual(messages);
  });

  it('falls back when the model returns a bare array', () => {
    const parsed = parseChatOutput(JSON.stringify(messages));
    expect(parsed.summary).toBe(FALLBACK_SUMMARY);
    expect(parsed.messages).toHaveLength(3);
  });

  it('extracts a JSON array buried in prose', () => {
    const parsed = parseChatOutput(
      `好的，这是页面：\n${JSON.stringify(messages)}\n请预览。`,
    );
    expect(parsed.messages).toHaveLength(3);
  });

  it('treats a single message object as one-item messages', () => {
    const parsed = parseChatOutput(JSON.stringify(messages[0]));
    expect(parsed.messages).toEqual([messages[0]]);
  });
});

describe('extractA2uiMessages', () => {
  it('heals trailing commas on a JSONL line', () => {
    const line = '{"version":"v0.9","createSurface":{"surfaceId":"main",},}';
    expect(extractA2uiMessages(line)).toEqual([
      { version: 'v0.9', createSurface: { surfaceId: 'main' } },
    ]);
  });

  it('closes truncated objects on a JSONL line', () => {
    const line = '{"version":"v0.9","createSurface":{"surfaceId":"main"';
    expect(extractA2uiMessages(line)).toEqual([
      { version: 'v0.9', createSurface: { surfaceId: 'main' } },
    ]);
  });

  it('collects multiple JSONL objects', () => {
    const raw = [
      '{"version":"v0.9","createSurface":{"surfaceId":"main"}}',
      '{"version":"v0.9","updateDataModel":{"surfaceId":"main","path":"/","value":{"a":1}}}',
    ].join('\n');
    expect(extractA2uiMessages(raw)).toHaveLength(2);
  });

  it('throws when nothing looks like A2UI JSON', () => {
    expect(() => extractA2uiMessages('没有协议')).toThrow(
      '模型输出里没有解析到 A2UI JSON',
    );
  });
});
