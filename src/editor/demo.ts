import { SURFACE_ID } from './snapshot';
import { BASIC_CATALOG_ID, type A2uiComponent, type Snapshot } from './types';

function text(
  id: string,
  value: string | { path: string },
  extra: Record<string, unknown> = {},
): A2uiComponent {
  return {
    id,
    component: 'Text',
    text: value,
    variant: 'body',
    ...extra,
  };
}

function button(
  id: string,
  labelId: string,
  label: string | { path: string },
  variant: 'primary' | 'default' | 'borderless',
  event: string,
): A2uiComponent[] {
  return [
    {
      id,
      component: 'Button',
      child: labelId,
      variant,
      action: { event: { name: event } },
    },
    text(labelId, label),
  ];
}

function rowCells(
  prefix: string,
  paths: string[],
  actions?: A2uiComponent[],
): A2uiComponent[] {
  const cellIds = paths.map((_, index) => `${prefix}_c${index}`);
  const actionId = `${prefix}_ops`;
  const children = actions ? [...cellIds, actionId] : cellIds;
  return [
    {
      id: prefix,
      component: 'Row',
      children,
      justify: 'start',
      align: 'center',
    },
    ...paths.map((path, index) =>
      text(cellIds[index], { path }, {
        weight: 1,
        variant: prefix === 'table_head' ? 'caption' : 'body',
      }),
    ),
    ...(actions
      ? [
          {
            id: actionId,
            component: 'Row',
            children: actions
              .filter((item) => item.component === 'Button')
              .map((item) => item.id),
            justify: 'start',
            align: 'center',
            weight: 1,
          } satisfies A2uiComponent,
          ...actions,
        ]
      : []),
  ];
}

