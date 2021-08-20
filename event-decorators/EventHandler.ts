import { ClassMethodIterator } from '../iterators/class/methods';
import { ClassConstructor } from '../type-tools';
import { EventPriority } from './EventPriority';
import { Event } from './Event';

export type EventHandlerOptions = {
  priority: EventPriority;
  ignoreCancelled: boolean;
  inheritance: boolean;
};

const defaultEventHandlerOptions: EventHandlerOptions = {
  priority: EventPriority.NORMAL,
  ignoreCancelled: true,
  inheritance: false,
};

export type EventHandlerMetadata = EventHandlerOptions & {
  event: Function;
};

export type EventHandlerFunction<E extends Event = Event> = (event: E) => any;

export const eventHandlerOptionsKey = Symbol('eventHandlerOptions');

export function EventHandler(options?: Partial<EventHandlerOptions>) {
  return <E extends Event>(
    target: Object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<EventHandlerFunction<E>>,
  ): void => {
    const eventHandlerMetadata: EventHandlerMetadata = {
      ...defaultEventHandlerOptions,
      ...options,
      event: getEventHandlerEvent(target, propertyKey),
    };

    if (!descriptor.value) throw new Error('Could not find event handler method');

    if (eventHandlerMetadata.ignoreCancelled) {
      const method = descriptor.value;
      descriptor.value = function (event) {
        if (!event.isCancelled()) {
          method.call(this, event);
        }
      };
    }

    Reflect.defineMetadata(eventHandlerOptionsKey, eventHandlerMetadata, descriptor.value);
  };
}

function getEventHandlerEvent(target: Object, propertyKey: string | symbol): Function {
  const [eventType] = Reflect.getMetadata('design:paramtypes', target, propertyKey);

  if (!eventType || !(eventType.prototype instanceof Event)) {
    throw new Error('EventHandler method must have exactly one Event parameter.');
  }

  return eventType;
}

export const isEventHandler = (method: Function) => {
  return Reflect.hasMetadata(eventHandlerOptionsKey, method);
};

export function* EventHandlerIterator<T extends object>(
  instance: T,
): Generator<EventHandlerFunction> {
  for (const methodName of ClassMethodIterator(instance.constructor as ClassConstructor<T>)) {
    const method = (instance as Record<string, EventHandlerFunction>)[methodName];
    if (isEventHandler(method)) {
      yield method;
    }
  }
}

export function getEventHandlerMetadata(handler: Function): EventHandlerMetadata {
  if (!isEventHandler(handler)) {
    throw new Error('Method is not an EventHandler');
  }

  return Reflect.getMetadata(eventHandlerOptionsKey, handler);
}
