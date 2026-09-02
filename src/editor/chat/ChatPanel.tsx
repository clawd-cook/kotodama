import { Bubble, Prompts, Sender } from '@ant-design/x';
import { useXChat, XRequest } from '@ant-design/x-sdk';
import { Flex, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ApplyResult } from '../applyDocument';
import { applyDocument } from '../applyDocument';
import { STREAMING_PLACEHOLDER } from '../copy';
import { useEditor } from '../EditorState';
import { toMessages } from '../snapshot';
import { parseChatOutput } from './parseA2ui';
import { presentAssistant } from './presentAssistant';
import { EditorChatProvider, textOf } from './provider';
import { buildSystemPrompt } from './prompt';

const PROMPT_ITEMS = [
  { key: 'login', label: '做一个登录表单' },
  { key: 'settings', label: '做一个设置页' },
  { key: 'list', label: '做一个带筛选的列表' },
];

export function ChatPanel({
  resetCount,
}: {
  resetCount: number;
  theme: 'light' | 'dark';
}) {
  const { snapshot, applyJson, logError, clearErrors } = useEditor();
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;
  const applyJsonRef = useRef(applyJson);
  applyJsonRef.current = applyJson;
  const logErrorRef = useRef(logError);
  logErrorRef.current = logError;
  const appliedIds = useRef(new Set<string>());
  const [model, setModel] = useState('');
  const [presented, setPresented] = useState<Record<string, string>>({});

  useEffect(() => {
    void fetch('/api/chat/health')
      .then((response) => response.json())
      .then((data: { model?: string }) => {
        if (data.model) {
          setModel(data.model);
        }
      })
      .catch(() => {
        /* health is optional until send */
      });
  }, []);

  const roles = useMemo(
    () => ({
      assistant: {
        placement: 'start' as const,
        variant: 'borderless' as const,
        contentRender: (content: string) => (
          <div aria-live="polite">{content}</div>
        ),
      },
      user: {
        placement: 'end' as const,
        variant: 'borderless' as const,
      },
    }),
    [],
  );

  const provider = useMemo(
    () =>
      new EditorChatProvider(
        {
          request: XRequest('/api/chat/completions', {
            manual: true,
            params: {
              stream: true,
              ...(model ? { model } : {}),
            },
          }),
        },
        () =>
          buildSystemPrompt(
            JSON.stringify(toMessages(snapshotRef.current), null, 2),
          ),
      ),
    [model, resetCount],
  );

  const { messages, onRequest, isRequesting, abort, setMessages } = useXChat({
    provider,
    conversationKey: `editor-${resetCount}`,
    requestPlaceholder: () => ({
      content: STREAMING_PLACEHOLDER,
      role: 'assistant',
    }),
    requestFallback: (_, { error, messageInfo }) => {
      if (error?.name === 'AbortError') {
        return {
          content: textOf(messageInfo?.message?.content) || '已停止',
          role: 'assistant',
        };
      }
      const message = error instanceof Error ? error.message : '对话请求失败';
      logErrorRef.current(message, 'chat');
      return { content: message, role: 'assistant' };
    },
  });

  useEffect(() => {
    appliedIds.current.clear();
    setPresented({});
    setMessages([]);
  }, [resetCount, setMessages]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.message.role !== 'assistant' || last.status !== 'success') {
      return;
    }
    const id = String(last.id);
    if (appliedIds.current.has(id)) {
      return;
    }
    appliedIds.current.add(id);
    const content = textOf(last.message.content);
    if (!content) {
      return;
    }
    let result: ApplyResult;
    try {
      clearErrors('chat');
      const parsed = parseChatOutput(content);
      result = applyDocument(
        JSON.stringify(parsed.messages),
        snapshotRef.current,
      );
      if (result.ok) {
        applyJsonRef.current(JSON.stringify(parsed.messages, null, 2));
      }
    } catch (error) {
      result = {
        ok: false,
        code: 'PARSE',
        message: error instanceof Error ? error.message : String(error),
      };
    }
    const display = presentAssistant(content, result);
    setPresented((current) => ({ ...current, [id]: display }));
    if (!result.ok) {
      logErrorRef.current(display, 'chat');
    }
  }, [clearErrors, messages]);

  const send = (text: string) => {
    const content = text.trim();
    if (!content || isRequesting) {
      return;
    }
    onRequest({
      messages: [{ role: 'user', content }],
    });
  };

  return (
    <Flex vertical className="chat-panel">
      {messages.length === 0 ? (
        <Flex vertical flex={1} gap={16} className="chat-welcome">
          <div>
            <h2 className="chat-welcome-title">说你想要的那一页</h2>
            <Typography.Text type="secondary" className="chat-welcome-desc">
              说完后，中间会换成一页。这一页可以留下、再打开。
            </Typography.Text>
          </div>
          <div>
            <Typography.Text type="secondary" className="chat-prompts-label">
              可以说
            </Typography.Text>
            <Prompts
              className="chat-prompts"
              items={PROMPT_ITEMS}
              vertical
              onItemClick={(info) => send(String(info.data.label ?? ''))}
            />
          </div>
        </Flex>
      ) : (
        <Bubble.List
          className="chat-log"
          autoScroll
          role={roles}
          items={messages
            .filter(
              ({ message }) =>
                message.role === 'user' || message.role === 'assistant',
            )
            .map(({ id, message, status }) => {
              const key = String(id);
              const raw = textOf(message.content);
              let content = raw;
              if (message.role === 'assistant') {
                if (status === 'success') {
                  content = presented[key] ?? STREAMING_PLACEHOLDER;
                } else if (status === 'loading' || status === 'updating') {
                  content = STREAMING_PLACEHOLDER;
                }
              }
              return {
                key,
                role: message.role,
                content,
                loading: status === 'loading',
                streaming: status === 'updating',
                status,
              };
            })}
        />
      )}
      <Sender
        key={resetCount}
        className="chat-input"
        placeholder="描述你想要的界面…"
        loading={isRequesting}
        onSubmit={(value) => send(value)}
        onCancel={() => abort()}
      />
    </Flex>
  );
}
