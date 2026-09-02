import { XProvider } from '@ant-design/x';
import xZhCN from '@ant-design/x/locale/zh_CN';
import { theme as antdTheme } from 'antd';
import antdZhCN from 'antd/locale/zh_CN';
import { useState } from 'react';
import { EditorShell } from './EditorShell';
import { EditorProvider } from './EditorState';
import { loadTheme, saveTheme } from './storage';
import './editor.css';
import '@ant-design/x-markdown/themes/light.css';
import '@ant-design/x-markdown/themes/dark.css';

export function EditorApp() {
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);

  return (
    <XProvider
      locale={{ ...antdZhCN, ...xZhCN }}
      theme={{
        algorithm:
          theme === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}
    >
      <EditorProvider>
        <EditorShell
          theme={theme}
          onThemeChange={(next) => {
            saveTheme(next);
            setTheme(next);
          }}
        />
      </EditorProvider>
    </XProvider>
  );
}
