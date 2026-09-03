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

  it('rejects deleteSurface, extra surfaces, and the wrong catalog', () => {
    const base = {
      surfaceId: 'main',
      catalogId: BASIC_CATALOG,
      sendDataModel: true,
      components: [{ id: 'root', component: 'Text', text: 'x', variant: 'body' }],
      dataModel: {},
    };
    expect(
      validateSnapshot(base, [
        {
          version: 'v0.9',
          deleteSurface: { surfaceId: 'main' },
        },
      ])?.code,
    ).toBe('DELETE_SURFACE');
    expect(
      validateSnapshot(base, [
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'other',
            catalogId: BASIC_CATALOG,
            sendDataModel: true,
          },
        },
      ])?.code,
    ).toBe('SURFACE_ID');
    expect(
      validateSnapshot(base, [
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'main',
            catalogId: 'https://example.com/catalog.json',
            sendDataModel: true,
          },
        },
      ])?.code,
    ).toBe('CATALOG');
    expect(
      validateSnapshot(base, [
        {
          version: 'v0.9',
          createSurface: {
            surfaceId: 'main',
            catalogId: BASIC_CATALOG,
            sendDataModel: true,
          },
        },
        {
          version: 'v0.9',
          updateComponents: { surfaceId: 'side', components: [] },
        },
      ])?.code,
    ).toBe('SURFACE_ID');
  });

  it('rejects snapshot identity problems', () => {
    const messages = surfaceMessages([
      { id: 'root', component: 'Text', text: 'x', variant: 'body' },
    ]);
    expect(
      validateSnapshot(
        {
          surfaceId: 'side',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [{ id: 'root', component: 'Text', text: 'x', variant: 'body' }],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('SURFACE_ID');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: 'other',
          sendDataModel: true,
          components: [{ id: 'root', component: 'Text', text: 'x', variant: 'body' }],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('CATALOG');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('EMPTY');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [{ id: '', component: 'Text', text: 'x', variant: 'body' }],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('ID');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [{ id: 'page', component: 'Text', text: 'x', variant: 'body' }],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('ROOT');
  });

  it('rejects unknown types, inline children, and bad props', () => {
    const messages = surfaceMessages([
      { id: 'root', component: 'Column', children: ['a'] },
    ]);
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [{ id: 'root', component: '', children: [] }],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('UNKNOWN_COMPONENT');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [{ id: 'root', component: 'Table' }],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('UNKNOWN_COMPONENT');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [
            {
              id: 'root',
              component: 'Column',
              children: [{ component: 'Text', text: 'x' }],
            },
          ],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('INLINE_CHILDREN');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [
            { id: 'root', component: 'Column', children: { nope: true } },
          ],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('INLINE_CHILDREN');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [
            {
              id: 'root',
              component: 'Text',
              text: 'x',
              variant: 'body',
              className: 'nope',
            },
          ],
          dataModel: {},
        },
        messages,
      )?.message,
    ).toContain('className');
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [{ id: 'root', component: 'Text' }],
          dataModel: {},
        },
        messages,
      )?.code,
    ).toBe('PROPS');
  });

  it('accepts componentId child refs', () => {
    expect(
      validateSnapshot(
        {
          surfaceId: 'main',
          catalogId: BASIC_CATALOG,
          sendDataModel: true,
          components: [
            {
              id: 'root',
              component: 'Column',
              children: [{ componentId: 'title' }],
              justify: 'start',
              align: 'stretch',
            },
            { id: 'title', component: 'Text', text: 'x', variant: 'body' },
          ],
          dataModel: {},
        },
        surfaceMessages([
          {
            id: 'root',
            component: 'Column',
            children: [{ componentId: 'title' }],
          },
          { id: 'title', component: 'Text', text: 'x', variant: 'body' },
        ]),
      ),
    ).toBeNull();
  });
});
