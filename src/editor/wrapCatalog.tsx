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
    const className = `a2ui-selectable${selected ? ' is-selected' : ''}${hovered ? ' is-hovered' : ''}`;
    const selectIfTarget = (
      target: EventTarget | null,
      current: EventTarget,
    ) => {
      const closest = (target as HTMLElement).closest('.a2ui-selectable');
      if (closest !== current) {
        return;
      }
      onSelect(id);
    };
    const onClick = (event: MouseEvent<HTMLDivElement>) => {
      selectIfTarget(event.target, event.currentTarget);
    };
    const onMouseOver = (event: MouseEvent<HTMLDivElement>) => {
      event.stopPropagation();
      onHover(id);
    };
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: editor selection chrome wraps possibly interactive catalog children
      <div
        data-a2ui-id={id}
        className={className}
        onClick={onClick}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' && event.key !== ' ') {
            return;
          }
          selectIfTarget(event.target, event.currentTarget);
        }}
        onMouseOver={onMouseOver}
        onFocus={() => onHover(id)}
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
