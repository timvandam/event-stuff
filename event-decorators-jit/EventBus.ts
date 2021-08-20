import { ClassConstructor } from '../type-tools';
import { Environment } from './JitBuilder';
import { Event } from './Event';
import { container, EventHandlerData } from './EventHandlerDataContainer';

type JitEventHandler = (event: Event) => void;

export class EventBus {
  private listeners: Set<object> = new Set();
  private listenersByClass: Map<ClassConstructor<any>, object[]> = new Map();
  private jit: JitEventHandler = () => void 0;

  protected registerListener(listener: object) {
    this.listeners.add(listener);
    const clazz = listener.constructor as ClassConstructor<any>;
    if (this.listenersByClass.has(clazz)) {
      this.listenersByClass.get(clazz)!.push(listener);
    } else {
      this.listenersByClass.set(clazz, [listener]);
    }
  }

  register(listener: object): void {
    this.registerListener(listener);
    this.buildJit();
  }

  registerMany(...listeners: object[]): void {
    listeners.forEach((listener) => this.registerListener(listener));
    this.buildJit();
  }

  emit(event: Event) {
    this.jit(event);
  }

  protected getListenerClasses(): Set<ClassConstructor<any>> {
    return new Set([...this.listeners].map((x) => x.constructor as ClassConstructor<any>));
  }

  protected getEventClasses() {
    return container
      .getEventClasses()
      .filter((eventClass) => this.getEventHandlerDatasForEvent(eventClass));
  }

  protected getEventHandlerDatasForEvent<T extends Event>(
    eventClass: ClassConstructor<T>,
  ): EventHandlerData[] {
    return container
      .get(eventClass)
      .filter((handlerData) => this.listenersByClass.has(handlerData.listenerClass));
  }

  protected buildJit() {
    const ctx = new Environment();

    const events = this.getEventClasses();
    this.jit = ctx.build(
      (c) => `
return function (event) {
${c.forEach(
  events,
  (eventClassVar, eventClass) => `
  if (event instanceof ${eventClassVar}) {
${c.unregisteredForEach(this.getEventHandlerDatasForEvent(eventClass), (eventHandlerData) =>
  c.forEach(
    this.listenersByClass.get(eventHandlerData.listenerClass) ?? [],
    (listenerVar) => `
    if (true${eventHandlerData.ignoreCancelled ? ' && !event.isCancelled()' : ''}${
      !eventHandlerData.inheritance ? ` && event.constructor === ${eventClassVar}` : ''
    }) ${listenerVar}[${JSON.stringify(eventHandlerData.functionName)}](event);`,
  ),
)}
  }`,
)}
}`,
    );
  }

  registerAll(...listeners: Object[]): void {
    listeners.forEach((listener) => this.register(listener));
  }
}