export function createDemoSnapshot(): Snapshot {
  const queryButtons = [
    ...button('reset', 'reset_label', { path: '/resetLabel' }, 'default', 'reset'),
    ...button('query', 'query_label', { path: '/queryLabel' }, 'primary', 'query'),
    ...button('export', 'export_label', { path: '/exportLabel' }, 'default', 'export'),
    ...button('create', 'create_label', { path: '/createLabel' }, 'primary', 'create'),
  ];
  const row1Ops = [
    ...button('r1_view', 'r1_view_label', { path: '/viewLabel' }, 'borderless', 'view'),
    ...button('r1_copy', 'r1_copy_label', { path: '/copyLabel' }, 'borderless', 'copy'),
  ];
  const row2Ops = [
    ...button('r2_view', 'r2_view_label', { path: '/viewLabel' }, 'borderless', 'view'),
    ...button('r2_copy', 'r2_copy_label', { path: '/copyLabel' }, 'borderless', 'copy'),
  ];

  return {
    surfaceId: SURFACE_ID,
    catalogId: BASIC_CATALOG_ID,
    sendDataModel: true,
    components: [
      {
        id: 'root',
        component: 'Column',
        children: ['title', 'filter_card', 'status_tabs'],
        justify: 'start',
        align: 'stretch',
      },
      text('title', { path: '/title' }, { variant: 'h3' }),
      {
        id: 'filter_card',
        component: 'Card',
        child: 'filter_body',
      },
      {
        id: 'filter_body',
        component: 'Column',
        children: ['filter_row_1', 'filter_row_2', 'filter_actions'],
        justify: 'start',
        align: 'stretch',
      },
      {
        id: 'filter_row_1',
        component: 'Row',
        children: ['task_name', 'reward_type', 'city', 'service_line'],
        justify: 'start',
        align: 'start',
      },
      {
        id: 'task_name',
        component: 'TextField',
        label: '任务名称',
        value: { path: '/taskName' },
        variant: 'shortText',
        weight: 1,
      },
      {
        id: 'reward_type',
        component: 'ChoicePicker',
        label: '奖励类型',
        variant: 'mutuallyExclusive',
        options: [
          { label: '全部', value: 'all' },
          { label: '满减', value: 'minus' },
          { label: '折扣', value: 'discount' },
        ],
        value: { path: '/rewardType' },
        weight: 1,
      },
      {
        id: 'city',
        component: 'TextField',
        label: '城市',
        value: { path: '/city' },
        variant: 'shortText',
        weight: 1,
      },
      {
        id: 'service_line',
        component: 'ChoicePicker',
        label: '服务条线',
        variant: 'mutuallyExclusive',
        options: [
          { label: '全部', value: 'all' },
          { label: '保洁', value: 'clean' },
          { label: '维修', value: 'repair' },
        ],
        value: { path: '/serviceLine' },
        weight: 1,
      },
      {
        id: 'filter_row_2',
        component: 'Row',
        children: ['valid_from', 'biz_model'],
        justify: 'start',
        align: 'start',
      },
      {
        id: 'valid_from',
        component: 'DateTimeInput',
        label: '任务有效时间',
        value: { path: '/validFrom' },
        enableDate: true,
        enableTime: false,
        weight: 1,
      },
      {
        id: 'biz_model',
        component: 'ChoicePicker',
        label: '经营模式',
        variant: 'mutuallyExclusive',
        options: [
          { label: '全部', value: 'all' },
          { label: '自营', value: 'self' },
          { label: '加盟', value: 'join' },
        ],
        value: { path: '/bizModel' },
        weight: 1,
      },
      {
        id: 'filter_actions',
        component: 'Row',
        children: ['reset', 'query', 'export', 'create'],
        justify: 'end',
        align: 'center',
      },
      ...queryButtons,
      {
        id: 'status_tabs',
        component: 'Tabs',
        tabs: [
          { title: '审批中', child: 'table_card' },
          { title: '待生效', child: 'empty_pending' },
          { title: '生效中', child: 'empty_active' },
          { title: '已结束', child: 'empty_ended' },
        ],
      },
      {
        id: 'table_card',
        component: 'Card',
        child: 'table_block',
      },
      {
        id: 'table_block',
        component: 'Column',
        children: ['table_head', 'table_rule', 'table_list'],
        justify: 'start',
        align: 'stretch',
      },
      {
        id: 'table_rule',
        component: 'Divider',
        axis: 'horizontal',
      },
      ...rowCells('table_head', [
        '/colId',
        '/colName',
        '/colType',
        '/colCity',
        '/colTime',
        '/colOps',
      ]),
      {
        id: 'table_list',
        component: 'List',
        children: ['row_1', 'row_2'],
        direction: 'vertical',
      },
      ...rowCells(
        'row_1',
        ['/r1Id', '/r1Name', '/r1Type', '/r1City', '/r1Time'],
        row1Ops,
      ),
      ...rowCells(
        'row_2',
        ['/r2Id', '/r2Name', '/r2Type', '/r2City', '/r2Time'],
        row2Ops,
      ),
      text('empty_pending', { path: '/emptyPending' }),
      text('empty_active', { path: '/emptyActive' }),
      text('empty_ended', { path: '/emptyEnded' }),
    ],
    dataModel: {
      title: '任务管理',
      taskName: '',
      rewardType: ['all'],
      city: '',
      serviceLine: ['all'],
      validFrom: '',
      bizModel: ['all'],
      resetLabel: '重置',
      queryLabel: '查询',
      exportLabel: '导出',
      createLabel: '新建任务',
      colId: '任务编号',
      colName: '任务名称',
      colType: '奖励类型',
      colCity: '城市',
      colTime: '任务有效时间',
      colOps: '操作',
      r1Id: 'T-117',
      r1Name: '春季保洁激励',
      r1Type: '满减',
      r1City: '北京',
      r1Time: '2026-03-01 ~ 2026-06-30',
      r2Id: 'T-118',
      r2Name: '维修好评奖',
      r2Type: '折扣',
      r2City: '上海',
      r2Time: '2026-04-01 ~ 2026-09-30',
      viewLabel: '查看',
      copyLabel: '复制',
      emptyPending: '暂无待生效任务。',
      emptyActive: '暂无生效中任务。',
      emptyEnded: '暂无已结束任务。',
    },
  };
}

export const PALETTE: { type: string; label: string }[] = [
  { type: 'Column', label: 'Column' },
  { type: 'Row', label: 'Row' },
  { type: 'Card', label: 'Card' },
  { type: 'List', label: 'List' },
  { type: 'Tabs', label: 'Tabs' },
  { type: 'Modal', label: 'Modal' },
  { type: 'Divider', label: 'Divider' },
  { type: 'Text', label: 'Text' },
  { type: 'Image', label: 'Image' },
  { type: 'Icon', label: 'Icon' },
  { type: 'Video', label: 'Video' },
  { type: 'AudioPlayer', label: 'Audio' },
  { type: 'Button', label: 'Button' },
  { type: 'TextField', label: 'TextField' },
  { type: 'CheckBox', label: 'CheckBox' },
  { type: 'ChoicePicker', label: 'ChoicePicker' },
  { type: 'Slider', label: 'Slider' },
  { type: 'DateTimeInput', label: 'DateTime' },
];
