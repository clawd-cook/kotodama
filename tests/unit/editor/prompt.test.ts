import { buildSystemPrompt } from '@src/editor/chat/prompt';
import { ALLOWED_COMPONENTS } from '@src/editor/validate';
import { BASIC_CATALOG_ID } from '@catalog/catalogId';
import { describe, expect, it } from 'vitest';

describe('buildSystemPrompt', () => {
  it('embeds the current page JSON and catalog constraints', () => {
    const prompt = buildSystemPrompt('{"ok":true}');
    expect(prompt).toContain('A2UI v0.9');
    expect(prompt).toContain(BASIC_CATALOG_ID);
    expect(prompt).toContain('{"ok":true}');
    for (const name of ALLOWED_COMPONENTS) {
      expect(prompt).toContain(name);
    }
    expect(prompt).toContain('禁止写 type、placeholder、className、style');
    expect(prompt).toContain('不要编造 Toast');
  });
});
