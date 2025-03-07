/**
 * A Result type that represents either success (Ok) or failure (Err)
 */
export type Result<T, E> = Ok<T, E> | Err<T, E>;

/**
 * Represents a successful operation with a value of type T
 */
export class Ok<T, E> {
  readonly _tag = "Ok" as const;
  constructor(readonly value: T) {}

  /**
   * Returns true if the result is Ok
   */
  isOk(): boolean {
    return true;
  }

  /**
   * Returns true if the result is Err
   */
  isErr(): boolean {
    return false;
  }

  /**
   * Unwraps a result, returning the contained Ok value
   * @throws if the value is an Err
   */
  unwrap(): T {
    return this.value;
  }

  /**
   * Returns the contained Ok value or a provided default
   */
  unwrapOr(defaultValue: T): T {
    return this.value;
  }

  /**
   * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Ok<U, E>(fn(this.value));
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value
   */
  mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return new Ok<T, F>(this.value);
  }

  /**
   * Returns the provided default (if Err), or applies a function to the contained value (if Ok)
   */
  mapOr<U>(defaultValue: U, fn: (value: T) => U): U {
    return fn(this.value);
  }

  /**
   * Applies a function to the contained value (if Ok), or returns the provided default (if Err)
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  /**
   * Returns the result if it contains a value, otherwise returns the other
   */
  or<F>(res: Result<T, F>): Result<T, F> {
    return new Ok<T, F>(this.value);
  }

  /**
   * Unwraps a result, yielding the content of an Ok. Else it returns the default value
   */
  unwrapOrElse(fn: (err: E) => T): T {
    return this.value;
  }

  /**
   * Match on the result and handle both cases
   */
  match<U>(options: { ok: (value: T) => U; err: (error: E) => U }): U {
    return options.ok(this.value);
  }
}

/**
 * Represents a failed operation with an error of type E
 */
export class Err<T, E> {
  readonly _tag = "Err" as const;
  constructor(readonly error: E) {}

  /**
   * Returns true if the result is Ok
   */
  isOk(): boolean {
    return false;
  }

  /**
   * Returns true if the result is Err
   */
  isErr(): boolean {
    return true;
  }

  /**
   * Unwraps a result, returning the contained Ok value
   * @throws if the value is an Err
   */
  unwrap(): T {
    throw new Error(`Tried to unwrap an Err: ${this.error}`);
  }

  /**
   * Returns the contained Ok value or a provided default
   */
  unwrapOr(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  /**
   * Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value
   */
  mapErr<F>(fn: (err: E) => F): Result<T, F> {
    return new Err<T, F>(fn(this.error));
  }

  /**
   * Returns the provided default (if Err), or applies a function to the contained value (if Ok)
   */
  mapOr<U>(defaultValue: U, fn: (value: T) => U): U {
    return defaultValue;
  }

  /**
   * Applies a function to the contained value (if Ok), or returns the provided default (if Err)
   */
  andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Err<U, E>(this.error);
  }

  /**
   * Returns the result if it contains a value, otherwise returns the other
   */
  or<F>(res: Result<T, F>): Result<T, F> {
    return res;
  }

  /**
   * Unwraps a result, yielding the content of an Ok. Else it returns the default value
   */
  unwrapOrElse(fn: (err: E) => T): T {
    return fn(this.error);
  }

  /**
   * Match on the result and handle both cases
   */
  match<U>(options: { ok: (value: T) => U; err: (error: E) => U }): U {
    return options.err(this.error);
  }
}
