import { ObjectValidator } from "../validators/object-validator";
import { StringValidator } from "../validators/string-validator";
import { NumberValidator } from "../validators/number-validator";
import { Schema } from "../schema";

describe("ObjectValidator", () => {
  describe("Basic object validation", () => {
    test("should validate valid objects", () => {
      const schema = {
        name: new StringValidator(),
        age: new NumberValidator(),
      };
      const validator = new ObjectValidator(schema);

      const result = validator.validate({ name: "John", age: 30 });
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: "John", age: 30 });
      expect(result.errors).toHaveLength(0);
    });

    test("should reject non-object values", () => {
      const schema = { name: new StringValidator() };
      const validator = new ObjectValidator(schema);

      const testCases = ["string", 123, true, [], null, undefined];

      testCases.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        if (Array.isArray(value)) {
          expect(result.errors[0].message).toContain(
            "Expected object, received array"
          );
        } else if (value === null) {
          expect(result.errors[0].message).toContain("Object cannot be null");
        } else {
          expect(result.errors[0].message).toContain("Expected object");
        }
      });
    });

    test("should validate empty objects when schema is empty", () => {
      const validator = new ObjectValidator({});

      const result = validator.validate({});
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe("Property validation", () => {
    test("should validate each property according to schema", () => {
      const schema = {
        name: new StringValidator().minLength(2),
        age: new NumberValidator().min(0),
        email: new StringValidator().email(),
      };
      const validator = new ObjectValidator(schema);

      const validData = {
        name: "John Doe",
        age: 30,
        email: "john@example.com",
      };
      expect(validator.validate(validData).isValid).toBe(true);

      const invalidData = {
        name: "J",
        age: -1,
        email: "invalid-email",
      };
      const result = validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);

      const errorPaths = result.errors.map((e) => e.path);
      expect(errorPaths).toContain("name");
      expect(errorPaths).toContain("age");
      expect(errorPaths).toContain("email");
    });

    test("should handle missing properties", () => {
      const schema = {
        name: new StringValidator(),
        age: new NumberValidator(),
      };
      const validator = new ObjectValidator(schema);

      const result = validator.validate({ name: "John" });
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.path === "age")).toBe(true);
    });

    test("should handle optional properties", () => {
      const schema = {
        name: new StringValidator(),
        age: new NumberValidator().optional(),
      };
      const validator = new ObjectValidator(schema);

      const result = validator.validate({ name: "John" });
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: "John" });
    });
  });

  describe("Strict mode validation", () => {
    test("should reject additional properties in strict mode", () => {
      const schema = {
        name: new StringValidator(),
        age: new NumberValidator(),
      };
      const validator = new ObjectValidator(schema).strict();

      const validData = { name: "John", age: 30 };
      expect(validator.validate(validData).isValid).toBe(true);

      const invalidData = { name: "John", age: 30, extra: "property" };
      const result = validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Unexpected property "extra"');
      expect(result.errors[0].path).toBe("extra");
    });

    test("should allow additional properties in non-strict mode", () => {
      const schema = {
        name: new StringValidator(),
        age: new NumberValidator(),
      };
      const validator = new ObjectValidator(schema);

      const data = { name: "John", age: 30, extra: "property" };
      const result = validator.validate(data);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual({ name: "John", age: 30, extra: "property" });
    });
  });

  describe("Partial validation", () => {
    test("should make all properties optional in partial mode", () => {
      const schema = {
        name: new StringValidator().minLength(2),
        age: new NumberValidator().min(0),
        email: new StringValidator().email(),
      };
      const validator = new ObjectValidator(schema).partial();

      expect(validator.validate({}).isValid).toBe(true);
      expect(validator.validate({ name: "John" }).isValid).toBe(true);
      expect(validator.validate({ age: 30 }).isValid).toBe(true);
      expect(validator.validate({ email: "john@example.com" }).isValid).toBe(
        true
      );

      // Still validates provided properties
      const result = validator.validate({ name: "J" });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("name");
    });
  });

  describe("Allow null validation", () => {
    test("should handle null values when allowNull is enabled", () => {
      const schema = { name: new StringValidator() };
      const validator = new ObjectValidator(schema).allowNull();

      expect(validator.validate(null).isValid).toBe(true);
      expect(validator.validate({ name: "John" }).isValid).toBe(true);
    });

    test("should reject null values by default", () => {
      const schema = { name: new StringValidator() };
      const validator = new ObjectValidator(schema);

      const result = validator.validate(null);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("Object cannot be null");
    });
  });

  describe("Pick and Omit operations", () => {
    test("should pick specific properties", () => {
      const schema = {
        name: new StringValidator(),
        age: new NumberValidator(),
        email: new StringValidator().email(),
      };
      const validator = new ObjectValidator(schema).pick(["name", "email"]);

      const result = validator.validate({
        name: "John",
        email: "john@example.com",
      });
      expect(result.isValid).toBe(true);

      // Age is not required anymore
      const partialResult = validator.validate({ name: "John" });
      expect(partialResult.isValid).toBe(false); // email is still required
    });

    test("should omit specific properties", () => {
      const schema = {
        name: new StringValidator(),
        age: new NumberValidator(),
        email: new StringValidator().email(),
      };
      const validator = new ObjectValidator(schema).omit(["age"]);

      const result = validator.validate({
        name: "John",
        email: "john@example.com",
      });
      expect(result.isValid).toBe(true);

      // Age is not validated anymore
      const withAgeResult = validator.validate({
        name: "John",
        email: "john@example.com",
        age: "invalid", // This should be ignored
      });
      expect(withAgeResult.isValid).toBe(true);
    });
  });

  describe("Extend operations", () => {
    test("should extend schema with additional properties", () => {
      const baseSchema = {
        name: new StringValidator(),
        age: new NumberValidator(),
      };
      const baseValidator = new ObjectValidator(baseSchema);

      const extendedValidator = baseValidator.extend({
        email: new StringValidator().email(),
        isActive: new BooleanValidator(),
      });

      const result = extendedValidator.validate({
        name: "John",
        age: 30,
        email: "john@example.com",
        isActive: true,
      });
      expect(result.isValid).toBe(true);

      // All properties are now required
      const incompleteResult = extendedValidator.validate({
        name: "John",
        age: 30,
        // missing email and isActive
      });
      expect(incompleteResult.isValid).toBe(false);
    });
  });

  describe("Nested object validation", () => {
    test("should validate nested objects", () => {
      const addressSchema = {
        street: new StringValidator(),
        city: new StringValidator(),
        zipCode: new StringValidator().pattern(/^\d{5}$/),
      };

      const userSchema = {
        name: new StringValidator(),
        address: new ObjectValidator(addressSchema),
      };
      const validator = new ObjectValidator(userSchema);

      const validData = {
        name: "John",
        address: {
          street: "123 Main St",
          city: "Anytown",
          zipCode: "12345",
        },
      };
      expect(validator.validate(validData).isValid).toBe(true);

      const invalidData = {
        name: "John",
        address: {
          street: "123 Main St",
          city: "Anytown",
          zipCode: "invalid",
        },
      };
      const result = validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("address.zipCode");
    });

    test("should handle deeply nested objects", () => {
      const schema = {
        user: new ObjectValidator({
          profile: new ObjectValidator({
            personal: new ObjectValidator({
              name: new StringValidator().minLength(2),
            }),
          }),
        }),
      };
      const validator = new ObjectValidator(schema);

      const invalidData = {
        user: {
          profile: {
            personal: {
              name: "J",
            },
          },
        },
      };
      const result = validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("user.profile.personal.name");
    });
  });

  describe("Optional validation", () => {
    test("should allow undefined for optional validators", () => {
      const schema = { name: new StringValidator() };
      const validator = new ObjectValidator(schema).optional();

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(null).isValid).toBe(true);
      expect(validator.validate({ name: "John" }).isValid).toBe(true);
    });
  });

  describe("Custom error messages", () => {
    test("should use custom error messages", () => {
      const schema = { name: new StringValidator().minLength(2) };
      const validator = new ObjectValidator(schema).withMessage(
        "Object validation failed"
      );

      const result = validator.validate({ name: "J" });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe("Object validation failed");
    });
  });

  describe("Schema integration", () => {
    test("should work with Schema.object()", () => {
      const validator = Schema.object({
        name: Schema.string().minLength(2),
        age: Schema.number().min(0),
        email: Schema.string().email(),
      });

      const validData = {
        name: "John",
        age: 30,
        email: "john@example.com",
      };
      expect(validator.validate(validData).isValid).toBe(true);
    });

    test("should work with nested Schema objects", () => {
      const addressSchema = Schema.object({
        street: Schema.string(),
        city: Schema.string(),
      });

      const userSchema = Schema.object({
        name: Schema.string(),
        address: addressSchema,
      });

      const validData = {
        name: "John",
        address: {
          street: "123 Main St",
          city: "Anytown",
        },
      };
      expect(userSchema.validate(validData).isValid).toBe(true);
    });
  });

  describe("Complex validation scenarios", () => {
    test("should handle user registration validation", () => {
      const validator = Schema.object({
        username: Schema.string().minLength(3).maxLength(20),
        email: Schema.string().email(),
        password: Schema.string().minLength(8),
        confirmPassword: Schema.string(),
        profile: Schema.object({
          firstName: Schema.string().minLength(1),
          lastName: Schema.string().minLength(1),
          age: Schema.number().min(13).max(120).optional(),
        }),
        preferences: Schema.object({
          newsletter: Schema.boolean(),
          notifications: Schema.boolean(),
        }).optional(),
      });

      const validRegistration = {
        username: "johndoe",
        email: "john@example.com",
        password: "securepassword",
        confirmPassword: "securepassword",
        profile: {
          firstName: "John",
          lastName: "Doe",
          age: 25,
        },
      };
      expect(validator.validate(validRegistration).isValid).toBe(true);
    });

    test("should accumulate multiple validation errors", () => {
      const validator = Schema.object({
        name: Schema.string().minLength(2),
        age: Schema.number().min(0),
        email: Schema.string().email(),
      });

      const invalidData = {
        name: "J",
        age: -1,
        email: "invalid",
      };

      const result = validator.validate(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });

  describe("Edge cases", () => {
    test("should handle objects with prototype pollution attempts", () => {
      const schema = { name: new StringValidator() };
      const validator = new ObjectValidator(schema);

      const maliciousData = JSON.parse(
        '{"__proto__": {"polluted": true}, "name": "test"}'
      );
      const result = validator.validate(maliciousData);

      // Should validate normally, ignoring prototype pollution
      expect(result.isValid).toBe(true);
      expect(result.data?.name).toBe("test");
    });

    test("should handle circular references gracefully", () => {
      const schema = { name: new StringValidator() };
      const validator = new ObjectValidator(schema);

      const circularObj: any = { name: "test" };
      circularObj.self = circularObj;

      // Should not crash on circular references
      expect(() => validator.validate(circularObj)).not.toThrow();
    });
  });
});

// Helper class for testing
class BooleanValidator {
  validate(value: any) {
    return {
      isValid: typeof value === "boolean",
      data: value,
      errors:
        typeof value === "boolean"
          ? []
          : [{ path: "root", message: "Expected boolean", value }],
    };
  }

  optional() {
    return this;
  }

  withMessage() {
    return this;
  }
}
