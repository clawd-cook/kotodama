import {
  AppstoreOutlined,
  EditOutlined,
  FileTextOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Layout,
  Menu,
  Modal,
  message,
  Space,
  Switch,
} from 'antd';
import { useRef } from 'react';
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router';
import { EditorShell } from '../editor/EditorShell';
import { useEditor } from '../editor/EditorState';
import { toMessages } from '../editor/snapshot';
import { isCurrentPage, saveTheme } from '../editor/storage';
import { CatalogPage } from './CatalogPage';
import { ChannelProvider } from './ChannelContext';
import { createScreen } from './createScreen';
import { ExampleDetailPage, ExamplesPage } from './ExamplesPage';
import { LandingPage } from './LandingPage';
import { SettingsPage } from './SettingsPage';
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

function roomKey(pathname: string): string {
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

function skipLink(
  pathname: string,
  workshop: boolean,
): { href: string; label: string } {
  if (pathname === '/' && !workshop) {
    return { href: '#prompt', label: '跳到输入' };
  }
  if (pathname.startsWith('/settings')) {
    return { href: '#channel-form', label: '跳到表单' };
  }
  return { href: '#sheet', label: '跳到纸页' };
}

export function StudioShell({
  theme,
  onThemeChange,
}: {
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
}) {
  return (
    <ChannelProvider>
      <StudioSessionProvider>
        <StudioHouse theme={theme} onThemeChange={onThemeChange} />
      </StudioSessionProvider>
    </ChannelProvider>
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
  const { snapshot, undo, redo, reset, canUndo, canRedo, openJson } =
    useEditor();
  const { visitedWorkshop, markVisitedWorkshop, resetCount, bumpThread } =
    useStudioSession();
  const fileRef = useRef<HTMLInputElement>(null);
  const screen = createScreen({ snapshot, visitedWorkshop });
  const onCreate = location.pathname === '/';
  const showWorkshop = onCreate && screen === 'workshop';
  const showLanding = onCreate && screen === 'landing';
  const skip = skipLink(location.pathname, showWorkshop);
  const current = isCurrentPage(snapshot);

  const download = () => {
    const text = JSON.stringify(toMessages(snapshot), null, 2);
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kotodama.json';
    link.click();
    URL.revokeObjectURL(url);
    void message.success('已下载 kotodama.json。');
  };

  const confirmReset = () => {
    Modal.confirm({
      title: '新建这一页？当前页会清掉。说话也会从头开始。',
      okText: '新建',
      cancelText: '留下',
      onOk: () => {
        reset();
        markVisitedWorkshop();
        bumpThread();
      },
    });
  };

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
          {showWorkshop ? (
            <Space size={0}>
              <Button
                type="text"
                size="small"
                onClick={() => fileRef.current?.click()}
              >
                打开
              </Button>
              <Button
                type="text"
                size="small"
                onClick={download}
                disabled={!current}
              >
                下载
              </Button>
            </Space>
          ) : null}
          {showWorkshop ? (
            <Space size={0}>
              <Button
                type="text"
                size="small"
                onClick={undo}
                disabled={!canUndo}
              >
                撤销
              </Button>
              <Button
                type="text"
                size="small"
                onClick={redo}
                disabled={!canRedo}
              >
                重做
              </Button>
              <Button type="text" size="small" onClick={confirmReset}>
                新建
              </Button>
            </Space>
          ) : null}
          <label className="editor-theme">
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
          </label>
        </Space>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          aria-label="打开 JSON"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) {
              return;
            }
            const text = await file.text();
            const error = openJson(text);
            if (error) {
              void message.error(error);
            }
          }}
        />
      </Layout.Header>
      <div className="studio-house">
        <nav className="studio-rail" aria-label="工作室">
          <Menu
            mode="inline"
            selectedKeys={[roomKey(location.pathname)]}
            onClick={({ key }) => {
              const item = RAIL.find((entry) => entry.key === key);
              if (item) {
                navigate(item.path);
              }
            }}
            items={RAIL.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
            }))}
          />
        </nav>
        <div className="studio-desk">
          {showLanding ? <LandingPage /> : null}
          {screen === 'workshop' || visitedWorkshop || current ? (
            <div
              className="studio-workshop"
              hidden={!showWorkshop}
              aria-hidden={!showWorkshop}
            >
              <EditorShell
                theme={theme}
                resetCount={resetCount}
                sheetId={showWorkshop ? 'sheet' : undefined}
              />
            </div>
          ) : null}
          <Routes>
            <Route
              path="/catalog"
              element={<Navigate to="/catalog/Column" replace />}
            />
            <Route
              path="/catalog/:component"
              element={<CatalogPage theme={theme} />}
            />
            <Route path="/examples" element={<ExamplesPage theme={theme} />} />
            <Route
              path="/examples/:id"
              element={<ExampleDetailPage theme={theme} />}
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/" element={null} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Layout>
  );
}
