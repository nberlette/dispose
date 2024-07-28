# dispose

## Polyfills for Explicit Resource Management APIs

This is a bare-bones implementation of the `DisposableStack` and
`AsyncDisposableStack` APIS from the
**[Explicit Resource Management Proposal]**. It is based on the
**[TypeScript v5.2.2 type definitions]** for the interfaces of the same name.

Intended to be used as a polyfill for users who want to use the
`DisposableStack` and `AsyncDisposableStack` APIs in environments that don't
support them yet. It is also intended to be used as a reference implementation
for users who want to implement these APIs in their own libraries.

## `DisposableStack`

The `DisposableStack` class is a utility for managing resources that need to be
cleaned up when they are no longer needed. It maintains a stack of disposable
resources and provides methods to add and manage these resources. It also
handles the graceful disposal of resources when the stack itself is disposed of.

This class is an implementation of `Disposable` itself, meaning you can use it
with the `using` statement in Deno v1.36.0+ for automatic resource cleanup.

### Usage

##### From [JSR](https://jsr.io) ([@nick/dispose](https://jsr.io/@nick/dispose))

```ts
import { DisposableStack } from "@nick/dispose";
```

##### From [deno.land/x](https://deno.land/x) ([dispose](https://deno.land/x/dispose))

```ts
import { DisposableStack } from "https://deno.land/x/dispose/mod.ts";
```

---

### Properties

#### `disposed`

This read-only property returns a boolean value indicating whether the stack has
been disposed of or not.

##### Example

```ts
const stack = new DisposableStack();
console.log(stack.disposed); // Output: false
```

### Methods

#### `use`

```ts
use<T extends Disposable | null | undefined>(value: T): T;
```

Adds a disposable resource to the stack and returns the resource. Throws an
error if the stack has already been disposed of.

##### Example

```ts
// block scope
{
  using stack = new DisposableStack();
  const resource = getResource();
  stack.use(resource);
}
```

#### `adopt`

```ts
adopt<T>(value: T, onDispose: (value: T) => void): T;
```

Adds a value and an associated disposal callback to the stack. The callback will
be invoked with the value as its first parameter during stack disposal.

##### Example

```ts
const stack = new DisposableStack();
const value = "someValue";
stack.adopt("someValue", (v) => {
  console.log(`Disposing of value: ${v}`);
});
```

#### `defer`

```ts
defer(onDispose: () => void): void
```

Adds a callback function to be invoked when the stack is disposed.

##### Example

```ts
const stack = new DisposableStack();
stack.defer(() => {
  console.log("Stack has been disposed.");
});
```

#### `move`

```ts
move(): DisposableStack;
```

Moves all resources out of the current stack into a new `DisposableStack`
instance and marks the current stack as disposed. Returns the new stack.

##### Example

```ts
using stack1 = new DisposableStack();

// Add some resources to stack1...

const stack2 = stack1.move();
// stack2 now contains the resources, and stack1 is disposed of.
```

#### `dispose`

```ts
dispose(): void;
```

This method disposes of all the resources in the stack in the reverse order they
were added. If any error occurs during the disposal of an individual resource,
the error will be captured and stored.

##### Example

```ts
const stack = new DisposableStack();
// Add resources...
stack.dispose();
```

---

## `AsyncDisposableStack`

The `AsyncDisposableStack` class is an extension of `DisposableStack`, designed
for managing asynchronous resources. It offers a similar API but includes
support for asynchronous disposal of resources.

Just like `DisposableStack`, it maintains a stack of disposable resources, but
the methods involved are asynchronous and return promises.

It also is an implementation of `AsyncDisposable` itself, meaning you can use it
with the `await using` syntax in Deno v1.36.0+ for automatic resource cleanup.

### Usage

##### From [JSR](https://jsr.io) ([@nick/dispose](https://jsr.io/@nick/dispose))

```ts
import { AsyncDisposableStack } from "@nick/dispose";
```

