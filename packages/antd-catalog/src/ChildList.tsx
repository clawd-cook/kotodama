import type { ComponentContext } from '@a2ui/web_core/v0_9';
import { Fragment, type ReactNode } from 'react';

type ChildRef = string | { id: string; basePath: string };

export function ChildList({
  childList,
  buildChild,
}: {
  childList: ChildRef[] | undefined;
  context: ComponentContext;
  buildChild: (id: string, basePath?: string) => ReactNode;
}) {
  if (!Array.isArray(childList)) {
    return null;
  }

  return (
    <>
      {childList.map((childRef) => {
        if (typeof childRef === 'string') {
          return <Fragment key={childRef}>{buildChild(childRef)}</Fragment>;
        }
        return (
          <Fragment key={`${childRef.id}-${childRef.basePath}`}>
            {buildChild(childRef.id, childRef.basePath)}
          </Fragment>
        );
      })}
    </>
  );
}
