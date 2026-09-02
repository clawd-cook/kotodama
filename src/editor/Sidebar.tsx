import { Button, Space, Tabs, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { ChatPanel } from './chat/ChatPanel';
import { PALETTE } from './demo';
import { useEditor } from './EditorState';
import { buildTree, canInsertInto } from './tree';

export function Sidebar({
  resetCount,
  theme,
}: {
  resetCount: number;
  theme: 'light' | 'dark';
}) {
  return (
    <div className="sidebar sidebar-with-tabs">
      <Tabs
        size="small"
        defaultActiveKey="chat"
        items={[
          {
            key: 'chat',
            label: '说话',
            children: <ChatPanel resetCount={resetCount} theme={theme} />,
          },
          {
            key: 'tree',
            label: '组件',
            children: <ComponentPane />,
          },
        ]}
      />
    </div>
  );
}

function ComponentPane() {
  const {
    snapshot,
    selectedId,
    setSelectedId,
    insert,
    removeSelected,
    duplicateSelected,
  } = useEditor();
  const tree = buildTree(snapshot.components);
  const selected = snapshot.components.find((item) => item.id === selectedId);
  const insertEnabled =
    !selected ||
    canInsertInto(selected.component) ||
    selected.component === 'Card' ||
    selected.id !== 'root';

  const toData = (nodes: ReturnType<typeof buildTree>): DataNode[] =>
    nodes.map((node) => ({
      key: node.id,
      title: `${node.type}  ${node.id}`,
      children: toData(node.children),
    }));

  return (
    <div className="component-pane">
      <Typography.Text strong>组件树</Typography.Text>
      <Tree
        blockNode
        selectedKeys={selectedId ? [selectedId] : []}
        treeData={toData(tree)}
        defaultExpandAll
        onSelect={(keys) => setSelectedId(String(keys[0] ?? 'root'))}
        style={{ margin: '8px 0 16px' }}
      />
      <Space style={{ marginBottom: 12 }}>
        <Button size="small" onClick={duplicateSelected} disabled={!selectedId}>
          复制
        </Button>
        <Button
          size="small"
          danger
          onClick={removeSelected}
          disabled={!selectedId || selectedId === 'root'}
        >
          删除
        </Button>
      </Space>
      <Typography.Text strong>插入</Typography.Text>
      <div className="palette">
        {PALETTE.map((item) => (
          <Button
            key={item.type}
            size="small"
            disabled={!insertEnabled}
            onClick={() => insert(item.type)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
