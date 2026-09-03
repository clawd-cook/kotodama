import {
  AppstoreOutlined,
  EditOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { XProvider } from '@ant-design/x';
import xZhCN from '@ant-design/x/locale/zh_CN';
import { Divider, Layout, Menu, Space, Switch, theme as antdTheme } from 'antd';
import antdZhCN from 'antd/locale/zh_CN';
import { useEffect, useMemo, useState } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { EditorProvider } from '../editor/EditorState';
import { loadTheme, saveTheme } from '../editor/storage';
import {
  WorkshopFileActions,
  WorkshopHistoryActions,
} from '../editor/WorkshopActions';
import '../editor/editor.css';
import { Catalog } from '../pages/catalog';
import { ExampleDetail, Examples } from '../pages/examples';
import { Settings } from '../pages/settings';
import { Workshop } from '../pages/workshop';
import { ChannelProvider, useChannel } from './ChannelContext';
import { StudioSessionProvider, useStudioSession } from './StudioSession';
import './studio.css';

const RAIL = [
  {
    key: 'create',
    path: '/',
    label: '开始创建',
    icon: <EditOutlined aria-hidden />,
  },
  {
    key: 'catalog',
    path: '/catalog',
    label: '基础组件',
    icon: <AppstoreOutlined aria-hidden />,
  },
  {
    key: 'examples',
    path: '/examples',
    label: '精选案例',
    icon: <FileTextOutlined aria-hidden />,
  },
  {
    key: 'settings',
    path: '/settings',
    label: '设置',
    icon: <SettingOutlined aria-hidden />,
  },
] as const;

function currentRoom(pathname: string): (typeof RAIL)[number]['key'] {
  if (pathname.startsWith('/catalog')) {
    return 'catalog';
  }
  if (pathname.startsWith('/examples')) {
    return 'examples';
  }
  if (pathname.startsWith('/settings')) {
    return 'settings';
  }
  return 'create';
}

function skipLink(pathname: string): { href: string; label: string } {
  if (pathname.startsWith('/settings')) {
    return { href: '#channel-form', label: '跳到表单' };
  }
  return { href: '#sheet', label: '跳到纸页' };
}

export function Studio() {
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
        <ChannelProvider>
          <StudioSessionProvider>
            <StudioHouse theme={theme} onThemeChange={setTheme} />
          </StudioSessionProvider>
        </ChannelProvider>
      </EditorProvider>
    </XProvider>
  );
}

function StudioHouse({
  theme,
  onThemeChange,
}: {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolved, override } = useChannel();
  const {
    markVisitedWorkshop,
    resetCount,
    bumpThread,
    landing,
    clearLanding,
  } = useStudioSession();
  const speech = useMemo(
    () => ({
      ready: resolved.ready,
      model: resolved.model,
      override,
      landing,
      clearLanding,
      resetCount,
    }),
    [
      clearLanding,
      landing,
      override,
      resetCount,
      resolved.model,
      resolved.ready,
    ],
  );
  const room = currentRoom(location.pathname);
  const inWorkshop = room === 'create';
  const skip = skipLink(location.pathname);

  return (
    <Layout className="editor-root" data-theme={theme}>
      <a className="skip-link" href={skip.href}>
        {skip.label}
      </a>
      <Layout.Header className="editor-header">
        <span className="editor-mark">
          <span className="editor-seal" aria-hidden />
          <Link
            to="/"
            className="editor-wordmark"
            translate="no"
            aria-label="言灵，返回开始创建"
          >
            言灵
          </Link>
        </span>
        <Space size={4} split={<Divider type="vertical" />}>
          {inWorkshop ? <WorkshopFileActions /> : null}
          {inWorkshop ? (
            <WorkshopHistoryActions
              onAfterReset={() => {
                markVisitedWorkshop();
                bumpThread();
              }}
            />
          ) : null}
          <span className="editor-theme">
            深色
            <Switch
              size="small"
              checked={theme === 'dark'}
              aria-label="深色"
              onChange={(checked) => {
                const next = checked ? 'dark' : 'light';
                saveTheme(next);
                onThemeChange(next);
              }}
            />
          </span>
        </Space>
      </Layout.Header>
      <div className="studio-house">
        <nav className="studio-rail" aria-label="工作室">
          <Menu
            mode="inline"
            selectedKeys={[room]}
            onClick={({ key }) => {
              const item = RAIL.find((entry) => entry.key === key);
              if (item) {
                navigate(item.path);
              }
            }}
            items={RAIL.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: (
                <Link
                  to={item.path}
                  aria-current={room === item.key ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ),
            }))}
          />
        </nav>
        <div className="studio-desk">
          <Workshop theme={theme} active={inWorkshop} speech={speech} />
          <Routes>
            <Route
              path="/catalog"
              element={<Navigate to="/catalog/Column" replace />}
            />
            <Route
              path="/catalog/:component"
              element={<Catalog theme={theme} />}
            />
            <Route path="/examples" element={<Examples theme={theme} />} />
            <Route
              path="/examples/:id"
              element={<ExampleDetail theme={theme} />}
            />
            <Route path="/settings" element={<Settings />} />
            <Route path="/" element={null} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Layout>
  );
}
