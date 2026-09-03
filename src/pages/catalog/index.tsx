import { antdCatalog } from '@kotodama/antd-catalog';
import { Menu, Table, Typography } from 'antd';
import { Link, Navigate, useParams } from 'react-router';
import { foldMessages } from '../../editor/snapshot';
import { PaperPreview } from '../../paper/PaperPreview';
import {
  CATALOG_BLURBS,
  CATALOG_GROUPS,
  CATALOG_PAGES,
  isCatalogName,
} from '../../studio/catalog/catalogPages';
import { catalogPropertyNames } from '../../studio/catalog/catalogPropertyNames';
import { JsonWell } from '../../studio/JsonWell';

export function Catalog({ theme }: { theme: 'light' | 'dark' }) {
  const { component = 'Column' } = useParams();

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
          items={CATALOG_GROUPS.map((group) => ({
            type: 'group' as const,
            label: group.label,
            children: group.names.map((name) => ({
              key: name,
              label: (
                <Link
                  to={`/catalog/${name}`}
                  aria-current={component === name ? 'page' : undefined}
                  translate="no"
                >
                  {name}
                </Link>
              ),
            })),
          }))}
        />
      </nav>
      <main className="catalog-detail">
        <h1 className="studio-title" translate="no">
          {component}
        </h1>
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
        <h2 className="studio-section-title catalog-props-title">属性</h2>
        <Table
          className="catalog-props"
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
