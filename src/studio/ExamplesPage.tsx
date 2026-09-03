import { antdCatalog } from '@kotodama/antd-catalog';
import { Button, Modal, message, Typography } from 'antd';
import { Link, Navigate, useNavigate, useParams } from 'react-router';
import { useEditor } from '../editor/EditorState';
import { foldMessages } from '../editor/snapshot';
import { isCurrentPage } from '../editor/storage';
import { PaperPreview } from '../paper/PaperPreview';
import type { ExampleId } from './examples';
import { EXAMPLE_PAGES } from './examples';
import { JsonWell } from './JsonWell';
import { useStudioSession } from './StudioSession';

const EXAMPLE_CARDS: {
  id: ExampleId;
  title: string;
  blurb: string;
}[] = [
  { id: 'login', title: '登录表单', blurb: '账号和密码、主按钮' },
  { id: 'settings', title: '设置页', blurb: '分组的多项设置' },
  {
    id: 'filtered-list',
    title: '带筛选的列表',
    blurb: '先筛再列出结果',
  },
];

function isExampleId(id: string): id is ExampleId {
  return id === 'login' || id === 'settings' || id === 'filtered-list';
}

export function ExamplesPage({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <main className="examples-list" id="sheet">
      <h1 className="studio-title">精选案例</h1>
      <div className="examples-row">
        {EXAMPLE_CARDS.map((card) => {
          const snapshot = foldMessages(EXAMPLE_PAGES[card.id].messages);
          return (
            <Link
              key={card.id}
              className="example-paper"
              to={`/examples/${card.id}`}
            >
              <div className="example-thumb" aria-hidden>
                <PaperPreview
                  snapshot={snapshot}
                  theme={theme}
                  catalog={antdCatalog}
                />
              </div>
              <h2 className="example-card-title">{card.title}</h2>
              <Typography.Paragraph type="secondary">
                {card.blurb}
              </Typography.Paragraph>
            </Link>
          );
        })}
      </div>
    </main>
  );
}

export function ExampleDetailPage({ theme }: { theme: 'light' | 'dark' }) {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { snapshot, loadPage } = useEditor();
  const { markVisitedWorkshop, bumpThread } = useStudioSession();

  if (!isExampleId(id)) {
    return <Navigate to="/examples" replace />;
  }

  const card = EXAMPLE_CARDS.find((item) => item.id === id);
  if (!card) {
    return <Navigate to="/examples" replace />;
  }

  const messages = EXAMPLE_PAGES[id].messages;
  const page = foldMessages(messages);
  const jsonText = `${JSON.stringify(messages, null, 2)}\n`;

  const useThisPage = () => {
    const apply = () => {
      const error = loadPage(JSON.stringify(messages));
      if (error) {
        void message.error(error);
        return;
      }
      markVisitedWorkshop();
      bumpThread();
      navigate('/');
    };
    if (isCurrentPage(snapshot)) {
      Modal.confirm({
        title: '换上这一页？当前页会被盖掉。',
        okText: '换上',
        cancelText: '留下',
        onOk: apply,
      });
      return;
    }
    apply();
  };

  return (
    <main className="example-detail">
      <div className="example-detail-head">
        <h1 className="studio-title">{card.title}</h1>
        <Button type="primary" onClick={useThisPage}>
          用这一页
        </Button>
      </div>
      <Typography.Paragraph type="secondary">{card.blurb}</Typography.Paragraph>
      <PaperPreview
        snapshot={page}
        theme={theme}
        catalog={antdCatalog}
        sheetId="sheet"
        onEvent={() => undefined}
        onDataModel={() => undefined}
      />
      <JsonWell text={jsonText} />
    </main>
  );
}
