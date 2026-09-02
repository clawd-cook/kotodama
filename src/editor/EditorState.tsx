import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { applyDocument } from './applyDocument';
import { openFailed, pageUnchanged } from './copy';
import { createDemoSnapshot } from './demo';
import {
  deleteComponent,
  duplicateComponent,
  insertComponent,
  updateComponentProps,
} from './ops';
import { toMessages } from './snapshot';
import { loadDraft, saveDraft } from './storage';
import type { EditorError, EditorEvent, Snapshot } from './types';
import { validateSnapshot } from './validate';

type EditorContextValue = {
  snapshot: Snapshot;
  selectedId: string | null;
  hoveredId: string | null;
  errors: EditorError[];
  events: EditorEvent[];
  jsonText: string;
  jsonError: string | null;
  canUndo: boolean;
  canRedo: boolean;
  setSelectedId: (id: string | null) => void;
  setHoveredId: (id: string | null) => void;
  insert: (type: string) => void;
  removeSelected: () => void;
  duplicateSelected: () => void;
  updateSelectedProps: (props: Record<string, unknown>) => string | null;
  setDataModel: (value: unknown) => void;
  applyJson: (text: string) => boolean;
  openJson: (text: string) => string | null;
  setJsonText: (text: string) => void;
  undo: () => void;
  redo: () => void;
  reset: () => void;
  logEvent: (action: unknown) => void;
  logError: (message: string, source: EditorError['source']) => void;
  clearErrors: (source?: EditorError['source']) => void;
  syncDataModelFromPreview: (value: unknown) => void;
};

const EditorContext = createContext<EditorContextValue | null>(null);

function stringifyMessages(snapshot: Snapshot) {
  return `${JSON.stringify(toMessages(snapshot), null, 2)}\n`;
}

