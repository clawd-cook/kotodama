import { createDemoSnapshot } from '@src/editor/demo';
import { toMessages } from '@src/editor/snapshot';
import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderStudio, stubChatHealth } from '../helpers/studio';

const chat = vi.hoisted(() => ({
  messages: [] as Array<{
    id: string;
    status: string;
    message: { role: string; content: unknown };
  }>,
  isRequesting: false,
  onRequest: vi.fn(),
  abort: vi.fn(),
  requestFallback:
    undefined as
      | ((
          chunks: unknown,
          extra: { error?: Error; messageInfo?: { message?: { content?: unknown } } },
        ) => { content: string; role: string })
      | undefined,
}));

vi.mock('@ant-design/x-sdk', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ant-design/x-sdk')>();
  return {
    ...actual,
    useXChat: (options: {
      requestPlaceholder?: () => { content: string; role: string };
      requestFallback?: typeof chat.requestFallback;
    }) => {
      options.requestPlaceholder?.();
      chat.requestFallback = options.requestFallback;
      return {
        messages: [...chat.messages],
        onRequest: chat.onRequest,
        isRequesting: chat.isRequesting,
        abort: chat.abort,
      };
    },
  };
});

afterEach(() => {
  cleanup();
  chat.messages = [];
  chat.isRequesting = false;
  chat.onRequest.mockReset();
  chat.abort.mockReset();
});

beforeEach(() => {
  stubChatHealth();
});

function envelope(summary: string) {
  return JSON.stringify({
    summary,
    messages: toMessages(createDemoSnapshot()),
  });
}

describe('ChatPanel', () => {
  it('ignores prompts until the channel is ready, then sends', async () => {
    const user = userEvent.setup();
    renderStudio('/');
    await user.click(await screen.findByText('做一个登录表单'));
    expect(chat.onRequest).not.toHaveBeenCalled();
    await user.click(screen.getByRole('link', { name: '设置' }));
    await user.type(screen.getByLabelText('Base URL'), 'https://ui.example');
    await user.type(screen.getByLabelText('API Key'), 'ui-key');
    await user.type(screen.getByLabelText('模型名'), 'ui-model');
    await user.click(screen.getByRole('button', { name: /保\s*存/ }));
    await user.click(screen.getByRole('link', { name: '开始创建' }));
    await user.click(await screen.findByText('做一个登录表单'));
    expect(chat.onRequest).toHaveBeenCalledWith({
      messages: [{ role: 'user', content: '做一个登录表单' }],
    });
  });

  it('applies a successful assistant envelope onto the page', async () => {
    chat.messages = [
      {
        id: 'a1',
        status: 'success',
        message: { role: 'assistant', content: envelope('已换成演示页。') },
      },
    ];
    renderStudio('/');
    expect(await screen.findByText('已换成演示页。')).toBeTruthy();
    expect(await screen.findByText('待办')).toBeTruthy();
  });

  it('shows streaming placeholders and logs apply failures', async () => {
    chat.messages = [
      { id: 'sys', status: 'success', message: { role: 'system', content: 'x' } },
      { id: 'u1', status: 'success', message: { role: 'user', content: '做一页' } },
      {
        id: 'a1',
        status: 'loading',
        message: { role: 'assistant', content: '' },
      },
    ];
    const { rerender } = renderStudio('/');
    expect(await screen.findByText('正在写下这一页…')).toBeTruthy();
    chat.messages = [
      { id: 'u1', status: 'success', message: { role: 'user', content: '做一页' } },
      {
        id: 'a1',
        status: 'updating',
        message: { role: 'assistant', content: '...' },
      },
    ];
    rerender;
    chat.messages = [
      { id: 'u1', status: 'success', message: { role: 'user', content: '做一页' } },
      {
        id: 'a1',
        status: 'success',
        message: { role: 'assistant', content: '没有协议' },
      },
    ];
    cleanup();
    renderStudio('/');
    expect(await screen.findByText(/页面没改|没有解析到/)).toBeTruthy();
  });

  it('skips empty assistant content and duplicate ids', async () => {
    chat.messages = [
      {
        id: 'empty',
        status: 'success',
        message: { role: 'assistant', content: { text: '' } },
      },
    ];
    renderStudio('/');
    expect(await screen.findByText('说你想要的那一页')).toBeTruthy();
    cleanup();
    chat.messages = [
      {
        id: 'dup',
        status: 'success',
        message: { role: 'assistant', content: envelope('第一次') },
      },
    ];
    renderStudio('/');
    expect(await screen.findByText('第一次')).toBeTruthy();
    cleanup();
    chat.messages = [
      {
        id: 'dup',
        status: 'success',
        message: { role: 'assistant', content: envelope('第二次') },
      },
    ];
    renderStudio('/');
    expect(screen.queryByText('第二次')).toBeNull();
  });

  it('prefills and auto-sends landing state', async () => {
    renderStudio({
      pathname: '/',
      state: { prefill: `预填文案-${Date.now()}` },
    });
    expect(await screen.findByDisplayValue(/预填文案-/)).toBeTruthy();
    cleanup();
    renderStudio({
      pathname: '/',
      state: { autoSend: `自动发送-${Date.now()}` },
    });
    await waitFor(() => {
      expect(chat.onRequest).toHaveBeenCalled();
    });
    cleanup();
    renderStudio({ pathname: '/', state: { autoSend: '   ' } });
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
  });

  it('covers request fallbacks and abort', async () => {
    chat.isRequesting = true;
    renderStudio('/');
    expect(await screen.findByRole('heading', { name: '工坊' })).toBeTruthy();
    const abortError = new Error('stopped');
    abortError.name = 'AbortError';
    expect(
      chat.requestFallback?.(undefined, {
        error: abortError,
        messageInfo: { message: { content: '已写出一半' } },
      }),
    ).toEqual({ content: '已写出一半', role: 'assistant' });
    expect(
      chat.requestFallback?.(undefined, {
        error: abortError,
        messageInfo: { message: { content: '' } },
      }),
    ).toEqual({ content: '已停止', role: 'assistant' });
    expect(
      chat.requestFallback?.(undefined, { error: new Error('上游失败') }),
    ).toEqual({ content: '上游失败', role: 'assistant' });
    expect(chat.requestFallback?.(undefined, { error: 'nope' as never })).toEqual(
      { content: '对话请求失败', role: 'assistant' },
    );
  });
});
