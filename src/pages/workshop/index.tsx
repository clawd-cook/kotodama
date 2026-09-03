import { useMemo } from 'react';
import { SpeechProvider } from '../../editor/chat/speech';
import { EditorShell } from '../../editor/EditorShell';
import { useChannel } from '../../studio/ChannelContext';
import { useStudioSession } from '../../studio/StudioSession';

export function Workshop({ theme }: { theme: 'light' | 'dark' }) {
  const { resolved, override } = useChannel();
  const { resetCount, landing, clearLanding } = useStudioSession();
  const speech = useMemo(
    () => ({
      ready: resolved.ready,
      model: resolved.model,
      override,
      landing,
      clearLanding,
      resetCount,
    }),
    [
      clearLanding,
      landing,
      override,
      resetCount,
      resolved.model,
      resolved.ready,
    ],
  );

  return (
    <div className="studio-workshop">
      <SpeechProvider value={speech}>
        <EditorShell theme={theme} sheetId="sheet" />
      </SpeechProvider>
    </div>
  );
}
