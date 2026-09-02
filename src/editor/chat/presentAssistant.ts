import type { ApplyResult } from '../applyDocument';
import { FALLBACK_SUMMARY, pageUnchanged } from '../copy';
import { parseChatOutput } from './parseA2ui';

export { STREAMING_PLACEHOLDER } from '../copy';

export function presentAssistant(
  raw: string,
  applyResult: ApplyResult,
): string {
  if (!applyResult.ok) {
    return pageUnchanged(applyResult.message);
  }
  try {
    return parseChatOutput(raw).summary;
  } catch {
    return FALLBACK_SUMMARY;
  }
}
