import { antdCatalog } from '@kotodama/antd-catalog';
import { Menu, Table, Typography } from 'antd';
import { Navigate, useNavigate, useParams } from 'react-router';
import { PaperPreview } from '../editor/PaperPreview';
import { foldMessages } from '../editor/snapshot';
import {
  CATALOG_BLURBS,
  CATALOG_GROUPS,
  CATALOG_PAGES,
  isCatalogName,
} from './catalog/catalogPages';
import { catalogPropertyNames } from './catalog/catalogPropertyNames';
import { JsonWell } from './JsonWell';

export function CatalogPage({ theme }: { theme: 'light' | 'dark' }) {
  const { component = 'Column' } = useParams();
  const navigate = useNavigate();

  if (!isCatalogName(component)) {
    return <Navigate to="/catalog/Column" replace />;
  }

  const messages = CATALOG_PAGES[component];
  const snapshot = foldMessages(messages);
  const jsonText = `${JSON.stringify(messages, null, 2)}\n`;
  const properties = catalogPropertyNames(component).map((name) => ({
    key: name,
    name,
    note: '',
  }));

  return (
    <div className="catalog-room">
      <nav className="catalog-index" aria-label="基础组件">
        <Menu
          mode="inline"
          selectedKeys={[component]}
          onClick={({ key }) => {
            navigate(`/catalog/${key}`);
          }}
          items={CATALOG_GROUPS.map((group) => ({
            type: 'group' as const,
            label: group.label,
            children: group.names.map((name) => ({
              key: name,
              label: name,
            })),
          }))}
        />
      </nav>
      <main className="catalog-detail">
        <h1 className="studio-title">{component}</h1>
        <Typography.Paragraph type="secondary">
          {CATALOG_BLURBS[component]}
        </Typography.Paragraph>
        <PaperPreview
          snapshot={snapshot}
          theme={theme}
          catalog={antdCatalog}
          sheetId="sheet"
        />
        <JsonWell text={jsonText} />
        <Typography.Text strong>属性</Typography.Text>
        <Table
          size="small"
          pagination={false}
          columns={[
            { title: '属性名', dataIndex: 'name', key: 'name' },
            { title: '说明', dataIndex: 'note', key: 'note' },
          ]}
          dataSource={properties}
        />
      </main>
    </div>
  );
}