##### From [deno.land/x](https://deno.land/x) ([dispose](https://deno.land/x/dispose))

```ts
import { AsyncDisposableStack } from "https://deno.land/x/dispose/mod.ts";
```

---

### Properties

#### `disposed`

This read-only property returns a boolean value that indicates whether the stack
has been disposed of or not.

##### Example

```ts
await using stack = new AsyncDisposableStack();

while (!stack.disposed) {
  // ... add some asynchronous resources here ...
  const resource = await stack.use(getResource());
}

// stack is disposed of here
console.log(stack.disposed);
```

---

### Methods

#### `use`

```ts
async use<T extends AsyncDisposable | Disposable | null | undefined>(value: T): Promise<T>;
```

Asynchronously adds a disposable resource to the stack and returns the resource
as a promise. Throws an error if the stack has already been disposed of.

##### Example

```ts
await using stack = new AsyncDisposableStack();
await stack.adopt("value", async (v) => {
  // some asynchronous cleanup operation await new Promise((resolve) =>
  setTimeout(resolve, 500);
  console.log(`Asynchronously disposing of value: ${v}`);
});
```

#### `adopt`

```ts
async adopt<T>(value: T, onDisposeAsync: (value: T) => PromiseLike<void> | void): Promise<T>
```

Asynchronously adds a value and an associated asynchronous disposal callback to
the stack. The callback will be invoked with the value as its first parameter
during stack disposal. Returns a promise that resolves with the value.

##### Example

```ts
await using stack = new AsyncDisposableStack();

const tmp = await stack.adopt(await Deno.makeTempFile(), async (v) => {
  // some asynchronous cleanup operation
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`Asynchronously disposing of temp file: ${v}`);
  // remove the temp file
  await Deno.remove(v);
});

// do some work with the temp file...
await tmp.stat();
```

#### `defer`

```ts
async defer(onDisposeAsync: () => PromiseLike<void> | void): Promise<void>
```

Asynchronously adds a callback function to be invoked when the stack is disposed
of. Returns a promise that resolves once the callback is added to the stack.

##### Example

```ts
await using stack = new AsyncDisposableStack();

await stack.defer(async () => {
  // some asynchronous cleanup operation
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log("Stack has been asynchronously disposed.");
});
```

#### `move`

```ts
async move(): Promise<AsyncDisposableStack>
```

Asynchronously moves all resources out of the current stack into a new
`AsyncDisposableStack` instance and marks the current stack as disposed. Returns
a promise that resolves with the new stack.

##### Example

```ts
await using stack1 = new AsyncDisposableStack();

// Add some async resources to stack1...

const stack2 = await stack1.move();
// stack2 now contains the resources, and stack1 is disposed of.
```

#### `disposeAsync`

```ts
async disposeAsync(): Promise<void>;
```

This asynchronous method disposes of all the resources in the stack in the
reverse order they were added. It returns a promise that resolves once all
resources are disposed of. If an error occurs during the disposal of an
individual resource, the error will be captured and stored.

##### Example

```ts
const stack = new AsyncDisposableStack();

// Add async resources...

await stack.disposeAsync();
```

---

### `Disposable`

##### From [JSR](https://jsr.io) ([@nick/dispose](https://jsr.io/@nick/dispose))

```ts
import type { Disposable } from "@nick/dispose";
```

##### From [deno.land/x](https://deno.land/x) ([dispose](https://deno.land/x/dispose))

```ts
import type { Disposable } from "https://deno.land/x/dispose/mod.ts";
```

The `Disposable` interface represents a resource that can be disposed of, with a
**_synchronous_** cleanup operation defined by its `Symbol.dispose` method.

This interface is already present in the TypeScript ESNext library, and also in
Deno v1.36.0+, so you don't need to import it if you're using either of those
environments. It is provided here for completeness, and for those who happen to
be in an environment that doesn't support it yet.

