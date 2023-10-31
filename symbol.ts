/// <reference lib="es2015.symbol" />

declare global {
  interface SymbolConstructor {
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
}

if (typeof Symbol === "function" && typeof Symbol.dispose !== "symbol") {
  Object.defineProperty(globalThis.Symbol, "dispose", {
    value: Symbol("Symbol.dispose"),
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

if (typeof Symbol === "function" && typeof Symbol.asyncDispose !== "symbol") {
  Object.defineProperty(globalThis.Symbol, "asyncDispose", {
    value: Symbol("Symbol.asyncDispose"),
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

export {};
