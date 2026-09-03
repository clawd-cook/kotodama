import { createContext, type ReactNode, useContext } from 'react';

export const PROMPT_ITEMS = [
  { key: 'login', label: '做一个登录表单' },
  { key: 'settings', label: '做一个设置页' },
  { key: 'list', label: '做一个带筛选的列表' },
];

export type LandingSubmit = { autoSend: string } | { prefill: string };

export function landingSubmit(text: string, ready: boolean): LandingSubmit {
  return ready ? { autoSend: text } : { prefill: text };
}

export type SpeechChannelOverride = {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
};

export type SpeechValue = {
  ready: boolean;
  model: string;
  override: SpeechChannelOverride | undefined;
  landing: LandingSubmit | null;
  clearLanding: () => void;
  resetCount: number;
};

const SpeechContext = createContext<SpeechValue | null>(null);

export function SpeechProvider({
  value,
  children,
}: {
  value: SpeechValue;
  children: ReactNode;
}) {
  return (
    <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>
  );
}

export function useSpeech() {
  const speech = useContext(SpeechContext);
  if (!speech) {
    throw new Error('useSpeech must be used within SpeechProvider');
  }
  return speech;
}
