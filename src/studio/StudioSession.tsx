import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { LandingSubmit } from '../editor/chat/speech';

type StudioSessionValue = {
  visitedWorkshop: boolean;
  markVisitedWorkshop: () => void;
  resetCount: number;
  bumpThread: () => void;
  landing: LandingSubmit | null;
  setLanding: (payload: LandingSubmit) => void;
  clearLanding: () => void;
};

const StudioSessionContext = createContext<StudioSessionValue | null>(null);

export function StudioSessionProvider({ children }: { children: ReactNode }) {
  const [visitedWorkshop, setVisitedWorkshop] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const [landing, setLandingState] = useState<LandingSubmit | null>(null);
  const markVisitedWorkshop = useCallback(() => {
    setVisitedWorkshop(true);
  }, []);
  const bumpThread = useCallback(() => {
    setResetCount((count) => count + 1);
  }, []);
  const setLanding = useCallback((payload: LandingSubmit) => {
    setLandingState(payload);
    setVisitedWorkshop(true);
  }, []);
  const clearLanding = useCallback(() => {
    setLandingState(null);
  }, []);
  const value = useMemo(
    () => ({
      visitedWorkshop,
      markVisitedWorkshop,
      resetCount,
      bumpThread,
      landing,
      setLanding,
      clearLanding,
    }),
    [
      bumpThread,
      clearLanding,
      landing,
      markVisitedWorkshop,
      resetCount,
      setLanding,
      visitedWorkshop,
    ],
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
    throw new Error(
      'useStudioSession must be used within StudioSessionProvider',
    );
  }
  return value;
}
