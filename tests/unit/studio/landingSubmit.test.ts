import { landingSubmit, PROMPT_ITEMS } from '@src/studio/landingSubmit';
import { describe, expect, it } from 'vitest';

describe('L landing submit', () => {
  it('L-01 ready auto-sends; not ready prefills', () => {
    expect(landingSubmit('做一个登录表单', true)).toEqual({
      autoSend: '做一个登录表单',
    });
    expect(landingSubmit('做一个登录表单', false)).toEqual({
      prefill: '做一个登录表单',
    });
  });

  it('L-02 landing prompts match workshop empty state', () => {
    expect(PROMPT_ITEMS.map((item) => item.label)).toEqual([
      '做一个登录表单',
      '做一个设置页',
      '做一个带筛选的列表',
    ]);
  });
});
