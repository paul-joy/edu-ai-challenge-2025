import { NumberValidator } from "../validators/number-validator";
import { Schema } from "../schema";

describe("NumberValidator", () => {
  describe("Basic number validation", () => {
    test("should validate valid numbers", () => {
      const validator = new NumberValidator();

      const validNumbers = [0, 1, -1, 3.14, -2.5, 1000, 0.001];

      validNumbers.forEach((num) => {
        const result = validator.validate(num);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(num);
        expect(result.errors).toHaveLength(0);
      });
    });

    test("should reject non-number values", () => {
      const validator = new NumberValidator();

      const testCases = ["123", true, null, undefined, {}, []];

      testCases.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain("Expected number");
      });
    });

    test("should reject NaN", () => {
      const validator = new NumberValidator();

      const result = validator.validate(NaN);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("not NaN");
    });
  });

  describe("Min/Max validation", () => {
    test("should validate minimum value", () => {
      const validator = new NumberValidator().min(5);

      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(10).isValid).toBe(true);

      const belowMinResult = validator.validate(4);
      expect(belowMinResult.isValid).toBe(false);
      expect(belowMinResult.errors[0].message).toContain("at least 5");
    });

    test("should validate maximum value", () => {
      const validator = new NumberValidator().max(10);

      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(10).isValid).toBe(true);

      const aboveMaxResult = validator.validate(11);
      expect(aboveMaxResult.isValid).toBe(false);
      expect(aboveMaxResult.errors[0].message).toContain("at most 10");
    });

    test("should validate range", () => {
      const validator = new NumberValidator().range(1, 10);

      expect(validator.validate(1).isValid).toBe(true);
      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(10).isValid).toBe(true);

      expect(validator.validate(0).isValid).toBe(false);
      expect(validator.validate(11).isValid).toBe(false);
    });

    test("should handle negative ranges", () => {
      const validator = new NumberValidator().range(-10, -1);

      expect(validator.validate(-5).isValid).toBe(true);
      expect(validator.validate(-1).isValid).toBe(true);
      expect(validator.validate(-10).isValid).toBe(true);

      expect(validator.validate(0).isValid).toBe(false);
      expect(validator.validate(-11).isValid).toBe(false);
    });
  });

  describe("Integer validation", () => {
    test("should validate integers", () => {
      const validator = new NumberValidator().integer();

      const validIntegers = [0, 1, -1, 100, -100];

      validIntegers.forEach((int) => {
        expect(validator.validate(int).isValid).toBe(true);
      });
    });

    test("should reject non-integers", () => {
      const validator = new NumberValidator().integer();

      const invalidIntegers = [1.5, -2.7, 0.1, 3.14159];

      invalidIntegers.forEach((num) => {
        const result = validator.validate(num);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain("must be an integer");
      });
    });
  });

  describe("Positive/Negative validation", () => {
    test("should validate positive numbers", () => {
      const validator = new NumberValidator().positive();

      expect(validator.validate(1).isValid).toBe(true);
      expect(validator.validate(0.1).isValid).toBe(true);
      expect(validator.validate(1000).isValid).toBe(true);

      const negativeResult = validator.validate(-1);
      expect(negativeResult.isValid).toBe(false);
      expect(negativeResult.errors[0].message).toContain("must be positive");

      const zeroResult = validator.validate(0);
      expect(zeroResult.isValid).toBe(false);
      expect(zeroResult.errors[0].message).toContain("must be positive");
    });

    test("should validate negative numbers", () => {
      const validator = new NumberValidator().negative();

      expect(validator.validate(-1).isValid).toBe(true);
      expect(validator.validate(-0.1).isValid).toBe(true);
      expect(validator.validate(-1000).isValid).toBe(true);

      const positiveResult = validator.validate(1);
      expect(positiveResult.isValid).toBe(false);
      expect(positiveResult.errors[0].message).toContain("must be negative");

      const zeroResult = validator.validate(0);
      expect(zeroResult.isValid).toBe(false);
      expect(zeroResult.errors[0].message).toContain("must be negative");
    });
  });

  describe("Finite validation", () => {
    test("should validate finite numbers", () => {
      const validator = new NumberValidator().finite();

      expect(validator.validate(100).isValid).toBe(true);
      expect(validator.validate(-100).isValid).toBe(true);
      expect(validator.validate(3.14).isValid).toBe(true);

      const infinityResult = validator.validate(Infinity);
      expect(infinityResult.isValid).toBe(false);
      expect(infinityResult.errors[0].message).toContain("must be finite");

      const negInfinityResult = validator.validate(-Infinity);
      expect(negInfinityResult.isValid).toBe(false);
      expect(negInfinityResult.errors[0].message).toContain("must be finite");
    });
  });

  describe("MultipleOf validation", () => {
    test("should validate multiples", () => {
      const validator = new NumberValidator().multipleOf(5);

      expect(validator.validate(0).isValid).toBe(true);
      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(10).isValid).toBe(true);
      expect(validator.validate(-15).isValid).toBe(true);

      const notMultipleResult = validator.validate(7);
      expect(notMultipleResult.isValid).toBe(false);
      expect(notMultipleResult.errors[0].message).toContain("multiple of 5");
    });

    test("should handle decimal multiples", () => {
      const validator = new NumberValidator().multipleOf(0.5);

      expect(validator.validate(1).isValid).toBe(true);
      expect(validator.validate(1.5).isValid).toBe(true);
      expect(validator.validate(2).isValid).toBe(true);

      expect(validator.validate(1.3).isValid).toBe(false);
    });
  });

  describe("Complex validation chains", () => {
    test("should handle multiple constraints", () => {
      const validator = new NumberValidator()
        .min(0)
        .max(100)
        .integer()
        .multipleOf(5);

      expect(validator.validate(0).isValid).toBe(true);
      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(50).isValid).toBe(true);
      expect(validator.validate(100).isValid).toBe(true);

      expect(validator.validate(-5).isValid).toBe(false); // below min
      expect(validator.validate(105).isValid).toBe(false); // above max
      expect(validator.validate(2.5).isValid).toBe(false); // not integer
      expect(validator.validate(7).isValid).toBe(false); // not multiple of 5
    });

    test("should validate age constraint example", () => {
      const ageValidator = new NumberValidator().min(0).max(150).integer();

      expect(ageValidator.validate(25).isValid).toBe(true);
      expect(ageValidator.validate(0).isValid).toBe(true);
      expect(ageValidator.validate(150).isValid).toBe(true);

      expect(ageValidator.validate(-1).isValid).toBe(false);
      expect(ageValidator.validate(151).isValid).toBe(false);
      expect(ageValidator.validate(25.5).isValid).toBe(false);
    });
  });

  describe("Optional validation", () => {
    test("should allow undefined for optional validators", () => {
      const validator = new NumberValidator().min(0).optional();

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(null).isValid).toBe(true);
      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(-1).isValid).toBe(false);
    });
  });

  describe("Custom error messages", () => {
    test("should use custom error messages", () => {
      const validator = new NumberValidator()
        .min(18)
        .withMessage("Must be at least 18 years old");

      const result = validator.validate(16);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe("Must be at least 18 years old");
    });
  });

  describe("Schema integration", () => {
    test("should work with Schema.number()", () => {
      const validator = Schema.number().positive().integer();

      expect(validator.validate(5).isValid).toBe(true);
      expect(validator.validate(-5).isValid).toBe(false);
      expect(validator.validate(5.5).isValid).toBe(false);
    });
  });

  describe("Error accumulation", () => {
    test("should collect multiple validation errors", () => {
      const validator = new NumberValidator().min(10).max(20).integer();

      const result = validator.validate(5.5);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);

      const errorMessages = result.errors.map((e) => e.message);
      expect(errorMessages.some((msg) => msg.includes("at least 10"))).toBe(
        true
      );
      expect(errorMessages.some((msg) => msg.includes("integer"))).toBe(true);
    });
  });

  describe("Edge cases", () => {
    test("should handle very large numbers", () => {
      const validator = new NumberValidator();

      expect(validator.validate(Number.MAX_SAFE_INTEGER).isValid).toBe(true);
      expect(validator.validate(Number.MIN_SAFE_INTEGER).isValid).toBe(true);
    });

    test("should handle very small decimals", () => {
      const validator = new NumberValidator();

      expect(validator.validate(Number.EPSILON).isValid).toBe(true);
      expect(validator.validate(-Number.EPSILON).isValid).toBe(true);
    });
  });
});
