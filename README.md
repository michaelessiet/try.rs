# TryCatcher

[![npm version](https://img.shields.io/npm/v/trycatcher.svg)](https://www.npmjs.com/package/trycatcher)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A TypeScript library that brings Rust-like error handling to JavaScript and TypeScript. TryCatcher provides a `Result<T, E>` type that represents either success (`Ok<T>`) or failure (`Err<E>`), encouraging explicit error handling and making error flows more visible in your code.

## Installation

```bash
# Using npm
npm install trycatcher

# Using yarn
yarn add trycatcher

# Using pnpm
pnpm add trycatcher

# Using bun
bun add trycatcher
```

## Features

- 🦀 Rust-inspired `Result<T, E>` type for explicit error handling
- 🔄 Chainable operations with `map`, `andThen`, and more
- 🧩 Pattern matching with the `match` method
- 🛡️ Type-safe error handling
- 🔍 No more try/catch spaghetti code
- 🚫 No more uncaught exceptions
- 🧵 Works with both synchronous and asynchronous code

## Basic Usage

```typescript
import { ok, err, tryFn, tryAsync } from 'trycatcher';

// Function that returns a Result
function divide(a: number, b: number) {
  if (b === 0) {
    return err("Division by zero");
  }
  return ok(a / b);
}

// Using the Result type
const result = divide(10, 2);

// Pattern matching style
const output = result.match({
  ok: (value) => `Result: ${value}`,
  err: (error) => `Error: ${error}`,
});

console.log(output); // "Result: 5"

// Using methods
if (result.isOk()) {
  console.log(`The result is ${result.unwrap()}`);
} else {
  console.log(`Failed: ${result.error}`);
}

// Wrapping functions that might throw
const parseJson = (input: string) => tryFn(() => JSON.parse(input));

const result1 = parseJson('{"name": "John"}');
const result2 = parseJson('invalid json');

console.log(result1.unwrapOr({})); // { name: "John" }
console.log(result2.isErr()); // true

// Chaining operations
const getName = (input: string) =>
  parseJson(input)
    .map((obj) => obj.name)
    .unwrapOr("Unknown");

console.log(getName('{"name": "Alice"}')); // "Alice"
console.log(getName('{"age": 30}')); // undefined
console.log(getName('invalid')); // "Unknown"
```

## Async Support

```typescript
import { tryAsync } from 'trycatcher';

async function fetchData(url: string) {
  return tryAsync(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  });
}

// Using async/await
async function main() {
  const result = await fetchData('https://api.example.com/data');

  if (result.isOk()) {
    const data = result.unwrap();
    console.log('Data:', data);
  } else {
    console.error('Error:', result.error);
  }

  // Or using pattern matching
  result.match({
    ok: (data) => console.log('Data:', data),
    err: (error) => console.error('Error:', error),
  });

  // Chaining async operations
  const processedResult = await fetchData('https://api.example.com/users')
    .then(result =>
      result.andThen(users => {
        if (users.length === 0) {
          return err('No users found');
        }
        return ok(users.map(user => user.name));
      })
    );

  console.log(processedResult.unwrapOr([]));
}

main();
```

## API Reference

### Result Type

```typescript
type Result<T, E> = Ok<T, E> | Err<T, E>
```

A type that represents either success (`Ok<T>`) or failure (`Err<E>`).

### Creation Functions

- `ok<T, E>(value: T): Result<T, E>` - Creates a successful result
- `err<T, E>(error: E): Result<T, E>` - Creates a failed result
- `tryFn<T, E>(fn: () => T): Result<T, E>` - Wraps a function that might throw
- `tryAsync<T, E>(fn: () => Promise<T>): Promise<Result<T, E>>` - Wraps an async function that might throw

### Methods

#### Checking Result Type

- `isOk(): boolean` - Returns true if the result is Ok
- `isErr(): boolean` - Returns true if the result is Err

#### Extracting Values

- `unwrap(): T` - Returns the value if Ok, throws if Err
- `unwrapOr(defaultValue: T): T` - Returns the value if Ok, or the default value if Err
- `unwrapOrElse(fn: (err: E) => T): T` - Returns the value if Ok, or calls the function with the error if Err

#### Transforming Results

- `map<U>(fn: (value: T) => U): Result<U, E>` - Maps a Result<T, E> to Result<U, E> by applying a function to the contained Ok value
- `mapErr<F>(fn: (err: E) => F): Result<T, F>` - Maps a Result<T, E> to Result<T, F> by applying a function to the contained Err value
- `mapOr<U>(defaultValue: U, fn: (value: T) => U): U` - Returns the provided default (if Err), or applies a function to the contained value (if Ok)

#### Chaining Operations

- `andThen<U>(fn: (value: T) => Result<U, E>): Result<U, E>` - Returns the result of applying a function to the contained value (if Ok), or returns the Err value (if Err)
- `or<F>(res: Result<T, F>): Result<T, F>` - Returns the result if it contains a value, otherwise returns the other result

#### Pattern Matching

- `match<U>(options: { ok: (value: T) => U; err: (error: E) => U }): U` - Pattern matches on the result and handles both cases

## Real-World Examples

### Form Validation

```typescript
import { ok, err } from 'trycatcher';

type ValidationError = {
  field: string;
  message: string;
};

function validateUsername(username: string) {
  if (!username) {
    return err<string, ValidationError>({
      field: "username",
      message: "Username is required"
    });
  }

  if (username.length < 3) {
    return err<string, ValidationError>({
      field: "username",
      message: "Username must be at least 3 characters"
    });
  }

  return ok<string, ValidationError>(username);
}

function validateEmail(email: string) {
  if (!email) {
    return err<string, ValidationError>({
      field: "email",
      message: "Email is required"
    });
  }

  if (!email.includes("@")) {
    return err<string, ValidationError>({
      field: "email",
      message: "Invalid email format"
    });
  }

  return ok<string, ValidationError>(email);
}

function validateUser(username: string, email: string) {
  return validateUsername(username).andThen(validUsername =>
    validateEmail(email).map(validEmail => ({
      username: validUsername,
      email: validEmail
    }))
  );
}

// Usage
const result = validateUser("john", "john@example.com");

result.match({
  ok: user => console.log("Valid user:", user),
  err: error => console.error(`${error.field}: ${error.message}`)
});
```

### API Requests

```typescript
import { tryAsync } from 'trycatcher';

async function fetchUser(id: string) {
  return tryAsync(async () => {
    const response = await fetch(`https://api.example.com/users/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  });
}

async function fetchUserPosts(userId: string) {
  return tryAsync(async () => {
    const response = await fetch(`https://api.example.com/users/${userId}/posts`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response.json();
  });
}

// Chaining API requests
async function getUserWithPosts(userId: string) {
  const userResult = await fetchUser(userId);

  return userResult.andThen(async user => {
    const postsResult = await fetchUserPosts(user.id);
    return postsResult.map(posts => ({
      ...user,
      posts
    }));
  });
}

// Usage
async function displayUserProfile(userId: string) {
  const result = await getUserWithPosts(userId);

  result.match({
    ok: userWithPosts => {
      renderUserProfile(userWithPosts);
      renderUserPosts(userWithPosts.posts);
    },
    err: error => {
      showErrorMessage(`Failed to load user: ${error.message}`);
    }
  });
}
```

## Why TryCatcher?

Traditional error handling in JavaScript relies on try/catch blocks and throwing exceptions, which can lead to:

1. Forgotten error handling
2. Uncaught exceptions crashing your application
3. Unclear error flows in your code
4. Type-unsafe error handling

TryCatcher addresses these issues by:

1. Making error handling explicit through the `Result` type
2. Forcing you to consider both success and error cases
3. Providing a clean, chainable API for handling errors
4. Maintaining type safety throughout your error handling code

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
