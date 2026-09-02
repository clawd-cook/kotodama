import { ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useState } from 'react';
import { EditorShell } from './EditorShell';
import { EditorProvider } from './EditorState';
import { loadTheme, saveTheme } from './storage';
import './editor.css';

export function EditorApp() {
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);

  return (
    <ConfigProvider
      locale={zhCN}
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
    </ConfigProvider>
  );
}
