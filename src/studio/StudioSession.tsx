import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type StudioSessionValue = {
  visitedWorkshop: boolean;
  markVisitedWorkshop: () => void;
  resetCount: number;
  bumpThread: () => void;
};

const StudioSessionContext = createContext<StudioSessionValue | null>(null);

export function StudioSessionProvider({ children }: { children: ReactNode }) {
  const [visitedWorkshop, setVisitedWorkshop] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const markVisitedWorkshop = useCallback(() => {
    setVisitedWorkshop(true);
  }, []);
  const bumpThread = useCallback(() => {
    setResetCount((count) => count + 1);
  }, []);
  const value = useMemo(
    () => ({
      visitedWorkshop,
      markVisitedWorkshop,
      resetCount,
      bumpThread,
    }),
    [bumpThread, markVisitedWorkshop, resetCount, visitedWorkshop],
  );
  return (
    <StudioSessionContext.Provider value={value}>
      {children}
    </StudioSessionContext.Provider>
  );
}

export function useStudioSession() {
  const value = useContext(StudioSessionContext);
  if (!value) {
    throw new Error('useStudioSession must be used within StudioSessionProvider');
  }
  return value;
}
