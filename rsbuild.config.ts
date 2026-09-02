import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    title: '言灵',
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
