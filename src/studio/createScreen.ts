import type { Snapshot } from '../editor/types';

export function createScreen(_input: {
  snapshot: Snapshot;
  visitedWorkshop: boolean;
}): 'workshop' {
  return 'workshop';
}
