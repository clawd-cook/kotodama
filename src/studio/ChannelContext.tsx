import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  type ChannelFields,
  type ResolvedChannel,
  channelOverride,
  emptyChannel,
  loadChannel,
  resolveChannel,
  saveChannel,
} from './channel';

type ChatHealth = {
  ok?: boolean;
  env?: {
    baseUrl?: string;
    model?: string;
    hasApiKey?: boolean;
  };
};

type ChannelContextValue = {
  ui: ChannelFields;
  env: ChannelFields;
  resolved: ResolvedChannel;
  save: (fields: ChannelFields) => 'saved' | 'cleared';
  override: Partial<ChannelFields> | undefined;
};

const ChannelContext = createContext<ChannelContextValue | null>(null);

function envFromHealth(health: ChatHealth | null): ChannelFields {
  return {
    baseUrl: health?.env?.baseUrl ?? '',
    apiKey: health?.env?.hasApiKey ? 'set' : '',
    model: health?.env?.model ?? '',
  };
}

export function ChannelProvider({ children }: { children: ReactNode }) {
  const [ui, setUi] = useState<ChannelFields>(loadChannel);
  const [env, setEnv] = useState<ChannelFields>(emptyChannel);

  useEffect(() => {
    void fetch('/api/chat/health')
      .then((response) => response.json())
      .then((data: ChatHealth) => {
        setEnv(envFromHealth(data));
      })
      .catch(() => {
        setEnv(emptyChannel());
      });
  }, []);

  const save = useCallback((fields: ChannelFields) => {
    const result = saveChannel(fields);
    setUi(loadChannel());
    return result;
  }, []);

  const resolved = resolveChannel(ui, env);
  const override = channelOverride(ui);
  const value = useMemo(
    () => ({ ui, env, resolved, save, override }),
    [env, override, resolved, save, ui],
  );

  return (
    <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
  );
}

export function useChannel() {
  const value = useContext(ChannelContext);
  if (!value) {
    throw new Error('useChannel must be used within ChannelProvider');
  }
  return value;
}
