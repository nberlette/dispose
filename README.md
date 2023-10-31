# `DisposableStack` and `AsyncDisposableStack` Polyfills

This is a bare-bones implementation of the `DisposableStack` and
`AsyncDisposableStack` interfaces from the
**[Explicit Resource Management Proposal]**. It is based on the
[TypeScript v5.2.2 type definitions] for the interfaces of the same name.

This is intended to be used as a polyfill for environments that don't support
all (or any) of these cutting-edge features yet. It's also intended to
demonstrate the API and how it can be used in practice.

> **Note**: I threw this together in an hour on a Monday night. It does not
> contain any tests, and is definitely not intended for any sort of production
> use case. It's mostly a proof-of-concept demonstration. Don't hate me for any
> sloppy typos or bugs 😇

## Usage

See the [**examples**](#examples) section below for actual usage examples.

### `Disposable`

```ts
import type {
  Disposable,
} from "https://github.com/nberlette/disposable-polyfills/raw/main/mod.ts";
```

### `DisposableStack`

```ts
import {
  DisposableStack,
} from "https://github.com/nberlette/disposable-polyfills/raw/main/mod.ts";
```

### `AsyncDisposable`

```ts
import type {
  AsyncDisposable,
} from "https://github.com/nberlette/disposable-polyfills/raw/main/mod.ts";
```

### `AsyncDisposableStack`

```ts
import {
  AsyncDisposableStack,
} from "https://github.com/nberlette/disposable-polyfills/raw/main/mod.ts";
```

### `Symbol.dispose` and `Symbol.asyncDispose`

If you happen to be in an environment that doesn't support the well-known
symbols `Symbol.dispose` and `Symbol.asyncDispose` quite yet, you can import the
`./symbol.ts` file to polyfill them on the global `Symbol` object.

```ts
import "https://github.com/nberlette/disposable-polyfills/raw/main/symbol.ts";
```

> **Warning**: this particular file is a global polyfill: it mutates the
> **global** `Symbol` object, and augments the global `SymbolConstructor`
> interface.

#### Why not just export the symbols from the `./mod.ts` file?

Good question. I've chosen not to export them from the `./mod.ts` file because I
don't want to pollute the global `Symbol` object if it's not necessary. If
you're in an environment that supports the well-known symbols, you can just use
them directly. If you're not in such an environment, you can import the
`./symbol.ts` file to polyfill them.

---

## Examples

### `AsyncDisposableStack`

Here's an example of the `AsyncDisposableStack` API and how it can be used. You
can drop this in the Deno CLI (v1.36.0+) and it will "just work".

```ts
import {
  type AsyncDisposable,
  AsyncDisposableStack,
} from "https://github.com/nberlette/disposable-polyfills/raw/main/mod.ts";

class AsyncConstruct implements AsyncDisposable {
  #resourceA: AsyncDisposable;
  #resourceB: AsyncDisposable;
  #resources: AsyncDisposableStack;

  get resourceA() {
    return this.#resourceA;
  }

  get resourceB() {
    return this.#resourceB;
  }

  async init(): Promise<void> {
    // stack will be disposed when exiting this method for any reason
    await using stack = new AsyncDisposableStack();

    // adopts an async resource, adding it to the stack. this lets us utilize
    // resource management APIs with existing features that may not support the
    // bleeding-edge features like `AsyncDisposable` yet. In this case, we're
    // adding a temporary file (as a string), with a removal function that will
    // clean up the file when the stack is disposed (or this function exits).
    this.#resourceA = await stack.adopt(
      await Deno.makeTempFile(),
      async (path) => await Deno.remove(path),
    );

    // do some work with the resource
    await Deno.writeTextFile(this.#resourceA, JSON.stringify({ foo: "bar" }));

    // Acquire a second resource. If this fails, both `stack` and `#resourceA`
    // will be disposed. Notice we use the `.use` method here, since we're
    // acquiring a resource that implements the `AsyncDisposable` interface.
    this.#resourceB = await stack.use(await this.get());

    // all operations succeeded, move resources out of `stack` so that they aren't disposed
    // when this function exits. we can now use the resources as we please, and
    // they will be disposed when the parent object is disposed.
    this.#resources = stack.move();
  }

  async get(): Promise<AsyncDisposable> {
    console.log("🅱️ acquiring resource B");
    const resource = {
      data: JSON.parse(await Deno.readTextFile(this.#resourceA)),
    };
    return Object.create({
      async [Symbol.asyncDispose]() {
        console.log("🅱️ disposing resource B");
        resource.data = null!;
        return await Promise.resolve();
      },
    }, { resource: { value: resource, enumerable: true } });
  }

  async disposeAsync() {
    await this.#resources.disposeAsync();
  }

  async [Symbol.asyncDispose]() {
    await this.#resources.disposeAsync();
  }
}

{
  await using construct = new AsyncConstruct();
  await construct.init();
  console.log("🅰️ resource A:", construct.resourceA);
  console.log("🅱️ resource B:", construct.resourceB);
  console.log("We're done here.");
}
```

### `DisposableStack`

This example is similar to the previous one, but uses the `DisposableStack` API
for managing synchronous resources. This is more pseudo-code than anything else;
it was taken directly from the [TypeScript v5.2.2 type definitions].

```ts
import {
  type Disposable,
  DisposableStack,
} from "https://github.com/nberlette/disposable-polyfills/raw/main/mod.ts";

class Construct implements Disposable {
  #resourceA: Disposable;
  #resourceB: Disposable;
  #resources: DisposableStack;
  constructor() {
    // stack will be disposed when exiting constructor for any reason
    using stack = new DisposableStack();

    // get first resource
    this.#resourceA = stack.use(getResource1());

    // get second resource. If this fails, both `stack` and `#resourceA` will be disposed.
    this.#resourceB = stack.use(getResource2());

    // all operations succeeded, move resources out of `stack` so that they aren't disposed
    // when constructor exits
    this.#resources = stack.move();
  }

  [Symbol.dispose]() {
    this.#resources.dispose();
  }
}
```

---

#### **[MIT]** © **[Nicholas Berlette]**. All rights reserved.

##### Based on the [Explicit Resource Management Proposal] by [TC39] and the [TypeScript v5.2.2 type definitions] as reference points.

[Explicit Resource Management Proposal]: https://github.com/tc39/proposal-explicit-resource-management "View the TC39 Proposal for Explicit Resource Management on GitHub"
[Nicholas Berlette]: https://github.com/nberlette "View Nicholas Berlette's GitHub profile"
[MIT]: https://nick.mit-license.org "MIT License © 2023 Nicholas Berlette. All rights reserved."
[TC39]: https://tc39.es/ "Visit the TC39 website"
[TypeScript v5.2.2 type definitions]: https://github.com/microsoft/TypeScript/blob/v5.2.2/src/lib/esnext.disposable.d.ts "View the TypeScript v5.2.2 `esnext.disposable.d.ts` type definitions on GitHub"
