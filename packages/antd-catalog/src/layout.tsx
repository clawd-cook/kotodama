import { createComponentImplementation } from '@a2ui/react/v0_9';
import {
  CardApi,
  ColumnApi,
  DividerApi,
  ListApi,
  ModalApi,
  RowApi,
  TabsApi,
} from '@a2ui/web_core/v0_9/basic_catalog';
import { Card as AntCard, Divider, Flex, Modal, Tabs } from 'antd';
import { useState } from 'react';
import { ChildList } from './ChildList';
import { mapAlign, mapJustify, weightStyle } from './style';

export const Row = createComponentImplementation(
  RowApi,
  ({ props, buildChild, context }) => (
    <Flex
      gap={8}
      style={{
        ...weightStyle(props.weight),
        justifyContent: mapJustify(props.justify),
        alignItems: mapAlign(props.align),
      }}
    >
      <ChildList
        childList={props.children}
        buildChild={buildChild}
        context={context}
      />
    </Flex>
  ),
);

export const Column = createComponentImplementation(
  ColumnApi,
  ({ props, buildChild, context }) => (
    <Flex
      vertical
      gap={8}
      style={{
        ...weightStyle(props.weight),
        justifyContent: mapJustify(props.justify),
        alignItems: mapAlign(props.align),
      }}
    >
      <ChildList
        childList={props.children}
        buildChild={buildChild}
        context={context}
      />
    </Flex>
  ),
);

export const List = createComponentImplementation(
  ListApi,
  ({ props, buildChild, context }) => {
    const horizontal = props.direction === 'horizontal';
    return (
      <Flex
        vertical={!horizontal}
        align={mapAlign(props.align)}
        gap={8}
        style={{
          ...weightStyle(props.weight),
          overflowX: horizontal ? 'auto' : 'hidden',
          overflowY: horizontal ? 'hidden' : 'auto',
        }}
      >
        <ChildList
          childList={props.children}
          buildChild={buildChild}
          context={context}
        />
      </Flex>
    );
  },
);

export const Card = createComponentImplementation(
  CardApi,
  ({ props, buildChild }) => (
    <AntCard size="small" style={weightStyle(props.weight)}>
      {props.child ? buildChild(props.child) : null}
    </AntCard>
  ),
);

export const TabsView = createComponentImplementation(
  TabsApi,
  ({ props, buildChild }) => {
    const tabs = props.tabs ?? [];
    return (
      <Tabs
        style={weightStyle(props.weight)}
        items={tabs.map((tab, index: number) => ({
          key: String(index),
          label: typeof tab.title === 'string' ? tab.title : `Tab ${index + 1}`,
          children: tab.child ? buildChild(tab.child) : null,
        }))}
      />
    );
  },
);

export const ModalView = createComponentImplementation(
  ModalApi,
  ({ props, buildChild }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: trigger child already handles activation */}
        <span onClick={() => setOpen(true)} style={{ display: 'inline-block' }}>
          {props.trigger ? buildChild(props.trigger) : null}
        </span>
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          destroyOnClose
        >
          {props.content ? buildChild(props.content) : null}
        </Modal>
      </>
    );
  },
);

export const DividerView = createComponentImplementation(
  DividerApi,
  ({ props }) => (
    <Divider
      type={props.axis === 'vertical' ? 'vertical' : 'horizontal'}
      style={weightStyle(props.weight)}
    />
  ),
);
