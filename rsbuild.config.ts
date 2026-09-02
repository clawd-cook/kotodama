import { defineConfig, loadEnv, type RsbuildPlugin } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { createChatProxy } from './server/chat-proxy';

const { parsed } = loadEnv();

const chatEnv = {
  OPENAI_BASE_URL: parsed.OPENAI_BASE_URL ?? '',
  OPENAI_API_KEY: parsed.OPENAI_API_KEY ?? '',
  OPENAI_MODEL: parsed.OPENAI_MODEL ?? '',
};

const chatProxyPlugin = (): RsbuildPlugin => ({
  name: 'kotodama-chat-proxy',
  setup(api) {
    api.onBeforeStartDevServer(({ server }) => {
      server.middlewares.use(createChatProxy(chatEnv) as never);
    });
  },
});

export default defineConfig({
  plugins: [pluginReact(), chatProxyPlugin()],
  html: {
    title: '言灵',
    lang: 'zh-CN',
    tags: [
      {
        tag: 'meta',
        attrs: { name: 'color-scheme', content: 'light dark' },
      },
    ],
  },
  tools: {
    rspack: {
      watchOptions: {
        ignored: [
          '**/.git/**',
          '**/node_modules/**',
          '**/submodules/**',
          '**/.agents/**',
        ],
      },
    },
  },
});
