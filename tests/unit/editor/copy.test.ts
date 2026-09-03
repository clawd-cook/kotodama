import {
  ACTION_RECORDED,
  actionToastText,
  CHANNEL_UNREADY,
  FALLBACK_SUMMARY,
  openFailed,
  pageUnchanged,
  STREAMING_PLACEHOLDER,
  trimReason,
} from '@src/editor/copy';
import { describe, expect, it } from 'vitest';

describe('copy', () => {
  it('includes the event name', () => {
    expect(actionToastText({ name: 'item1_confirm_button' })).toBe(
      '已记下事件：item1_confirm_button',
    );
  });

  it('falls back when the payload has no name', () => {
    expect(actionToastText({})).toBe(ACTION_RECORDED);
    expect(actionToastText(null)).toBe(ACTION_RECORDED);
    expect(actionToastText({ name: '' })).toBe(ACTION_RECORDED);
    expect(actionToastText({ name: 12 })).toBe(ACTION_RECORDED);
  });

  it('trims leading and trailing punctuation from reasons', () => {
    expect(trimReason('。不是合法的 JSON。')).toBe('不是合法的 JSON');
    expect(trimReason('  missing root. ')).toBe('missing root');
  });

  it('wraps apply failures as page-unchanged sentences', () => {
    expect(pageUnchanged('缺少 id 为 root 的根组件。')).toBe(
      '页面没改。缺少 id 为 root 的根组件。',
    );
  });

  it('wraps open failures', () => {
    expect(openFailed('不是合法的 JSON。')).toBe('没有打开。不是合法的 JSON。');
  });

  it('keeps the streaming and channel copy fixed', () => {
    expect(STREAMING_PLACEHOLDER).toBe('正在写下这一页…');
    expect(FALLBACK_SUMMARY).toBe('已更新界面。');
    expect(CHANNEL_UNREADY).toContain('通道没配好');
  });
});
