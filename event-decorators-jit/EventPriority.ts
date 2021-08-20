export enum EventPriority {
  LOWEST = 'LOWEST',
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  HIGHEST = 'HIGHEST',
  MONITOR = 'MONITOR',
}

export function* EventPriorityIterator() {
  yield EventPriority.LOWEST;
  yield EventPriority.LOW;
  yield EventPriority.NORMAL;
  yield EventPriority.HIGH;
  yield EventPriority.HIGHEST;
  yield EventPriority.MONITOR;
}
