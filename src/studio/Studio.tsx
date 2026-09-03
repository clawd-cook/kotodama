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
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router';
import { EditorProvider } from '../editor/EditorState';
import { loadTheme, saveTheme } from '../editor/storage';
import {
  WorkshopFileActions,
  WorkshopHistoryActions,
} from '../editor/WorkshopActions';
import '../editor/editor.css';
import { ChannelProvider } from './ChannelContext';
import { type Room, ROOMS, createRoom, roomByPath } from './rooms';
import { StudioSessionProvider, useStudioSession } from './StudioSession';
import './studio.css';

const ROOM_ICONS = {
  create: EditOutlined,
  catalog: AppstoreOutlined,
  examples: FileTextOutlined,
  settings: SettingOutlined,
} satisfies Record<Room['key'], ComponentType>;

type StudioTheme = { theme: 'light' | 'dark' };

export function useStudioTheme() {
  return useOutletContext<StudioTheme>().theme;
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
  const { markVisitedWorkshop, bumpThread } = useStudioSession();
  const room = roomByPath(location.pathname);
  const workshop = createRoom();
  const inWorkshop = room.key === workshop.key;

  return (
    <Layout className="editor-root" data-theme={theme}>
      <a className="skip-link" href={room.skip.href}>
        {room.skip.label}
      </a>
      <Layout.Header className="editor-header">
        <span className="editor-mark">
          <span className="editor-seal" aria-hidden />
          <Link
            to={workshop.path}
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
            selectedKeys={[room.key]}
            onClick={({ key }) => {
              const item = ROOMS.find((entry) => entry.key === key);
              if (item) {
                navigate(item.path);
              }
            }}
            items={ROOMS.map((item) => {
              const RailIcon = ROOM_ICONS[item.key];
              return {
                key: item.key,
                icon: <RailIcon aria-hidden />,
                label: (
                  <Link
                    to={item.path}
                    aria-current={room.key === item.key ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                ),
              };
            })}
          />
        </nav>
        <div className="studio-desk">
          <Outlet context={{ theme } satisfies StudioTheme} />
        </div>
      </div>
    </Layout>
  );
}
