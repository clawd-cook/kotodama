export const STREAMING_PLACEHOLDER = '正在写下这一页…';
export const FALLBACK_SUMMARY = '已更新界面。';

export function trimReason(reason: string): string {
  return reason.replace(/^[。.\s]+|[。.\s]+$/g, '');
}

export function pageUnchanged(reason: string): string {
  return `页面没改。${trimReason(reason)}。`;
}

export function openFailed(reason: string): string {
  return `没有打开。${trimReason(reason)}。`;
}

export const CHANNEL_UNREADY =
  '通道没配好。去设置里填 Base URL、API Key 和模型名。';

export const ACTION_RECORDED = '已记下事件。';

export function actionToastText(action: unknown): string {
  if (action && typeof action === 'object' && 'name' in action) {
    const name = (action as { name: unknown }).name;
    if (typeof name === 'string' && name.length > 0) {
      return `已记下事件：${name}`;
    }
  }
  return ACTION_RECORDED;
}
