import { RobotOutlined, UserOutlined } from '@ant-design/icons';
import { Bubble, Prompts, Sender, Welcome } from '@ant-design/x';
import { XMarkdown } from '@ant-design/x-markdown';
import { useXChat, XRequest } from '@ant-design/x-sdk';
import { Avatar, Flex } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useEditor } from '../EditorState';
import { toMessages } from '../snapshot';
import { extractA2uiMessages } from './parseA2ui';
import { EditorChatProvider, textOf } from './provider';
import { buildSystemPrompt } from './prompt';

const PROMPT_ITEMS = [
  { key: 'login', label: '做一个登录表单' },
  { key: 'settings', label: '做一个设置页' },
  { key: 'list', label: '做一个带筛选的列表' },
];

export function ChatPanel({
  resetCount,
  theme,
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
        avatar: <Avatar size={28} icon={<RobotOutlined />} />,
        contentRender: (content: string, info: { status?: string }) => (
          <XMarkdown
            className={`x-markdown-${theme}`}
            content={content}
            escapeRawHtml
            streaming={{
              hasNextChunk: info.status === 'updating' || info.status === 'loading',
              enableAnimation: false,
            }}
          />
        ),
      },
      user: {
        placement: 'end' as const,
        avatar: <Avatar size={28} icon={<UserOutlined />} />,
      },
    }),
    [theme],
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
        () => buildSystemPrompt(JSON.stringify(toMessages(snapshotRef.current), null, 2)),
      ),
    [model, resetCount],
  );

  const { messages, onRequest, isRequesting, abort, setMessages } = useXChat({
    provider,
    conversationKey: `editor-${resetCount}`,
    requestPlaceholder: () => ({
      content: '正在生成界面…',
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
    try {
      clearErrors('chat');
      const blocks = extractA2uiMessages(content);
      if (!applyJsonRef.current(JSON.stringify(blocks, null, 2))) {
        throw new Error('生成的 JSON 无法应用到画布');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logErrorRef.current(message, 'chat');
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
        <Flex vertical flex={1} justify="center" gap={12} className="chat-welcome">
          <Welcome
            variant="borderless"
            title="用自然语言生成界面"
            description="描述你想要的布局，模型会输出 A2UI JSON 并应用到画布。"
          />
          <Prompts
            items={PROMPT_ITEMS}
            wrap
            onItemClick={(info) => send(String(info.data.label ?? ''))}
          />
        </Flex>
      ) : (
        <Bubble.List
          className="chat-log"
          autoScroll
          role={roles}
          items={messages
            .filter(({ message }) => message.role === 'user' || message.role === 'assistant')
            .map(({ id, message, status }) => ({
              key: id,
              role: message.role,
              content: textOf(message.content),
              loading: status === 'loading',
              streaming: status === 'updating',
              status,
            }))}
        />
      )}
      <Sender
        className="chat-input"
        placeholder="描述你想要的界面"
        loading={isRequesting}
        onSubmit={(value) => send(value)}
        onCancel={() => abort()}
      />
    </Flex>
  );
}
