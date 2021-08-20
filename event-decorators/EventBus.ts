import { insert } from '../array-tools';
import { EventPriority } from './EventPriority';
import {
  EventHandlerFunction,
  EventHandlerIterator,
  getEventHandlerMetadata,
} from './EventHandler';
import { Event } from './Event';

export class EventBus {
  private handlers = new Map<Function, { listener: object; handler: EventHandlerFunction }[]>();

  // TODO: Store metadata in a custom container
  private registerHandler(
    listener: Object,
    event: Function,
    priority: EventPriority,
    handler: EventHandlerFunction,
  ): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    const handlers = this.handlers.get(event)!;
    for (let i = 0; i < handlers.length; i++) {
      const { priority: currentPriority } = getEventHandlerMetadata(handlers[i].handler);
      if (currentPriority > priority) {
        insert(handlers, { listener, handler }, i);
        return;
      }
    }

    // If we got here, then it should go at the end
    handlers.push({ listener, handler });
  }

  register(listener: Object): void {
    for (const method of EventHandlerIterator(listener)) {
      const { priority, event } = getEventHandlerMetadata(method);
      this.registerHandler(listener, event, priority, method);
    }
  }

  registerAll(...listeners: Object[]): void {
    listeners.forEach((listener) => this.register(listener));
  }

  protected getEventHandlersForEvent<T extends Event>(event: T): EventHandlerFunction<T>[] {
    const eventHandlers = [];

    let eventPrototype = Object.getPrototypeOf(event);
    while (eventPrototype !== Object.prototype) {
      for (const { listener, handler } of this.handlers.get(eventPrototype.constructor) ?? []) {
        if (
          eventPrototype === Object.getPrototypeOf(event) ||
          getEventHandlerMetadata(handler).inheritance
        ) {
          eventHandlers.push(handler.bind(listener));
        }
      }

      eventPrototype = Object.getPrototypeOf(eventPrototype);
    }

    return eventHandlers;
  }

  emit(event: Event): void {
    const eventHandlers = this.getEventHandlersForEvent(event);
    eventHandlers.forEach((eventHandler) => eventHandler(event));
  }
}
