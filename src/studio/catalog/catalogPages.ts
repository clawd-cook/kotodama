import type { A2uiMessage } from '../../editor/types';
import AudioPlayer from './fixtures/AudioPlayer.json';
import Button from './fixtures/Button.json';
import Card from './fixtures/Card.json';
import CheckBox from './fixtures/CheckBox.json';
import ChoicePicker from './fixtures/ChoicePicker.json';
import Column from './fixtures/Column.json';
import DateTimeInput from './fixtures/DateTimeInput.json';
import Divider from './fixtures/Divider.json';
import Icon from './fixtures/Icon.json';
import Image from './fixtures/Image.json';
import List from './fixtures/List.json';
import Modal from './fixtures/Modal.json';
import Row from './fixtures/Row.json';
import Slider from './fixtures/Slider.json';
import Tabs from './fixtures/Tabs.json';
import Text from './fixtures/Text.json';
import TextField from './fixtures/TextField.json';
import Video from './fixtures/Video.json';

export type CatalogName =
  | 'Column'
  | 'Row'
  | 'List'
  | 'Card'
  | 'Tabs'
  | 'Modal'
  | 'Text'
  | 'Image'
  | 'Icon'
  | 'Video'
  | 'AudioPlayer'
  | 'Divider'
  | 'Button'
  | 'TextField'
  | 'CheckBox'
  | 'ChoicePicker'
  | 'Slider'
  | 'DateTimeInput';

export const CATALOG_GROUPS: { label: string; names: CatalogName[] }[] = [
  {
    label: '布局',
    names: ['Column', 'Row', 'List', 'Card', 'Tabs', 'Modal'],
  },
  {
    label: '内容',
    names: ['Text', 'Image', 'Icon', 'Video', 'AudioPlayer', 'Divider'],
  },
  {
    label: '输入',
    names: [
      'Button',
      'TextField',
      'CheckBox',
      'ChoicePicker',
      'Slider',
      'DateTimeInput',
    ],
  },
];

export const CATALOG_BLURBS: Record<CatalogName, string> = {
  Column: '从上到下排',
  Row: '从左到右排',
  List: '把同一块重复成列表',
  Card: '把一块内容收进卡片',
  Tabs: '几组内容来回切',
  Modal: '盖在当前页上的一层',
  Text: '一段文字',
  Image: '一张图',
  Icon: '一个图标',
  Video: '一段视频',
  AudioPlayer: '一段音频',
  Divider: '一条分隔线',
  Button: '一个可点的按钮',
  TextField: '一行或一段输入',
  CheckBox: '开或关',
  ChoicePicker: '从几个选项里选',
  Slider: '拖动选一个数',
  DateTimeInput: '选日期或时间',
};

export const CATALOG_PAGES: Record<CatalogName, A2uiMessage[]> = {
  Column: Column as A2uiMessage[],
  Row: Row as A2uiMessage[],
  List: List as A2uiMessage[],
  Card: Card as A2uiMessage[],
  Tabs: Tabs as A2uiMessage[],
  Modal: Modal as A2uiMessage[],
  Text: Text as A2uiMessage[],
  Image: Image as A2uiMessage[],
  Icon: Icon as A2uiMessage[],
  Video: Video as A2uiMessage[],
  AudioPlayer: AudioPlayer as A2uiMessage[],
  Divider: Divider as A2uiMessage[],
  Button: Button as A2uiMessage[],
  TextField: TextField as A2uiMessage[],
  CheckBox: CheckBox as A2uiMessage[],
  ChoicePicker: ChoicePicker as A2uiMessage[],
  Slider: Slider as A2uiMessage[],
  DateTimeInput: DateTimeInput as A2uiMessage[],
};

export function isCatalogName(name: string): name is CatalogName {
  return Object.hasOwn(CATALOG_PAGES, name);
}
