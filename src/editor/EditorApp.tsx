import { XProvider } from '@ant-design/x';
import xZhCN from '@ant-design/x/locale/zh_CN';
import { theme as antdTheme } from 'antd';
import antdZhCN from 'antd/locale/zh_CN';
import { useEffect, useState } from 'react';
import { EditorProvider } from './EditorState';
import { loadTheme } from './storage';
import { StudioShell } from '../studio/StudioShell';
import './editor.css';

export function EditorApp() {
  const [theme, setTheme] = useState<'light' | 'dark'>(loadTheme);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <XProvider
      locale={{ ...antdZhCN, ...xZhCN }}
      theme={{
        algorithm:
          theme === 'dark'
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677FF',
          colorBgLayout: theme === 'dark' ? '#121212' : '#E6EAEF',
        },
      }}
    >
      <EditorProvider>
        <StudioShell theme={theme} onThemeChange={setTheme} />
      </EditorProvider>
    </XProvider>
  );
}
