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

const baseUrl = chatEnv.OPENAI_BASE_URL.replace(/\/$/, '');

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
  server: baseUrl
    ? {
        proxy: {
          '/api/chat/completions': {
            target: baseUrl,
            changeOrigin: true,
            pathRewrite: {
              '^/api/chat/completions': '/v1/chat/completions',
            },
            headers: {
              Authorization: `Bearer ${chatEnv.OPENAI_API_KEY}`,
            },
            timeout: 300000,
            proxyTimeout: 300000,
            onProxyReq: (proxyReq, req) => {
              const body = (req as { kotodamaBody?: string }).kotodamaBody;
              if (!body) {
                return;
              }
              proxyReq.setHeader('Content-Type', 'application/json');
              proxyReq.setHeader('Content-Length', String(new TextEncoder().encode(body).length));
              proxyReq.write(body);
            },
          },
        },
      }
    : undefined,
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
