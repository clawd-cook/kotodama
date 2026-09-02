import { BASIC_COMPONENTS } from '@a2ui/web_core/v0_9/basic_catalog';

const FORBIDDEN = new Set(['id', 'component', 'placeholder', 'className']);

type CatalogApi = {
  name: string;
  schema: {
    shape?: Record<string, unknown>;
    _def?: {
      shape?: Record<string, unknown> | (() => Record<string, unknown>);
    };
  };
};

function schemaShape(name: string): Record<string, unknown> {
  const api = (BASIC_COMPONENTS as CatalogApi[]).find(
    (item) => item.name === name,
  );
  const raw = api?.schema.shape ?? api?.schema._def?.shape;
  return typeof raw === 'function' ? raw() : (raw ?? {});
}

export function catalogPropertyNames(name: string): string[] {
  return Object.keys(schemaShape(name)).filter((key) => !FORBIDDEN.has(key));
}
