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
