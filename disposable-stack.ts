import type { Disposable } from "./disposable.ts";

/**
 * Represents a collection of disposable resources. From the explicit resource
 * management proposal and based on the TypeScript interface of the same name.
 *
 * @see https://github.com/tc39/proposal-explicit-resource-management
 * @see https://github.com/microsoft/TypeScript/blob/v5.2.2/src/lib/esnext.disposable.d.ts
 *
 * @example
 * ```ts
 * class C {
 *   #res1: Disposable;
 *   #res2: Disposable;
 *   #disposables: DisposableStack;
 *   constructor() {
 *     // stack will be disposed when exiting constructor for any reason
 *     using stack = new DisposableStack();
 *
 *     // get first resource
 *     this.#res1 = stack.use(getResource1());
 *
 *     // get second resource. If this fails, both `stack` and `#res1` will be disposed.
 *     this.#res2 = stack.use(getResource2());
 *
 *     // all operations succeeded, move resources out of `stack` so that they aren't disposed
 *     // when constructor exits
 *     this.#disposables = stack.move();
 *   }
 *
 *   [Symbol.dispose]() {
 *     this.#disposables.dispose();
 *   }
 * }
 * ```
 */
export class DisposableStack {
  #disposed = false;
  #errors: unknown[] = [];
  #stack: [
    Disposable | AsyncDisposable | undefined,
    ((value?: unknown) => void | Promise<void>) | undefined,
  ][] = [];

  /** Returns a value indicating whether this stack has been disposed. */
  get disposed(): boolean {
    return this.#disposed;
  }

  /** Disposes all of its resources in reverse order that they were added. */
  dispose(): void {
    if (!this.disposed) {
      this.#disposed = true;
      while (this.#stack.length > 0) {
        const [value, onDispose] = this.#stack.pop()!;
        try {
          if (typeof onDispose === "function") onDispose(value);
          if (
            value && typeof value === "object" ||
            typeof value === "function"
          ) {
            if (
              Symbol.dispose in value &&
              typeof value?.[Symbol.dispose] === "function"
            ) {
              value[Symbol.dispose]();
            } else if (
              Symbol.asyncDispose in value &&
              typeof value?.[Symbol.asyncDispose] === "function"
            ) {
              value[Symbol.asyncDispose]();
            }
          }
        } catch (error) {
          this.#errors.push(error);
        }
      }
    }
  }

  /**
   * Adds a disposable resource to the stack, returning the resource.
   *
   * @param value The resource to add. `null` and `undefined` will not be added, but **_will_** be returned.
   * @returns The provided {@link value}.
   */
  use<T extends Disposable | AsyncDisposable | null | undefined>(value: T): T {
    if (this.disposed) throw new ReferenceError("Object has been disposed.");
    if (value != null) this.#stack.push([value, undefined]);
    return value;
  }

  /**
   * Adds a value and associated disposal callback as a resource to the stack.
   * @param value The value to add.
   * @param onDispose The callback to use in place of a `[Symbol.dispose]()` method. Will be invoked with `value` as the first parameter.
   * @returns The provided {@link value}.
   */
  adopt<T>(value: T, onDispose: (value: T) => void): T {
    if (this.disposed) throw new ReferenceError("Object has been disposed.");
    this.#stack.push([undefined, () => onDispose(value)]);
    return value;
  }

  /**
   * Adds a callback to be invoked when the stack is disposed.
   */
  defer(onDispose: () => void): void {
    if (this.disposed) throw new ReferenceError("Object has been disposed.");
    this.#stack.push([undefined, onDispose]);
  }

  /**
   * Move all resources out of this stack and into a new `DisposableStack`, and
   * marks this stack as disposed.
   *
   * @example
   * ```ts
   * class C {
   *   #res1: Disposable;
   *   #res2: Disposable;
   *   #disposables: DisposableStack;
   *   constructor() {
   *     // stack will be disposed when exiting constructor for any reason
   *     using stack = new DisposableStack();
   *
   *     // get first resource
   *     this.#res1 = stack.use(getResource1());
   *
   *     // get second resource. If this fails, both `stack` and `#res1` will be disposed.
   *     this.#res2 = stack.use(getResource2());
   *
   *     // all operations succeeded, move resources out of `stack` so that they aren't disposed
   *     // when constructor exits
   *     this.#disposables = stack.move();
   *   }
   *
   *   [Symbol.dispose]() {
   *     this.#disposables.dispose();
   *   }
   * }
   * ```
   */
  move(): DisposableStack {
    if (this.disposed) throw new ReferenceError("Object has been disposed.");
    const stack = new DisposableStack();
    stack.#stack = this.#stack;
    stack.#disposed = this.#disposed;
    this.#stack = [];
    this.#disposed = true;
    return stack;
  }

  [Symbol.dispose](): void {
    this.dispose();
  }

  declare readonly [Symbol.toStringTag]: string;

  static {
    Object.defineProperties(this.prototype, {
      [Symbol.toStringTag]: {
        value: "DisposableStack",
        writable: false,
        enumerable: false,
        configurable: true,
      },
    });
  }
}
