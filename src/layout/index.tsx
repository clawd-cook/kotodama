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
import { type ComponentType, useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { EditorProvider } from '../editor/EditorState';
import { loadTheme, saveTheme } from '../editor/storage';
import {
  WorkshopFileActions,
  WorkshopHistoryActions,
} from '../editor/WorkshopActions';
import '../editor/editor.css';
import { ChannelProvider } from '../studio/ChannelContext';
import './layout.css';
import { NAV_ITEMS, type NavKey, useActiveNav } from './nav';
import { type ColorScheme, LayoutThemeProvider } from './theme';

const NAV_ICONS = {
  create: EditOutlined,
  catalog: AppstoreOutlined,
  examples: FileTextOutlined,
  settings: SettingOutlined,
} satisfies Record<NavKey, ComponentType>;

export function AppLayout() {
  const [theme, setTheme] = useState<ColorScheme>(loadTheme);

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
      <LayoutThemeProvider theme={theme}>
        <EditorProvider>
          <ChannelProvider>
            <LayoutShell theme={theme} onThemeChange={setTheme} />
          </ChannelProvider>
        </EditorProvider>
      </LayoutThemeProvider>
    </XProvider>
  );
}

function LayoutShell({
  theme,
  onThemeChange,
}: {
  theme: ColorScheme;
  onThemeChange: (theme: ColorScheme) => void;
}) {
  const navigate = useNavigate();
  const nav = useActiveNav();
  const inWorkshop = nav.navKey === 'create';

  return (
    <Layout className="editor-root" data-theme={theme}>
      <a className="skip-link" href={nav.skip.href}>
        {nav.skip.label}
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
          {inWorkshop ? <WorkshopHistoryActions /> : null}
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
            selectedKeys={[nav.navKey]}
            onClick={({ key }) => {
              const item = NAV_ITEMS.find((entry) => entry.key === key);
              if (item) {
                navigate(item.path);
              }
            }}
            items={NAV_ITEMS.map((item) => {
              const RailIcon = NAV_ICONS[item.key];
              return {
                key: item.key,
                icon: <RailIcon aria-hidden />,
                label: (
                  <Link
                    to={item.path}
                    aria-current={nav.navKey === item.key ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                ),
              };
            })}
          />
        </nav>
        <div className="studio-desk">
          <Outlet />
        </div>
      </div>
    </Layout>
  );
}
