type Listener<T> = (value: T) => void;

export class Observable<T> {
  protected _value: T;
  private listeners: Listener<T>[];

  constructor(value: T) {
    this._value = value;
    this.listeners = [];
  }

  protected notify() {
    this.listeners.forEach(listener => listener(this.value));
  }

  public subscribe(listener: Listener<T>) {
    this.listeners.push(listener);
  }

  get value() {
    return this._value;
  }

  set value(value) {
    this._value = value;
    this.notify();
  }
}

export class Computed<T> extends Observable<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(value: () => T, dependencies: Observable<any>[]) {
    super(value());
    const listener = () => {
      this._value = value();
      this.notify();
    };
    dependencies.forEach(dep => dep.subscribe(listener));
  }

  get value() {
    return this._value;
  }
}
