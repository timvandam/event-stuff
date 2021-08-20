import { Event, EventBus, EventHandler } from '../';

class CountEvent extends Event {}
class CountEvent2 extends CountEvent {}
class CountEvent3 extends CountEvent2 {}
class CountEvent4 extends CountEvent3 {}
class CountEvent5 extends CountEvent4 {}

class Counter {
  count = 0;
  @EventHandler()
  handler1(event: CountEvent) {
    this.count++;
  }

  @EventHandler({ inheritance: true })
  handler2(event: CountEvent) {
    this.count++;
  }
}

const counter = new Counter();
const bus = new EventBus();
bus.register(counter);

console.log('------------------- JIT -------------------');
// No inheritence
let start = Date.now();
for (let i = 0; i < 100_000_000; i++) {
  bus.emit(new CountEvent());
}
let end = Date.now();
let seconds = Math.floor((end - start) / 1000);
console.log(
  `Counted to ${counter.count} in ${seconds} seconds (${counter.count / seconds} ops/sec)`,
);

// Inheritance
counter.count = 0;
start = Date.now();
for (let i = 0; i < 100_000_000; i++) {
  bus.emit(new CountEvent5());
}
end = Date.now();
seconds = (end - start) / 1000;
console.log(
  `Counted to ${counter.count} in ${seconds} seconds (${counter.count / seconds} ops/sec)`,
);
