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
import {
  Card as AntCard,
  List as AntList,
  Divider,
  Flex,
  Modal,
  Tabs,
} from 'antd';
import { useState } from 'react';
import { antdApi } from './api';
import { ChildList, type ChildRef } from './ChildList';
import { mapAlign, mapJustify, weightStyle } from './style';

export const Row = createComponentImplementation(
  antdApi(RowApi),
  ({ props, buildChild, context }) => (
    <Flex
      gap={8}
      wrap="wrap"
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
  antdApi(ColumnApi),
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
  antdApi(ListApi),
  ({ props, buildChild, context }) => {
    const horizontal = props.direction === 'horizontal';
    const items: ChildRef[] = Array.isArray(props.children)
      ? (props.children as ChildRef[])
      : [];
    if (horizontal) {
      return (
        <Flex
          align={mapAlign(props.align)}
          gap={8}
          style={{
            ...weightStyle(props.weight),
            overflowX: 'auto',
          }}
        >
          <ChildList
            childList={props.children}
            buildChild={buildChild}
            context={context}
          />
        </Flex>
      );
    }
    return (
      <AntList
        size="small"
        split
        style={weightStyle(props.weight)}
        dataSource={items}
        renderItem={(childRef) => (
          <AntList.Item>
            {typeof childRef === 'string'
              ? buildChild(childRef)
              : buildChild(childRef.id, childRef.basePath)}
          </AntList.Item>
        )}
      />
    );
  },
);

export const Card = createComponentImplementation(
  antdApi(CardApi),
  ({ props, buildChild }) => (
    <AntCard size="small" style={weightStyle(props.weight)}>
      {props.child ? buildChild(props.child) : null}
    </AntCard>
  ),
);

export const TabsView = createComponentImplementation(
  antdApi(TabsApi),
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
  antdApi(ModalApi),
  ({ props, buildChild }) => {
    const [open, setOpen] = useState(false);
    return (
      <>
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: trigger child already handles activation */}
        <span
          onClick={(event) => {
            event.stopPropagation();
            setOpen(true);
          }}
          style={{ display: 'inline-block' }}
        >
          {props.trigger ? buildChild(props.trigger) : null}
        </span>
        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          destroyOnClose
          width={720}
          styles={{ body: { maxHeight: '60vh', overflow: 'auto' } }}
        >
          {props.content ? buildChild(props.content) : null}
        </Modal>
      </>
    );
  },
);

export const DividerView = createComponentImplementation(
  antdApi(DividerApi),
  ({ props }) => (
    <Divider
      type={props.axis === 'vertical' ? 'vertical' : 'horizontal'}
      style={weightStyle(props.weight)}
    />
  ),
);
