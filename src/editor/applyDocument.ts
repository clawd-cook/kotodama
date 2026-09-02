import { foldMessages } from './snapshot';
import type { Snapshot } from './types';
import { validateSnapshot } from './validate';

export type ApplyResult =
  | { ok: true; snapshot: Snapshot }
  | { ok: false; code: string; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function unwrapMessages(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (isRecord(parsed) && Array.isArray(parsed.messages)) {
    return parsed.messages;
  }
  return null;
}

export function applyDocument(text: string, current: Snapshot): ApplyResult {
  void current;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, code: 'PARSE', message: '不是合法的 JSON。' };
  }

  const messages = unwrapMessages(parsed);
  if (!messages) {
    return {
      ok: false,
      code: 'PARSE',
      message: '源文件必须是 A2UI 消息数组。',
    };
  }

  const snapshot = foldMessages(messages);
  const error = validateSnapshot(snapshot, messages);
  if (error) {
    return { ok: false, code: error.code, message: error.message };
  }
  return { ok: true, snapshot };
}
