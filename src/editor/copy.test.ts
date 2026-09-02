import { describe, expect, it } from 'vitest';
import { ACTION_RECORDED, actionToastText } from './copy';

describe('actionToastText', () => {
  it('includes the event name', () => {
    expect(actionToastText({ name: 'item1_confirm_button' })).toBe(
      '已记下事件：item1_confirm_button',
    );
  });

  it('falls back when the payload has no name', () => {
    expect(actionToastText({})).toBe(ACTION_RECORDED);
    expect(actionToastText(null)).toBe(ACTION_RECORDED);
  });
});
