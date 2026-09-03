import { SpeechProvider, type SpeechValue } from '../../editor/chat/speech';
import { EditorShell } from '../../editor/EditorShell';

export function Workshop({
  theme,
  active,
  speech,
}: {
  theme: 'light' | 'dark';
  active: boolean;
  speech: SpeechValue;
}) {
  return (
    <div
      className="studio-workshop"
      hidden={!active}
      {...(!active ? { inert: true, 'aria-hidden': true } : {})}
    >
      <SpeechProvider value={speech}>
        <EditorShell theme={theme} sheetId={active ? 'sheet' : undefined} />
      </SpeechProvider>
    </div>
  );
}
