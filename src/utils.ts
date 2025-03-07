import { type Result, Ok, Err } from "./result";

/**
 * Wraps a function that might throw into one that returns a Result
 */
export function tryFn<T, E = unknown>(
  fn: () => T,
): Result<T, E extends Error ? E : Error> {
  try {
    return new Ok(fn());
  } catch (error) {
    return new Err(
      error instanceof Error ? (error as any) : new Error(String(error)),
    );
  }
}

/**
 * Wraps an async function that might throw into one that returns a Promise<Result>
 */
export async function tryAsync<T, E = unknown>(
  fn: () => Promise<T>,
): Promise<Result<T, E extends Error ? E : Error>> {
  try {
    const value = await fn();
    return new Ok(value);
  } catch (error) {
    return new Err(
      error instanceof Error ? (error as any) : new Error(String(error)),
    );
  }
}

/**
 * Creates an Ok result with the given value
 */
export function ok<T, E = never>(value: T): Result<T, E> {
  return new Ok(value);
}

/**
 * Creates an Err result with the given error
 */
export function err<T = never, E = Error>(error: E): Result<T, E> {
  return new Err(error);
}
