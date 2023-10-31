export interface AsyncDisposable {
  [Symbol.asyncDispose](): PromiseLike<void>;
}
