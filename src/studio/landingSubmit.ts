export const PROMPT_ITEMS = [
  { key: 'login', label: '做一个登录表单' },
  { key: 'settings', label: '做一个设置页' },
  { key: 'list', label: '做一个带筛选的列表' },
];

export type LandingSubmit =
  | { autoSend: string }
  | { prefill: string };

export function landingSubmit(text: string, ready: boolean): LandingSubmit {
  return ready ? { autoSend: text } : { prefill: text };
}
