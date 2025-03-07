import { describe, expect, it, mock } from "bun:test";
import { ok, err, tryFn, tryAsync } from "../src";

describe("Practical examples", () => {
  describe("Data parsing", () => {
    const parseJson = (input: string) => tryFn(() => JSON.parse(input));

    it("should parse valid JSON", () => {
      const result = parseJson('{"name":"John","age":30}');
      expect(result.isOk()).toBe(true);

      const data = result.unwrap();
      expect(data.name).toBe("John");
      expect(data.age).toBe(30);
    });

    it("should handle invalid JSON", () => {
      const result = parseJson("{invalid}");
      expect(result.isErr()).toBe(true);
      expect(result.error instanceof Error).toBe(true);
    });

    it("should allow chaining operations", () => {
      const getName = (input: string): string =>
        parseJson(input)
          .map((data) => data.name)
          .unwrapOr("Unknown");

      expect(getName('{"name":"Alice"}')).toBe("Alice");
      expect(getName('{"age":25}')).toBeUndefined();
      expect(getName("{invalid}")).toBe("Unknown");
    });
  });

  describe("Validation", () => {
    type ValidationError = {
      field: string;
      message: string;
    };

    function validateUsername(username: string) {
      if (!username) {
        return err<string, ValidationError>({
          field: "username",
          message: "Username is required",
        });
      }

      if (username.length < 3) {
        return err<string, ValidationError>({
          field: "username",
          message: "Username must be at least 3 characters",
        });
      }

      return ok<string, ValidationError>(username);
    }

    function validateEmail(email: string) {
      if (!email) {
        return err<string, ValidationError>({
          field: "email",
          message: "Email is required",
        });
      }

      if (!email.includes("@")) {
        return err<string, ValidationError>({
          field: "email",
          message: "Invalid email format",
        });
      }

      return ok<string, ValidationError>(email);
    }

    it("should validate valid inputs", () => {
      const usernameResult = validateUsername("john");
      const emailResult = validateEmail("john@example.com");

      expect(usernameResult.isOk()).toBe(true);
      expect(emailResult.isOk()).toBe(true);
    });

    it("should return errors for invalid inputs", () => {
      const emptyUsername = validateUsername("");
      const shortUsername = validateUsername("jo");
      const emptyEmail = validateEmail("");
      const invalidEmail = validateEmail("invalid-email");

      expect(emptyUsername.isErr()).toBe(true);
      expect(emptyUsername.error?.message).toBe("Username is required");

      expect(shortUsername.isErr()).toBe(true);
      expect(shortUsername.error?.message).toBe(
        "Username must be at least 3 characters",
      );

      expect(emptyEmail.isErr()).toBe(true);
      expect(invalidEmail.isErr()).toBe(true);
    });

    it("should combine validations", () => {
      type User = { username: string; email: string };

      function validateUser(username: string, email: string) {
        return validateUsername(username).andThen((validUsername) =>
          validateEmail(email).map<User>((validEmail) => ({
            username: validUsername,
            email: validEmail,
          })),
        );
      }

      const validUser = validateUser("john", "john@example.com");
      const invalidUser1 = validateUser("", "john@example.com");
      const invalidUser2 = validateUser("john", "invalid-email");

      expect(validUser.isOk()).toBe(true);
      expect(invalidUser1.isErr()).toBe(true);
      expect(invalidUser2.isErr()).toBe(true);

      if (validUser.isOk()) {
        const user = validUser.unwrap();
        expect(user.username).toBe("john");
        expect(user.email).toBe("john@example.com");
      }
    });
  });

  describe("Async operations", () => {
    // Mock fetch function
    const mockFetch = mock((url: string) => {
      if (url === "https://api.example.com/success") {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: "success" }),
        });
      }

      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });
    });

    async function fetchData(url: string) {
      return tryAsync(async () => {
        const response = await mockFetch(url);
        if (!response.ok) {
          // @ts-expect-error status is defined if not ok
          throw new Error(`HTTP error: ${response.status}`);
        }
        // @ts-expect-error json is defined if ok
        return response.json();
      });
    }

    it("should handle successful requests", async () => {
      const result = await fetchData("https://api.example.com/success");
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const data = result.unwrap();
        expect(data.data).toBe("success");
      }
    });

    it("should handle failed requests", async () => {
      const result = await fetchData("https://api.example.com/not-found");
      expect(result.isErr()).toBe(true);

      if (result.isErr()) {
        expect(result.error?.message).toBe("HTTP error: 404");
      }
    });

    it("should allow chaining async operations", async () => {
      const processData = async (url: string) => {
        const result = await fetchData(url);
        return result.map((data) => {
          return { processed: true, ...data };
        });
      };

      const result = await processData("https://api.example.com/success");
      expect(result.isOk()).toBe(true);

      if (result.isOk()) {
        const data = result.unwrap();
        expect(data.processed).toBe(true);
        expect(data.data).toBe("success");
      }
    });
  });

  describe("Pattern matching", () => {
    function divide(a: number, b: number) {
      if (b === 0) {
        return err("Division by zero");
      }
      return ok(a / b);
    }

    it("should handle both cases with match", () => {
      const success = divide(10, 2);
      const failure = divide(10, 0);

      const successResult = success.match({
        ok: (value) => `Result: ${value}`,
        err: (error) => `Error: ${error}`,
      });

      const failureResult = failure.match({
        ok: (value) => `Result: ${value}`,
        err: (error) => `Error: ${error}`,
      });

      expect(successResult).toBe("Result: 5");
      expect(failureResult).toBe("Error: Division by zero");
    });
  });

  describe("File operations", () => {
    const fs = {
      readFile: mock((path: string) => {
        if (path === "exists.txt") {
          return "file contents";
        }
        throw new Error("File not found");
      }),
      writeFile: mock((path: string, data: string) => {
        if (path === "readonly.txt") {
          throw new Error("Permission denied");
        }
        return true;
      }),
    };

    const readFile = (path: string) => tryFn(() => fs.readFile(path));
    const writeFile = (path: string, data: string) =>
      tryFn(() => fs.writeFile(path, data));

    it("should handle successful file reads", () => {
      const result = readFile("exists.txt");
      expect(result.isOk()).toBe(true);
      expect(result.unwrap()).toBe("file contents");
    });

    it("should handle file read errors", () => {
      const result = readFile("nonexistent.txt");
      expect(result.isErr()).toBe(true);
      expect(result.error?.message).toBe("File not found");
    });

    it("should handle file write operations", () => {
      const success = writeFile("writable.txt", "hello");
      const failure = writeFile("readonly.txt", "hello");

      expect(success.isOk()).toBe(true);
      expect(failure.isErr()).toBe(true);
      expect(failure.error?.message).toBe("Permission denied");
    });

    it("should chain file operations", () => {
      const processFile = (path: string) => {
        return readFile(path)
          .map((content) => content.toUpperCase())
          .andThen((processed) => writeFile("output.txt", processed));
      };

      const success = processFile("exists.txt");
      const failure = processFile("nonexistent.txt");

      expect(success.isOk()).toBe(true);
      expect(failure.isErr()).toBe(true);
    });
  });

  describe("Database operations", () => {
    // Mock database
    const db = {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ],
      findUser: mock((id: number) => {
        const user = db.users.find((u) => u.id === id);
        if (!user) throw new Error(`User with id ${id} not found`);
        return user;
      }),
      updateUser: mock((id: number, data) => {
        const index = db.users.findIndex((u) => u.id === id);
        if (index === -1) throw new Error(`User with id ${id} not found`);
        if (data.name === "admin") throw new Error("Cannot use reserved name");
        return { ...db.users[index], ...data };
      }),
    };

    const findUser = (id: number) => tryFn(() => db.findUser(id));
    const updateUser = (id: number, data) =>
      tryFn(() => db.updateUser(id, data));

    it("should handle database queries", () => {
      const existingUser = findUser(1);
      const nonExistingUser = findUser(99);

      expect(existingUser.isOk()).toBe(true);
      expect(existingUser.unwrap().name).toBe("Alice");
      expect(nonExistingUser.isErr()).toBe(true);
    });

    it("should handle database updates", () => {
      const success = updateUser(1, { name: "Alice 2.0" });
      const notFound = updateUser(99, { name: "New User" });
      const validationError = updateUser(1, { name: "admin" });

      expect(success.isOk()).toBe(true);
      expect(notFound.isErr()).toBe(true);
      expect(validationError.isErr()).toBe(true);
    });

    it("should chain database operations", () => {
      const renameUser = (id: number, newName: string) => {
        return findUser(id).andThen((user) =>
          updateUser(id, { ...user, name: newName }),
        );
      };

      const success = renameUser(1, "Alicia");
      const notFound = renameUser(99, "Nobody");
      const validationError = renameUser(2, "admin");

      expect(success.isOk()).toBe(true);
      expect(success.unwrap().name).toBe("Alicia");
      expect(notFound.isErr()).toBe(true);
      expect(validationError.isErr()).toBe(true);
    });
  });
});
