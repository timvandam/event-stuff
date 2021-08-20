import { ClassConstructor } from '../type-tools';
import { Event } from './Event';
import { EventPriority } from './EventPriority';

export type EventHandlerData = {
  priority: EventPriority;
  ignoreCancelled: boolean;
  inheritance: boolean;
  functionName: string;
  listenerClass: ClassConstructor<any>;
};

class Container {
  private container = new Map<ClassConstructor<Event>, EventHandlerData[]>();

  getEventClasses() {
    return [...this.container.keys()];
  }

  get<T extends Event>(eventConstructor: ClassConstructor<T>): EventHandlerData[] {
    if (this.container.has(eventConstructor)) {
      return this.container.get(eventConstructor) as EventHandlerData[];
    } else {
      const arr: EventHandlerData[] = [];
      this.container.set(eventConstructor, arr);
      return arr;
    }
  }
}

export const container: Container = new Container();
