import { insert } from '../array-tools';
import { ClassConstructor } from '../type-tools';
import { Event } from './Event';
import { EventPriority } from './EventPriority';
import { container, EventHandlerData } from './EventHandlerDataContainer';

export type EventHandlerOptions = {
  priority: EventPriority;
  ignoreCancelled: boolean;
  inheritance: boolean;
};

const defaultOptions: EventHandlerOptions = {
  priority: EventPriority.NORMAL,
  ignoreCancelled: true,
  inheritance: false,
};

export type EventHandlerFunction<E extends Event = Event> = (event: E) => any;
export function EventHandler(options: Partial<EventHandlerOptions> = {}) {
  return <E extends Event>(
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<EventHandlerFunction<E>>,
  ): void => {
    const handlers = container.get(getEventHandlerEventClass(target, propertyKey));
    const handler: EventHandlerData = {
      listenerClass: target.constructor as ClassConstructor<any>,
      functionName: propertyKey,
      priority: options.priority ?? defaultOptions.priority,
      ignoreCancelled: options.ignoreCancelled ?? defaultOptions.ignoreCancelled,
      inheritance: options.inheritance ?? defaultOptions.inheritance,
    };

    // Insert the current handler in the correct spot according to EventPriority
    let inserted = false;
    for (let i = 0; i < handlers.length; i++) {
      if (handler.priority > handlers[i].priority) {
        insert(handlers, handler, i);
        inserted = true;
        break;
      }
    }
    if (!inserted) handlers.push(handler);
  };
}

function getEventHandlerEventClass(target: Object, propertyKey: string): ClassConstructor<Event> {
  const [eventType] = Reflect.getMetadata('design:paramtypes', target, propertyKey);

  if (!eventType || !(eventType.prototype instanceof Event)) {
    throw new Error(
      `The first parameter of method '${propertyKey}' on ${target.constructor.name} is not an Event type.`,
    );
  }

  return eventType;
}
