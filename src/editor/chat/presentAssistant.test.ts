import { describe, expect, it } from 'vitest';
import { applyDocument } from '../applyDocument';
import { STREAMING_PLACEHOLDER } from '../copy';
import { createDemoSnapshot } from '../demo';
import { toMessages } from '../snapshot';
import type { A2uiMessage } from '../types';
import { parseChatOutput } from './parseA2ui';
import { presentAssistant } from './presentAssistant';

function validMessages(): A2uiMessage[] {
  return toMessages(createDemoSnapshot());
}

function applyRaw(raw: string) {
  const parsed = parseChatOutput(raw);
  const result = applyDocument(
    JSON.stringify(parsed.messages),
    createDemoSnapshot(),
  );
  return { result, shown: presentAssistant(raw, result) };
}

describe('P chat present', () => {
  it('P-01 envelope success shows only the summary', () => {
    const raw = JSON.stringify({
      summary: '已改成带验证码的登录表单。',
      messages: validMessages(),
    });
    const { result, shown } = applyRaw(raw);
    expect(result.ok).toBe(true);
    expect(shown).toBe('已改成带验证码的登录表单。');
    expect(shown).not.toContain('createSurface');
    expect(shown).not.toContain('updateComponents');
    expect(shown).not.toContain('updateDataModel');
  });

  it('P-02 apply failure shows the design failure sentence', () => {
    const messages = structuredClone(validMessages());
    const update = messages.find((item) => item.updateComponents);
    const target = update?.updateComponents?.components.find(
      (item) => item.component === 'Text',
    );
    if (target) {
      target.component = 'Table';
    }
    const raw = JSON.stringify({
      summary: '已生成表格。',
      messages,
    });
    const { result, shown } = applyRaw(raw);
    expect(result.ok).toBe(false);
    expect(shown.startsWith('页面没改。')).toBe(true);
    expect(shown).toContain('Table');
    expect(shown).not.toContain('createSurface');
    expect(shown).not.toContain('已生成表格。');
  });

  it('P-03 bare array falls back to the fixed summary', () => {
    const raw = JSON.stringify(validMessages());
    const { result, shown } = applyRaw(raw);
    expect(result.ok).toBe(true);
    expect(shown).toBe('已更新界面。');
    expect(shown).not.toContain('createSurface');
  });

  it('P-04 fenced JSON still applies and hides protocol', () => {
    const raw = `\`\`\`json\n${JSON.stringify(validMessages())}\n\`\`\``;
    const { result, shown } = applyRaw(raw);
    expect(result.ok).toBe(true);
    expect(shown).toBe('已更新界面。');
    expect(shown).not.toContain('```');
    expect(shown).not.toContain('createSurface');
  });

  it('P-05 streaming placeholder is not protocol', () => {
    expect(STREAMING_PLACEHOLDER).toBe('正在写下这一页…');
  });
});
