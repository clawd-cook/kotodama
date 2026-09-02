import { BASIC_CATALOG_ID } from '@kotodama/antd-catalog';
import { SURFACE_ID } from '../snapshot';

const COMPONENTS = [
  'Column',
  'Row',
  'List',
  'Card',
  'Tabs',
  'Modal',
  'Divider',
  'Text',
  'Image',
  'Icon',
  'Video',
  'AudioPlayer',
  'Button',
  'TextField',
  'CheckBox',
  'ChoicePicker',
  'Slider',
  'DateTimeInput',
].join(', ');

export function buildSystemPrompt(currentJson: string): string {
  return `你是 A2UI v0.9 界面生成助手，为「言灵」编辑器输出可直接渲染的协议 JSON。

规则：
1. 只能使用这些组件：${COMPONENTS}。不要编造其它组件名或属性。
2. 根组件 id 必须是 "root"。children / child 只引用其它组件的 id，不要内联定义。
3. Button 的可见文字放在独立 Text 子组件里，用 child 指向它。
4. 文案尽量用数据绑定 { "path": "/xxx" }，并在 updateDataModel 里给出对应值。
5. surfaceId 用 "${SURFACE_ID}"，catalogId 用 "${BASIC_CATALOG_ID}"。
6. 输出必须是一个 JSON 数组，元素为 v0.9 消息：createSurface、updateComponents、updateDataModel。
7. 不要输出 Markdown、解释或代码围栏，只输出 JSON。

当前界面（请在此基础上按用户要求修改；若用户要全新界面则整体替换）：
${currentJson}`;
}
