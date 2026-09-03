import { applyDocument } from '@src/editor/applyDocument';
import { PALETTE } from '@src/editor/demo';
import { ALLOWED_COMPONENTS, validateSnapshot } from '@src/editor/validate';
import { describe, expect, it } from 'vitest';
import { BASIC_CATALOG, surfaceMessages } from '../../helpers/apply';

function apply(components: Record<string, unknown>[], extra: object[] = []) {
  return applyDocument(
    JSON.stringify([...surfaceMessages(components), ...extra]),
    {
      surfaceId: 'main',
      catalogId: BASIC_CATALOG,
      sendDataModel: true,
      components: [],
      dataModel: {},
    },
  );
}

describe('validateSnapshot', () => {
  it('rejects the wrong protocol version', () => {
    const result = applyDocument(
      JSON.stringify([
        {
          version: 'v0.8',
          createSurface: {
            surfaceId: 'main',
            catalogId: BASIC_CATALOG,
            sendDataModel: true,
          },
        },
      ]),
      {
        surfaceId: 'main',
        catalogId: BASIC_CATALOG,
        sendDataModel: true,
        components: [],
        dataModel: {},
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('VERSION');
    }
  });

  it('rejects duplicate ids on a snapshot', () => {
    const error = validateSnapshot(
      {
        surfaceId: 'main',
        catalogId: BASIC_CATALOG,
        sendDataModel: true,
        components: [
          { id: 'root', component: 'Column', children: ['a'] },
          { id: 'a', component: 'Text', text: '一', variant: 'body' },
          { id: 'a', component: 'Text', text: '二', variant: 'body' },
        ],
        dataModel: {},
      },
      surfaceMessages([
        { id: 'root', component: 'Column', children: ['a'] },
        { id: 'a', component: 'Text', text: '一', variant: 'body' },
        { id: 'a', component: 'Text', text: '二', variant: 'body' },
      ]),
    );
    expect(error?.code).toBe('DUPLICATE_ID');
  });

  it('rejects a dangling child id', () => {
    const result = apply([
      { id: 'root', component: 'Column', children: ['missing'] },
    ]);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe('DANGLING_REF');
      expect(result.message).toContain('missing');
    }
  });

  it('rejects a non-object message', () => {
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [{ id: 'root', component: 'Text', text: 'x' }],
          dataModel: {},
        },
        ['nope'],
      )?.code,
    ).toBe('MESSAGE');
  });

  it('lists the same components as the palette', () => {
    expect(PALETTE.map((item) => item.type).toSorted()).toEqual(
      [...ALLOWED_COMPONENTS].toSorted(),
    );
  });
});