export function EditorProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot>(() => loadDraft());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [errors, setErrors] = useState<EditorError[]>([]);
  const [events, setEvents] = useState<EditorEvent[]>([]);
  const [jsonText, setJsonText] = useState(() =>
    stringifyMessages(loadDraft()),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);

  useEffect(() => {
    saveDraft(snapshot);
    if (!jsonError) {
      setJsonText(stringifyMessages(snapshot));
    }
  }, [jsonError, snapshot]);

  const commit = useCallback(
    (next: Snapshot) => {
      setPast((current) => [...current.slice(-49), snapshot]);
      setFuture([]);
      setSnapshot(next);
    },
    [snapshot],
  );

  const rejectIfInvalid = useCallback(
    (next: Snapshot): string | null => {
      const error = validateSnapshot(next, toMessages(next));
      if (error) {
        return pageUnchanged(error.message);
      }
      commit(next);
      return null;
    },
    [commit],
  );

  const insert = useCallback(
    (type: string) => {
      const result = insertComponent(snapshot, type, selectedId);
      const message = rejectIfInvalid(result.snapshot);
      if (message) {
        setErrors((current) => [
          {
            id: crypto.randomUUID(),
            message,
            source: 'json',
          },
          ...current,
        ]);
        return;
      }
      setSelectedId(result.selectedId);
    },
    [rejectIfInvalid, selectedId, snapshot],
  );

  const removeSelected = useCallback(() => {
    if (!selectedId || selectedId === 'root') {
      return;
    }
    const message = rejectIfInvalid(deleteComponent(snapshot, selectedId));
    if (message) {
      setErrors((current) => [
        { id: crypto.randomUUID(), message, source: 'json' },
        ...current,
      ]);
      return;
    }
    setSelectedId('root');
  }, [rejectIfInvalid, selectedId, snapshot]);

  const duplicateSelected = useCallback(() => {
    if (!selectedId) {
      return;
    }
    const result = duplicateComponent(snapshot, selectedId);
    const message = rejectIfInvalid(result.snapshot);
    if (message) {
      setErrors((current) => [
        { id: crypto.randomUUID(), message, source: 'json' },
        ...current,
      ]);
      return;
    }
    setSelectedId(result.selectedId);
  }, [rejectIfInvalid, selectedId, snapshot]);

  const updateSelectedProps = useCallback(
    (props: Record<string, unknown>) => {
      if (!selectedId) {
        return null;
      }
      return rejectIfInvalid(
        updateComponentProps(snapshot, selectedId, props),
      );
    },
    [rejectIfInvalid, selectedId, snapshot],
  );

  const setDataModel = useCallback(
    (value: unknown) => {
      commit({ ...snapshot, dataModel: value });
    },
    [commit, snapshot],
  );

  const syncDataModelFromPreview = useCallback((value: unknown) => {
    setSnapshot((current) => ({ ...current, dataModel: value }));
  }, []);

  const applyJson = useCallback(
    (text: string): boolean => {
      const result = applyDocument(text, snapshot);
      if (!result.ok) {
        setJsonError(result.message);
        setErrors((current) => [
          ...current.filter((item) => item.source !== 'json'),
          {
            id: crypto.randomUUID(),
            message: result.message,
            source: 'json',
          },
        ]);
        return false;
      }
      commit(result.snapshot);
      setJsonError(null);
      setErrors((current) => current.filter((item) => item.source !== 'json'));
      return true;
    },
    [commit, snapshot],
  );

  const openJson = useCallback(
    (text: string): string | null => {
      const result = applyDocument(text, snapshot);
      if (!result.ok) {
        const message = openFailed(result.message);
        setErrors((current) => [
          ...current.filter((item) => item.source !== 'json'),
          { id: crypto.randomUUID(), message, source: 'json' },
        ]);
        return message;
      }
      commit(result.snapshot);
      setJsonError(null);
      setErrors((current) => current.filter((item) => item.source !== 'json'));
      return null;
    },
    [commit, snapshot],
  );

  const undo = useCallback(() => {
    const previous = past[past.length - 1];
    if (!previous) {
      return;
    }
    setPast(past.slice(0, -1));
    setFuture([snapshot, ...future]);
    setSnapshot(previous);
  }, [future, past, snapshot]);

  const redo = useCallback(() => {
    const next = future[0];
    if (!next) {
      return;
    }
    setFuture(future.slice(1));
    setPast([...past, snapshot]);
    setSnapshot(next);
  }, [future, past, snapshot]);

  const reset = useCallback(() => {
    commit(createDemoSnapshot());
    setSelectedId(null);
    setEvents([]);
    setErrors([]);
  }, [commit]);

  const logEvent = useCallback((action: unknown) => {
    setEvents((current) =>
      [
        { id: crypto.randomUUID(), at: new Date().toISOString(), action },
        ...current,
      ].slice(0, 100),
    );
  }, []);

  const logError = useCallback(
    (message: string, source: EditorError['source']) => {
      setErrors((current) =>
        [{ id: crypto.randomUUID(), message, source }, ...current].slice(0, 50),
      );
    },
    [],
  );

  const clearErrors = useCallback((source?: EditorError['source']) => {
    setErrors((current) =>
      source ? current.filter((item) => item.source !== source) : [],
    );
  }, []);

  const value = useMemo<EditorContextValue>(
    () => ({
      snapshot,
      selectedId,
      hoveredId,
      errors,
      events,
      jsonText,
      jsonError,
      canUndo: past.length > 0,
      canRedo: future.length > 0,
      setSelectedId,
      setHoveredId,
      insert,
      removeSelected,
      duplicateSelected,
      updateSelectedProps,
      setDataModel,
      applyJson,
      openJson,
      setJsonText,
      undo,
      redo,
      reset,
      logEvent,
      logError,
      clearErrors,
      syncDataModelFromPreview,
    }),
    [
      applyJson,
      openJson,
      clearErrors,
      duplicateSelected,
      errors,
      events,
      future.length,
      hoveredId,
      insert,
      jsonError,
      jsonText,
      logError,
      logEvent,
      past.length,
      redo,
      removeSelected,
      reset,
      selectedId,
      setDataModel,
      snapshot,
      syncDataModelFromPreview,
      undo,
      updateSelectedProps,
    ],
  );

  return (
    <EditorContext.Provider value={value}>{children}</EditorContext.Provider>
  );
}

export function useEditor() {
  const value = useContext(EditorContext);
  if (!value) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return value;
}
