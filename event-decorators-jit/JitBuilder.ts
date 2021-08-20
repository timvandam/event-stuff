/**
 * Class that represents the environment in which a jit functions will be built with some util methods to automatically populate the environment
 */
export class Environment {
  protected environment = new Map<any, string>();

  getFromEnvironment(thing: any) {
    if (this.environment.has(thing)) {
      return this.environment.get(thing) as string;
    } else {
      const name = `___${this.environment.size}`; // TODO: Bit more readable mby
      this.environment.set(thing, name);
      return name;
    }
  }

  unregisteredForEach<T>(collection: Iterable<T>, handler: (value: T) => string) {
    let str = '';
    for (const thing of collection) {
      str += `${handler(thing).trimRight()}\n`;
    }
    return str.replace(/(^\s*[\r\n])|(\s*[\r\n]$)/g, '');
  }

  forEach<T>(collection: Iterable<T>, handler: (variableName: string, value: T) => string) {
    let str = '';
    for (const thing of collection) {
      str += `${handler(this.getFromEnvironment(thing), thing).trimRight()}\n`;
    }
    return str.replace(/(^\s*[\r\n])|(\s*[\r\n]$)/g, '');
  }

  value<T>(value: T) {
    return this.getFromEnvironment(value);
  }

  build(bodyBuilder: (context: this) => string) {
    const body = bodyBuilder(this);
    const jit = new Function(...this.environment.values(), body)(...this.environment.keys());
    return jit;
  }
}
