/// <reference lib="es2015.symbol" />

export interface SymbolConstructor
  extends Omit<typeof globalThis.Symbol, "dispose" | "asyncDispose"> {
  /**
   * A method that is used to release resources held by an object. Called by
   * the semantics of the `using` statement.
   */
  readonly dispose: unique symbol;

  /**
   * A method that is used to asynchronously release resources held by an
   * object. Called by the semantics of the `await using` statement.
   */
  readonly asyncDispose: unique symbol;
}

export const Symbol: SymbolConstructor = (globalThis.Symbol ??
  ((description: string) => ({
    description,
    toString: () => `Symbol(${description})`,
  }))) as unknown as SymbolConstructor;

if (
  typeof globalThis.Symbol === "function" &&
  typeof Symbol.dispose !== "symbol"
) {
  Reflect.defineProperty(Symbol, "dispose", {
    // deno-lint-ignore no-explicit-any
    value: (Symbol as any)("Symbol.dispose"),
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

if (
  typeof globalThis.Symbol === "function" &&
  typeof Symbol.asyncDispose !== "symbol"
) {
  Reflect.defineProperty(Symbol, "asyncDispose", {
    // deno-lint-ignore no-explicit-any
    value: (Symbol as any)("Symbol.asyncDispose"),
    enumerable: false,
    configurable: false,
    writable: false,
  });
}
