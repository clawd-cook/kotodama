function stripFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json|jsonl)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function tryParse(text: string): unknown | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function healLine(line: string): unknown | undefined {
  const patched = line.replace(/,\s*([\]}])/g, '$1');
  const direct = tryParse(patched);
  if (direct !== undefined) {
    return direct;
  }
  for (let i = 1; i <= 6; i += 1) {
    const closed = tryParse(patched + '}'.repeat(i));
    if (closed !== undefined) {
      return closed;
    }
  }
  return undefined;
}

export function extractA2uiMessages(raw: string): unknown[] {
  const text = stripFences(raw);
  const parsed = tryParse(text);
  if (Array.isArray(parsed)) {
    return parsed;
  }
  if (parsed && typeof parsed === 'object') {
    return [parsed];
  }

  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start >= 0 && end > start) {
    const sliced = tryParse(text.slice(start, end + 1));
    if (Array.isArray(sliced)) {
      return sliced;
    }
  }

  const blocks: unknown[] = [];
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('{')) {
      continue;
    }
    const value = healLine(trimmed);
    if (value) {
      blocks.push(value);
    }
  }
  if (blocks.length === 0) {
    throw new Error('模型输出里没有解析到 A2UI JSON');
  }
  return blocks;
}
