import { Schema } from "../schema";

describe("Schema", () => {
  describe("Static factory methods", () => {
    test("should create string validators", () => {
      const validator = Schema.string();

      expect(validator.validate("hello").isValid).toBe(true);
      expect(validator.validate(123).isValid).toBe(false);
    });

    test("should create number validators", () => {
      const validator = Schema.number();

      expect(validator.validate(42).isValid).toBe(true);
      expect(validator.validate("42").isValid).toBe(false);
    });

    test("should create boolean validators", () => {
      const validator = Schema.boolean();

      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate("true").isValid).toBe(true);
      expect(validator.validate("maybe").isValid).toBe(false);
    });

    test("should create date validators", () => {
      const validator = Schema.date();

      expect(validator.validate(new Date()).isValid).toBe(true);
      expect(validator.validate("2023-01-01").isValid).toBe(true);
      expect(validator.validate("invalid-date").isValid).toBe(false);
    });

    test("should create array validators", () => {
      const validator = Schema.array(Schema.string());

      expect(validator.validate(["a", "b"]).isValid).toBe(true);
      expect(validator.validate(["a", 123]).isValid).toBe(false);
      expect(validator.validate("not-array").isValid).toBe(false);
    });

    test("should create object validators", () => {
      const validator = Schema.object({
        name: Schema.string(),
        age: Schema.number(),
      });

      expect(validator.validate({ name: "John", age: 30 }).isValid).toBe(true);
      expect(validator.validate({ name: "John" }).isValid).toBe(false);
      expect(validator.validate("not-object").isValid).toBe(false);
    });
  });

  describe("Any validator", () => {
    test("should accept any value", () => {
      const validator = Schema.any();

      const testValues = [
        "string",
        123,
        true,
        null,
        undefined,
        {},
        [],
        new Date(),
        Symbol("test"),
      ];

      testValues.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(value);
      });
    });

    test("should support optional() and withMessage() methods", () => {
      const validator = Schema.any();

      expect(typeof validator.optional).toBe("function");
      expect(typeof validator.withMessage).toBe("function");

      // Should return validators (not throw)
      expect(() => validator.optional()).not.toThrow();
      expect(() => validator.withMessage("custom")).not.toThrow();
    });
  });

  describe("Nullable validator", () => {
    test("should accept null and undefined values", () => {
      const validator = Schema.nullable(Schema.string());

      expect(validator.validate(null).isValid).toBe(true);
      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate("hello").isValid).toBe(true);

      expect(validator.validate(null).data).toBe(null);
      expect(validator.validate(undefined).data).toBe(null);
    });

    test("should delegate to wrapped validator for non-null values", () => {
      const validator = Schema.nullable(Schema.string().minLength(5));

      expect(validator.validate("hello").isValid).toBe(true);
      expect(validator.validate("hi").isValid).toBe(false);
      expect(validator.validate(null).isValid).toBe(true);
    });

    test("should support method chaining", () => {
      const validator = Schema.nullable(Schema.string());

      expect(typeof validator.optional).toBe("function");
      expect(typeof validator.withMessage).toBe("function");
    });
  });

  describe("Union validator", () => {
    test("should accept values matching any of the validators", () => {
      const validator = Schema.union([Schema.string(), Schema.number()]);

      expect(validator.validate("hello").isValid).toBe(true);
      expect(validator.validate(42).isValid).toBe(true);
      expect(validator.validate(true).isValid).toBe(false);
    });

    test("should return data from the first matching validator", () => {
      const validator = Schema.union([
        Schema.string().minLength(3),
        Schema.number(),
      ]);

      const stringResult = validator.validate("hello");
      expect(stringResult.isValid).toBe(true);
      expect(stringResult.data).toBe("hello");

      const numberResult = validator.validate(42);
      expect(numberResult.isValid).toBe(true);
      expect(numberResult.data).toBe(42);
    });

    test("should fail when no validators match", () => {
      const validator = Schema.union([Schema.string(), Schema.number()]);

      const result = validator.validate(true);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain(
        "does not match any of the union types"
      );
    });

    test("should try validators in order", () => {
      const validator = Schema.union([
        Schema.string().minLength(10), // Will fail for short strings
        Schema.string().minLength(3), // Will succeed for strings >= 3 chars
      ]);

      // Should succeed with second validator
      const result = validator.validate("hello");
      expect(result.isValid).toBe(true);
    });

    test("should support method chaining", () => {
      const validator = Schema.union([Schema.string(), Schema.number()]);

      expect(typeof validator.optional).toBe("function");
      expect(typeof validator.withMessage).toBe("function");
    });

    test("should apply custom error messages", () => {
      const validator = Schema.union([
        Schema.string(),
        Schema.number(),
      ]).withMessage("Must be string or number");

      const result = validator.validate(true);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe("Must be string or number");
    });
  });

  describe("Complex schema compositions", () => {
    test("should handle nested arrays and objects", () => {
      const validator = Schema.object({
        users: Schema.array(
          Schema.object({
            name: Schema.string().minLength(1),
            email: Schema.string().email(),
            roles: Schema.array(Schema.string()).optional(),
            metadata: Schema.object({
              createdAt: Schema.date(),
              preferences: Schema.object({
                theme: Schema.union([
                  Schema.string().pattern(/^(light|dark)$/),
                  Schema.string().pattern(/^#[0-9a-fA-F]{6}$/),
                ]),
              }).optional(),
            }).optional(),
          })
        ),
        totalCount: Schema.number().min(0),
      });

      const validData = {
        users: [
          {
            name: "John Doe",
            email: "john@example.com",
            roles: ["admin", "user"],
            metadata: {
              createdAt: new Date("2023-01-01"),
              preferences: {
                theme: "dark",
              },
            },
          },
          {
            name: "Jane Smith",
            email: "jane@example.com",
          },
        ],
        totalCount: 2,
      };

      expect(validator.validate(validData).isValid).toBe(true);
    });

    test("should handle conditional validation patterns", () => {
      // User can be either a guest (with just email) or registered (with id and name)
      const userValidator = Schema.union([
        Schema.object({
          type: Schema.string().pattern(/^guest$/),
          email: Schema.string().email(),
        }),
        Schema.object({
          type: Schema.string().pattern(/^registered$/),
          id: Schema.string(),
          name: Schema.string().minLength(1),
          email: Schema.string().email(),
        }),
      ]);

      const guestUser = {
        type: "guest",
        email: "guest@example.com",
      };

      const registeredUser = {
        type: "registered",
        id: "123",
        name: "John Doe",
        email: "john@example.com",
      };

      expect(userValidator.validate(guestUser).isValid).toBe(true);
      expect(userValidator.validate(registeredUser).isValid).toBe(true);
    });
  });

  describe("Real-world validation scenarios", () => {
    test("should validate API request payload", () => {
      const createUserRequestValidator = Schema.object({
        user: Schema.object({
          username: Schema.string().minLength(3).maxLength(20),
          email: Schema.string().email(),
          password: Schema.string().minLength(8),
          profile: Schema.object({
            firstName: Schema.string().minLength(1),
            lastName: Schema.string().minLength(1),
            bio: Schema.string().maxLength(500).optional(),
            avatarUrl: Schema.string().url().optional(),
          }),
          preferences: Schema.object({
            newsletter: Schema.boolean(),
            notifications: Schema.object({
              email: Schema.boolean(),
              push: Schema.boolean(),
              sms: Schema.boolean(),
            }),
            privacy: Schema.object({
              profileVisible: Schema.boolean(),
              allowMessages: Schema.boolean(),
            }),
          }),
        }),
        metadata: Schema.object({
          source: Schema.string(),
          campaign: Schema.string().optional(),
          referrer: Schema.nullable(Schema.string().url()),
        }).optional(),
      });

      const validRequest = {
        user: {
          username: "johndoe",
          email: "john@example.com",
          password: "securepassword123",
          profile: {
            firstName: "John",
            lastName: "Doe",
            bio: "Software developer from NYC",
          },
          preferences: {
            newsletter: true,
            notifications: {
              email: true,
              push: false,
              sms: false,
            },
            privacy: {
              profileVisible: true,
              allowMessages: true,
            },
          },
        },
        metadata: {
          source: "web",
          referrer: null,
        },
      };

      const result = createUserRequestValidator.validate(validRequest);
      expect(result.isValid).toBe(true);
    });

    test("should validate configuration objects", () => {
      const configValidator = Schema.object({
        database: Schema.object({
          host: Schema.string(),
          port: Schema.number().min(1).max(65535),
          name: Schema.string(),
          credentials: Schema.union([
            Schema.object({
              type: Schema.string().pattern(/^password$/),
              username: Schema.string(),
              password: Schema.string(),
            }),
            Schema.object({
              type: Schema.string().pattern(/^token$/),
              token: Schema.string(),
            }),
          ]),
        }),
        cache: Schema.object({
          enabled: Schema.boolean(),
          provider: Schema.union([
            Schema.string().pattern(/^memory$/),
            Schema.string().pattern(/^redis$/),
          ]),
          config: Schema.object({}).optional(), // Could be extended per provider
        }),
        logging: Schema.object({
          level: Schema.union([
            Schema.string().pattern(/^(debug|info|warn|error)$/),
          ]),
          outputs: Schema.array(
            Schema.union([
              Schema.string().pattern(/^console$/),
              Schema.string().pattern(/^file$/),
              Schema.string().pattern(/^syslog$/),
            ])
          ).minLength(1),
        }),
      });

      const validConfig = {
        database: {
          host: "localhost",
          port: 5432,
          name: "myapp",
          credentials: {
            type: "password",
            username: "user",
            password: "pass",
          },
        },
        cache: {
          enabled: true,
          provider: "redis",
        },
        logging: {
          level: "info",
          outputs: ["console", "file"],
        },
      };

      expect(configValidator.validate(validConfig).isValid).toBe(true);
    });
  });

  describe("Error handling and edge cases", () => {
    test("should handle deeply nested validation errors", () => {
      const validator = Schema.object({
        level1: Schema.object({
          level2: Schema.object({
            level3: Schema.object({
              value: Schema.string().minLength(5),
            }),
          }),
        }),
      });

      const invalidData = {
        level1: {
          level2: {
            level3: {
              value: "x",
            },
          },
        },
      };

      const result = validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("level1.level2.level3.value");
    });

    test("should handle empty union validators gracefully", () => {
      const validator = Schema.union([]);

      const result = validator.validate("anything");
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain(
        "does not match any of the union types"
      );
    });

    test("should preserve original error information in unions", () => {
      const validator = Schema.union([
        Schema.string().minLength(10),
        Schema.number().min(100),
      ]);

      const result = validator.validate("short");
      expect(result.isValid).toBe(false);
      // Should contain errors from all attempted validators
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Type inference patterns", () => {
    test("should work with complex type inference scenarios", () => {
      // This test mainly verifies that the validators can be created
      // without TypeScript compilation errors (type inference works)

      const userSchema = Schema.object({
        id: Schema.string(),
        profile: Schema.object({
          name: Schema.string(),
          age: Schema.number().optional(),
        }),
        tags: Schema.array(Schema.string()),
        metadata: Schema.union([
          Schema.object({ type: Schema.string() }),
          Schema.nullable(Schema.string()),
        ]),
      });

      // The fact that this compiles successfully indicates type inference is working
      expect(typeof userSchema.validate).toBe("function");
    });
  });
});