If you wish to use a resource with a `using` statement, it must have a cleanup
operation defined by its `Symbol.dispose` method.

```ts
interface Disposable {
  [Symbol.dispose](): void;
}
```

---

### `AsyncDisposable`

##### From [JSR](https://jsr.io) ([@nick/dispose](https://jsr.io/@nick/dispose))

```ts
import type { AsyncDisposable } from "@nick/dispose";
```

##### From [deno.land/x](https://deno.land/x) ([dispose](https://deno.land/x/dispose))

```ts
import type { AsyncDisposable } from "https://deno.land/x/dispose/mod.ts";
```

The `AsyncDisposable` interface represents a resource that can be disposed of
asynchronously, Very similar to the `Disposable` interface, but with an
**asynchronous** cleanup operation defined by its `Symbol.asyncDispose` method.

If you wish to use a resource with an `await using` statement, it must have a
cleanup operation named `Symbol.asyncDispose` (`Symbol.dispose` method, as a
fallback).

```ts
interface AsyncDisposable {
  [Symbol.asyncDispose](): PromiseLike<void> | void;
}
```

===

### `Symbol.dispose` + `Symbol.asyncDispose`

If you happen to be in an environment that doesn't support the well-known
symbols `Symbol.dispose` and `Symbol.asyncDispose` quite yet, you can import the
`./symbol.ts` file to polyfill them on the global `Symbol` object.

##### From [JSR](https://jsr.io) ([@nick/dispose](https://jsr.io/@nick/dispose))

```ts
import "@nick/dispose/symbol";
```

##### From [deno.land/x](https://deno.land/x) ([dispose](https://deno.land/x/dispose))

```ts
import "https://deno.land/x/dispose/symbol.ts";
```


> **Warning**: this particular file is a global polyfill: it mutates the
> **global** `Symbol` object, and augments the global `SymbolConstructor`
> interface.

#### Why not just export these from `./mod.ts`?

Good question. I've chosen not to export them from the `./mod.ts` file because I
don't want to pollute the global `Symbol` object if it's not necessary. If
you're in an environment that supports the well-known symbols, you can just use
them directly. If you're not in such an environment, you can import the
`./symbol.ts` file to polyfill them.

---

## Examples

### Using `AsyncDisposableStack` and `AsyncDisposable`

Here's an example of the `AsyncDisposableStack` API and how it can be used. You
can drop this in the Deno CLI (v1.36.0+) and it will "just work".

```ts
import { type AsyncDisposable, AsyncDisposableStack } from "@nick/dispose";
// Or from "https://deno.land/x/dispose/mod.ts"
//import {
//  type AsyncDisposable,
//  AsyncDisposableStack,
//} from "https://deno.land/x/dispose/mod.ts";

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
    console.log("acquiring resource B");
    const resource = {
      data: JSON.parse(await Deno.readTextFile(this.#resourceA)),
    };
    return Object.create({
      async [Symbol.asyncDispose]() {
        console.log("disposing resource B");
        resource.data = null!;
        return await Promise.resolve();
      },
    }, { resource: { value: resource, enumerable: true } });
  }

  async [Symbol.asyncDispose]() {
    await this.#resources.disposeAsync();
  }
}

{
  await using construct = new AsyncConstruct();
  await construct.init();
  console.log("resource A:", construct.resourceA);
  console.log("resource B:", construct.resourceB);
  console.log("We're done here.");
}
```

### Using `DisposableStack` with `Disposable`

This example is similar to the previous one, but uses the `DisposableStack` API
for managing synchronous resources. This is more pseudo-code than anything else;
it was taken directly from the [TypeScript v5.2.2 type definitions].

```ts
import { type Disposable, DisposableStack } from "@nick/dispose";
// Or from "https://deno.land/x/dispose/mod.ts"
//import {
//  type Disposable,
//  DisposableStack,
//} from "https://deno.land/x/dispose/mod.ts";

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
