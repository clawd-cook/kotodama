import { useMemo } from 'react';
import { SpeechProvider } from '../../editor/chat/speech';
import { useEditor } from '../../editor/EditorState';
import { EditorShell } from '../../editor/EditorShell';
import { useLayoutTheme } from '../../layout/theme';
import { useChannel } from '../../studio/ChannelContext';

export function Workshop() {
  const theme = useLayoutTheme();
  const { resolved, override } = useChannel();
  const { threadKey } = useEditor();
  const speech = useMemo(
    () => ({
      ready: resolved.ready,
      model: resolved.model,
      override,
      resetCount: threadKey,
    }),
    [override, resolved.model, resolved.ready, threadKey],
  );

  return (
    <div className="studio-workshop">
      <SpeechProvider value={speech}>
        <EditorShell theme={theme} sheetId="sheet" />
      </SpeechProvider>
    </div>
  );
}
