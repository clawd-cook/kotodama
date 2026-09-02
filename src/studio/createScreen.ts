import { isCurrentPage } from '../editor/storage';
import type { Snapshot } from '../editor/types';

export function createScreen({
  snapshot,
  visitedWorkshop,
}: {
  snapshot: Snapshot;
  visitedWorkshop: boolean;
}): 'landing' | 'workshop' {
  if (isCurrentPage(snapshot) || visitedWorkshop) {
    return 'workshop';
  }
  return 'landing';
}
