import type { ReactComponentImplementation } from '@a2ui/react/v0_9';
import { Catalog } from '@a2ui/web_core/v0_9';
import { antdCatalog } from '@kotodama/antd-catalog';
import {
  createContext,
  type MouseEvent,
  type ReactNode,
  useContext,
} from 'react';

export type SelectionApi = {
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
};

const SelectionContext = createContext<SelectionApi>({
  selectedId: null,
  hoveredId: null,
  onSelect: () => undefined,
  onHover: () => undefined,
});

export function SelectionProvider({
  value,
  children,
}: {
  value: SelectionApi;
  children: ReactNode;
}) {
  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
}

function wrapImpl(
  impl: ReactComponentImplementation,
): ReactComponentImplementation {
  const Inner = impl.render;
  const Wrapped: ReactComponentImplementation['render'] = (props) => {
    const { selectedId, hoveredId, onSelect, onHover } =
      useContext(SelectionContext);
    const id = props.context.componentModel.id;
    const selected = selectedId === id;
    const hovered = hoveredId === id && !selected;
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: selection is also driven from the component tree
      // biome-ignore lint/a11y/useKeyWithMouseEvents: hover is visual-only
      // biome-ignore lint/a11y/noStaticElementInteractions: overlay for selection; nested widgets stay the controls
      <div>
        data-a2ui-id={id}
        className={`a2ui-selectable${selected ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}`}
        onClick={(event: MouseEvent<HTMLDivElement>) => {
          const closest = (event.target as HTMLElement).closest(
            '.a2ui-selectable',
          );
          if (closest !== event.currentTarget) {
            return;
          }
          onSelect(id);
        }}
        onMouseOver={(event: MouseEvent<HTMLDivElement>) => {
          event.stopPropagation();
          onHover(id);
        }}
      >
        <Inner {...props} />
      </div>
    );
  };
  return { name: impl.name, schema: impl.schema, render: Wrapped };
}

export const editorCatalog = new Catalog(
  antdCatalog.id,
  [...antdCatalog.components.values()].map(wrapImpl),
  [...antdCatalog.functions.values()],
);
