import { OpenAIChatProvider, XRequest } from '@ant-design/x-sdk';
import { EditorChatProvider, textOf } from '@src/editor/chat/provider';
import { describe, expect, it, vi } from 'vitest';

describe('textOf', () => {
  it('returns a string content as-is', () => {
    expect(textOf('你好')).toBe('你好');
  });

  it('reads the text field from an object', () => {
    expect(textOf({ text: '摘要' })).toBe('摘要');
  });

  it('returns empty for missing content', () => {
    expect(textOf(undefined)).toBe('');
    expect(textOf(null as never)).toBe('');
    expect(textOf({} as never)).toBe('');
    expect(textOf({ text: undefined })).toBe('');
    expect(textOf({ text: null })).toBe('');
  });
});

describe('EditorChatProvider', () => {
  it('injects the system prompt and channel override', () => {
    vi.spyOn(OpenAIChatProvider.prototype, 'transformParams').mockImplementation(
      (requestParams) => ({ ...requestParams }) as never,
    );
    const provider = new EditorChatProvider(
      {
        request: XRequest('/api/chat/completions', { manual: true }),
      },
      () => 'SYSTEM',
      () => ({ baseUrl: 'https://ui.example', apiKey: 'k', model: 'm' }),
    );
    const params = provider.transformParams(
      {
        messages: [
          { role: 'system', content: 'old' },
          { role: 'user', content: '做一个登录表单' },
        ],
      } as never,
      {} as never,
    );
    expect(params.messages?.[0]).toEqual({ role: 'system', content: 'SYSTEM' });
    expect(params.messages?.filter((item) => item.role === 'system')).toHaveLength(
      1,
    );
    expect(
      (params as { kotodamaChannel?: { apiKey?: string } }).kotodamaChannel
        ?.apiKey,
    ).toBe('k');
  });

  it('omits the channel when none is configured', () => {
    vi.spyOn(OpenAIChatProvider.prototype, 'transformParams').mockImplementation(
      (requestParams) => ({ ...requestParams }) as never,
    );
    const provider = new EditorChatProvider(
      {
        request: XRequest('/api/chat/completions', { manual: true }),
      },
      () => 'SYSTEM',
      () => undefined,
    );
    const params = provider.transformParams(
      { messages: [{ role: 'user', content: 'hi' }] } as never,
      {} as never,
    );
    expect(params).not.toHaveProperty('kotodamaChannel');
  });

  it('treats missing messages as an empty history', () => {
    vi.spyOn(OpenAIChatProvider.prototype, 'transformParams').mockImplementation(
      () => ({}) as never,
    );
    const provider = new EditorChatProvider(
      {
        request: XRequest('/api/chat/completions', { manual: true }),
      },
      () => 'SYSTEM',
      () => undefined,
    );
    const params = provider.transformParams({} as never, {} as never);
    expect(params.messages).toEqual([
      { role: 'system', content: 'SYSTEM' },
    ]);
  });
});
