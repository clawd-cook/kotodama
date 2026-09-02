import { SURFACE_ID } from './snapshot';
import { BASIC_CATALOG_ID, type Snapshot } from './types';

export function createDemoSnapshot(): Snapshot {
  return {
    surfaceId: SURFACE_ID,
    catalogId: BASIC_CATALOG_ID,
    sendDataModel: true,
    components: [
      {
        id: 'root',
        component: 'Column',
        children: ['title', 'name_field', 'submit'],
        justify: 'start',
        align: 'stretch',
      },
      {
        id: 'title',
        component: 'Text',
        text: { path: '/title' },
        variant: 'h3',
      },
      {
        id: 'name_field',
        component: 'TextField',
        label: '名字',
        value: { path: '/name' },
        variant: 'shortText',
      },
      {
        id: 'submit',
        component: 'Button',
        child: 'submit_label',
        variant: 'primary',
        action: {
          event: {
            name: 'submitted',
            context: { name: { path: '/name' } },
          },
        },
      },
      {
        id: 'submit_label',
        component: 'Text',
        text: { path: '/submitLabel' },
      },
    ],
    dataModel: {
      title: '欢迎使用言灵',
      name: '',
      submitLabel: '提交',
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
