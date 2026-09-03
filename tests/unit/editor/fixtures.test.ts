import { applyDocument } from '@src/editor/applyDocument';
import { createDemoSnapshot } from '@src/editor/demo';
import loginOtp from '@src/editor/fixtures/login-otp.json';
import filteredList from '@src/studio/examples/fixtures/filtered-list.json';
import login from '@src/studio/examples/fixtures/login.json';
import settings from '@src/studio/examples/fixtures/settings.json';
import { toMessages } from '@src/editor/snapshot';
import { emptySnapshot } from '@src/editor/storage';
import { resolveChannel } from '@src/studio/channel';
import { describe, expect, it } from 'vitest';
import {
  applyFixture,
  componentsOf,
  dataText,
  roundTrip,
} from '../../helpers/apply';

describe('F golden fixtures', () => {
  it('F-01 login fixture is a valid page', () => {
    const result = applyFixture(login);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(dataText(result.snapshot)).toContain('登录');
    expect(
      componentsOf(result.snapshot).some(
        (item) => item.component === 'TextField' && item.variant === 'obscured',
      ),
    ).toBe(true);
    expect(
      componentsOf(result.snapshot).some(
        (item) => item.component === 'Button' && item.variant === 'primary',
      ),
    ).toBe(true);
    expect(
      componentsOf(result.snapshot).some((item) => {
        const value = item.value as { path?: string } | undefined;
        return Boolean(value?.path?.startsWith('/'));
      }),
    ).toBe(true);
  });

  it('F-02 settings fixture is a valid page', () => {
    const result = applyFixture(settings);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(dataText(result.snapshot)).toContain('设置');
    const types = new Set(
      componentsOf(result.snapshot).map((item) => item.component),
    );
    expect(types.has('Column') && types.has('Card')).toBe(true);
    const inputs = componentsOf(result.snapshot).filter(
      (item) => item.component === 'TextField' || item.component === 'CheckBox',
    );
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it('F-03 filtered-list fixture is a valid page', () => {
    const result = applyFixture(filteredList);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const picker = componentsOf(result.snapshot).find(
      (item) => item.component === 'ChoicePicker',
    );
    expect(picker).toBeTruthy();
    expect(
      componentsOf(result.snapshot).some((item) => item.component === 'List'),
    ).toBe(true);
    const options = picker?.options as { label?: string }[] | undefined;
    expect((options ?? []).length).toBeGreaterThanOrEqual(2);
    expect((options ?? []).some((item) => item.label === '全部')).toBe(true);
  });

  it('F-04 revised login still valid', () => {
    const result = applyFixture(loginOtp);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const blob = JSON.stringify(result.snapshot);
    expect(blob.includes('验证码') || blob.includes('/otp')).toBe(true);
    expect(
      componentsOf(result.snapshot).some(
        (item) => item.component === 'TextField' && item.variant === 'obscured',
      ),
    ).toBe(true);
  });
});

describe('C fixture round-trip', () => {
  it('C-02 login fixture round-trip', () => {
    const result = roundTrip(login);
    if (!result.ok) {
      return;
    }
    expect((result.snapshot.dataModel as { title?: string }).title).toBe(
      '登录',
    );
    expect((result.snapshot.dataModel as { password?: string }).password).toBe(
      '',
    );
    expect(
      componentsOf(result.snapshot).some(
        (item) => item.component === 'TextField' && item.variant === 'obscured',
      ),
    ).toBe(true);
    expect(
      componentsOf(result.snapshot).some(
        (item) => item.component === 'Button' && item.variant === 'primary',
      ),
    ).toBe(true);
  });

  it('C-03 settings fixture round-trip', () => {
    const result = roundTrip(settings);
    if (!result.ok) {
      return;
    }
    expect((result.snapshot.dataModel as { title?: string }).title).toBe(
      '设置',
    );
    const types = new Set(
      componentsOf(result.snapshot).map((item) => item.component),
    );
    expect(types.has('Column') && types.has('Card')).toBe(true);
  });

  it('C-04 filtered-list fixture round-trip', () => {
    const result = roundTrip(filteredList);
    if (!result.ok) {
      return;
    }
    expect(
      componentsOf(result.snapshot).some(
        (item) => item.component === 'ChoicePicker',
      ),
    ).toBe(true);
    expect(
      componentsOf(result.snapshot).some((item) => item.component === 'List'),
    ).toBe(true);
    expect((result.snapshot.dataModel as { filter?: string[] }).filter).toEqual(
      ['all'],
    );
    expect((result.snapshot.dataModel as { itemOne?: string }).itemOne).toBe(
      '整理登录页',
    );
  });

  it('C-05 downloaded source does not contain the API key', () => {
    const applied = applyDocument(JSON.stringify(login), emptySnapshot());
    expect(applied.ok).toBe(true);
    if (!applied.ok) {
      return;
    }
    const resolved = resolveChannel(
      { baseUrl: '', apiKey: 'test-key', model: '' },
      { baseUrl: 'https://env.example', apiKey: 'env-key', model: 'env-model' },
    );
    expect(resolved.apiKey).toBe('test-key');
    const text = JSON.stringify(toMessages(applied.snapshot));
    expect(text).not.toContain('test-key');
    expect(text).not.toContain('OPENAI_API_KEY');
  });

  it('applying onto demo replaces the demo title', () => {
    const result = applyDocument(JSON.stringify(login), createDemoSnapshot());
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect((result.snapshot.dataModel as { title?: string }).title).toBe(
      '登录',
    );
    expect(JSON.stringify(result.snapshot.dataModel)).not.toContain('任务管理');
  });
});
