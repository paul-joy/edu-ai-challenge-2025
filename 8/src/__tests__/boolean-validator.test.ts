import { BooleanValidator } from "../validators/boolean-validator";
import { Schema } from "../schema";

describe("BooleanValidator", () => {
  describe("Basic boolean validation", () => {
    test("should validate actual boolean values", () => {
      const validator = new BooleanValidator();

      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate(false).isValid).toBe(true);
      expect(validator.validate(true).data).toBe(true);
      expect(validator.validate(false).data).toBe(false);
    });

    test("should handle string representations by default", () => {
      const validator = new BooleanValidator();

      // Valid string representations
      expect(validator.validate("true").isValid).toBe(true);
      expect(validator.validate("false").isValid).toBe(true);
      expect(validator.validate("1").isValid).toBe(true);
      expect(validator.validate("0").isValid).toBe(true);
      expect(validator.validate("yes").isValid).toBe(true);
      expect(validator.validate("no").isValid).toBe(true);
      expect(validator.validate("on").isValid).toBe(true);
      expect(validator.validate("off").isValid).toBe(true);

      // Check converted values
      expect(validator.validate("true").data).toBe(true);
      expect(validator.validate("false").data).toBe(false);
      expect(validator.validate("1").data).toBe(true);
      expect(validator.validate("0").data).toBe(false);
    });

    test("should handle case insensitive string representations", () => {
      const validator = new BooleanValidator();

      expect(validator.validate("TRUE").isValid).toBe(true);
      expect(validator.validate("False").isValid).toBe(true);
      expect(validator.validate("YES").isValid).toBe(true);
      expect(validator.validate("No").isValid).toBe(true);

      expect(validator.validate("TRUE").data).toBe(true);
      expect(validator.validate("False").data).toBe(false);
    });

    test("should handle numeric representations", () => {
      const validator = new BooleanValidator();

      expect(validator.validate(1).isValid).toBe(true);
      expect(validator.validate(0).isValid).toBe(true);
      expect(validator.validate(1).data).toBe(true);
      expect(validator.validate(0).data).toBe(false);
    });

    test("should reject invalid representations", () => {
      const validator = new BooleanValidator();

      const invalidValues = ["maybe", "2", "invalid", {}, [], null, undefined];

      invalidValues.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain("Cannot convert");
      });
    });
  });

  describe("Strict mode validation", () => {
    test("should only accept actual booleans in strict mode", () => {
      const validator = new BooleanValidator().strict();

      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate(false).isValid).toBe(true);

      // Should reject string representations
      const stringValues = ["true", "false", "1", "0", "yes", "no"];
      stringValues.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain("Expected boolean");
      });

      // Should reject numeric representations
      const numericValues = [1, 0, 2, -1];
      numericValues.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain("Expected boolean");
      });
    });
  });

  describe("Truthy mode validation", () => {
    test("should convert any value to boolean using truthiness", () => {
      const validator = new BooleanValidator().truthy();

      // Truthy values
      const truthyValues = [1, "hello", {}, [], "false", -1, Infinity];
      truthyValues.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(true);
      });

      // Falsy values
      const falsyValues = [0, "", null, undefined, NaN, false];
      falsyValues.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(false);
      });
    });
  });

  describe("Optional validation", () => {
    test("should allow undefined for optional validators", () => {
      const validator = new BooleanValidator().optional();

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(null).isValid).toBe(true);
      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate(false).isValid).toBe(true);
    });

    test("should work with strict mode and optional", () => {
      const validator = new BooleanValidator().strict().optional();

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate("true").isValid).toBe(false);
    });
  });

  describe("Custom error messages", () => {
    test("should use custom error messages", () => {
      const validator = new BooleanValidator()
        .strict()
        .withMessage("Please provide a valid boolean value");

      const result = validator.validate("true");
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe(
        "Please provide a valid boolean value"
      );
    });
  });

  describe("Schema integration", () => {
    test("should work with Schema.boolean()", () => {
      const validator = Schema.boolean();

      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate("yes").isValid).toBe(true);
      expect(validator.validate("maybe").isValid).toBe(false);
    });

    test("should work with Schema.boolean().strict()", () => {
      const validator = Schema.boolean().strict();

      expect(validator.validate(true).isValid).toBe(true);
      expect(validator.validate("true").isValid).toBe(false);
    });
  });

  describe("Edge cases", () => {
    test("should handle whitespace in string values", () => {
      const validator = new BooleanValidator();

      expect(validator.validate("  true  ").isValid).toBe(true);
      expect(validator.validate("  false  ").isValid).toBe(true);
      expect(validator.validate("\ttrue\n").isValid).toBe(true);

      expect(validator.validate("  true  ").data).toBe(true);
      expect(validator.validate("  false  ").data).toBe(false);
    });

    test("should handle empty strings", () => {
      const validator = new BooleanValidator();

      const result = validator.validate("");
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("Cannot convert");
    });

    test("should handle special numeric values", () => {
      const validator = new BooleanValidator();

      // Should reject non 0/1 numbers
      const invalidNumbers = [2, -1, 0.5, Infinity, -Infinity, NaN];
      invalidNumbers.forEach((num) => {
        const result = validator.validate(num);
        expect(result.isValid).toBe(false);
      });
    });
  });

  describe("Method chaining", () => {
    test("should support method chaining", () => {
      const validator = new BooleanValidator()
        .strict()
        .optional()
        .withMessage("Custom message");

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(true).isValid).toBe(true);

      const result = validator.validate("true");
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe("Custom message");
    });
  });

  describe("Type conversion consistency", () => {
    test("should maintain consistency in type conversion", () => {
      const validator = new BooleanValidator();

      // Test that same string values always convert to same boolean
      expect(validator.validate("true").data).toBe(
        validator.validate("TRUE").data
      );
      expect(validator.validate("false").data).toBe(
        validator.validate("FALSE").data
      );
      expect(validator.validate("1").data).toBe(validator.validate(1).data);
      expect(validator.validate("0").data).toBe(validator.validate(0).data);
    });
  });
});
