import { applyDocument } from '@src/editor/applyDocument';
import { createDemoSnapshot } from '@src/editor/demo';
import { foldMessages, toMessages } from '@src/editor/snapshot';
import { emptySnapshot } from '@src/editor/storage';
import type { A2uiComponent, Snapshot } from '@src/editor/types';

export function applyFixture(doc: unknown, current = createDemoSnapshot()) {
  return applyDocument(JSON.stringify(doc), current);
}

export function applyOntoEmpty(doc: unknown) {
  return applyDocument(JSON.stringify(doc), emptySnapshot());
}

export function componentsOf(snapshot: Snapshot): A2uiComponent[] {
  return snapshot.components;
}

export function dataText(snapshot: Snapshot): string {
  return JSON.stringify(snapshot.dataModel ?? {});
}

export function roundTrip(doc: unknown) {
  const result = applyFixture(doc);
  if (!result.ok) {
    return result;
  }
  const folded = foldMessages(
    JSON.parse(JSON.stringify(toMessages(result.snapshot))),
  );
  return applyDocument(JSON.stringify(toMessages(folded)), createDemoSnapshot());
}

export function rootColumn(children: string[] = []): Snapshot {
  return {
    ...emptySnapshot(),
    components: [
      {
        id: 'root',
        component: 'Column',
        children,
        justify: 'start',
        align: 'stretch',
      },
    ],
  };
}

export const BASIC_CATALOG =
  'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

export function surfaceMessages(
  components: Record<string, unknown>[],
  dataModel: Record<string, unknown> = {},
) {
  return [
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
      updateComponents: {
        surfaceId: 'main',
        components,
      },
    },
    {
      version: 'v0.9',
      updateDataModel: {
        surfaceId: 'main',
        path: '/',
        value: dataModel,
      },
    },
  ];
}
