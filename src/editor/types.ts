export const BASIC_CATALOG_ID =
  'https://a2ui.org/specification/v0_9/catalogs/basic/catalog.json';

export type A2uiComponent = {
  id: string;
  component: string;
  [key: string]: unknown;
};

export type Snapshot = {
  surfaceId: string;
  catalogId: string;
  sendDataModel: boolean;
  components: A2uiComponent[];
  dataModel: unknown;
};

export type A2uiMessage = {
  version: 'v0.9' | 'v0.9.1';
  createSurface?: {
    surfaceId: string;
    catalogId: string;
    sendDataModel?: boolean;
  };
  updateComponents?: {
    surfaceId: string;
    components: A2uiComponent[];
  };
  updateDataModel?: {
    surfaceId: string;
    path?: string;
    value?: unknown;
  };
  deleteSurface?: {
    surfaceId: string;
  };
};

export type EditorError = {
  id: string;
  message: string;
  source: 'json' | 'protocol' | 'preview' | 'chat';
};

export type EditorEvent = {
  id: string;
  at: string;
  action: unknown;
};
