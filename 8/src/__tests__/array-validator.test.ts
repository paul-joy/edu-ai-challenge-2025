import { ArrayValidator } from "../validators/array-validator";
import { StringValidator } from "../validators/string-validator";
import { NumberValidator } from "../validators/number-validator";
import { Schema } from "../schema";

describe("ArrayValidator", () => {
  describe("Basic array validation", () => {
    test("should validate valid arrays", () => {
      const validator = new ArrayValidator(new StringValidator());

      const result = validator.validate(["hello", "world"]);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(["hello", "world"]);
      expect(result.errors).toHaveLength(0);
    });

    test("should reject non-array values", () => {
      const validator = new ArrayValidator(new StringValidator());

      const testCases = ["string", 123, true, null, undefined, {}];

      testCases.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain("Expected array");
      });
    });

    test("should validate empty arrays", () => {
      const validator = new ArrayValidator(new StringValidator());

      const result = validator.validate([]);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual([]);
    });
  });

  describe("Item validation", () => {
    test("should validate each item in the array", () => {
      const validator = new ArrayValidator(new StringValidator().minLength(3));

      const validResult = validator.validate(["abc", "def", "ghi"]);
      expect(validResult.isValid).toBe(true);

      const invalidResult = validator.validate(["abc", "x", "def"]);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors).toHaveLength(1);
      expect(invalidResult.errors[0].path).toBe("root[1]");
    });

    test("should validate arrays of numbers", () => {
      const validator = new ArrayValidator(new NumberValidator().min(0));

      expect(validator.validate([1, 2, 3]).isValid).toBe(true);
      expect(validator.validate([0, 5, 10]).isValid).toBe(true);

      const invalidResult = validator.validate([1, -1, 3]);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].path).toBe("root[1]");
    });

    test("should collect multiple item validation errors", () => {
      const validator = new ArrayValidator(new StringValidator().minLength(2));

      const result = validator.validate(["ab", "x", "cd", "y"]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].path).toBe("root[1]");
      expect(result.errors[1].path).toBe("root[3]");
    });
  });

  describe("Length validation", () => {
    test("should validate minimum length", () => {
      const validator = new ArrayValidator(new StringValidator()).minLength(2);

      expect(validator.validate(["a", "b"]).isValid).toBe(true);
      expect(validator.validate(["a", "b", "c"]).isValid).toBe(true);

      const shortResult = validator.validate(["a"]);
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.errors[0].message).toContain("at least 2 items");
    });

    test("should validate maximum length", () => {
      const validator = new ArrayValidator(new StringValidator()).maxLength(3);

      expect(validator.validate(["a"]).isValid).toBe(true);
      expect(validator.validate(["a", "b", "c"]).isValid).toBe(true);

      const longResult = validator.validate(["a", "b", "c", "d"]);
      expect(longResult.isValid).toBe(false);
      expect(longResult.errors[0].message).toContain("at most 3 items");
    });

    test("should validate length range", () => {
      const validator = new ArrayValidator(new StringValidator()).length(2, 4);

      expect(validator.validate(["a", "b"]).isValid).toBe(true);
      expect(validator.validate(["a", "b", "c"]).isValid).toBe(true);
      expect(validator.validate(["a", "b", "c", "d"]).isValid).toBe(true);

      expect(validator.validate(["a"]).isValid).toBe(false);
      expect(validator.validate(["a", "b", "c", "d", "e"]).isValid).toBe(false);
    });
  });

  describe("Uniqueness validation", () => {
    test("should validate unique string arrays", () => {
      const validator = new ArrayValidator(new StringValidator()).unique();

      expect(validator.validate(["a", "b", "c"]).isValid).toBe(true);
      expect(validator.validate([]).isValid).toBe(true);

      const duplicateResult = validator.validate(["a", "b", "a"]);
      expect(duplicateResult.isValid).toBe(false);
      expect(duplicateResult.errors[0].message).toContain("must be unique");
      expect(duplicateResult.errors[0].path).toBe("root[2]");
    });

    test("should validate unique number arrays", () => {
      const validator = new ArrayValidator(new NumberValidator()).unique();

      expect(validator.validate([1, 2, 3]).isValid).toBe(true);

      const duplicateResult = validator.validate([1, 2, 1]);
      expect(duplicateResult.isValid).toBe(false);
      expect(duplicateResult.errors[0].path).toBe("root[2]");
    });

    test("should handle multiple duplicates", () => {
      const validator = new ArrayValidator(new StringValidator()).unique();

      const result = validator.validate(["a", "b", "a", "c", "b"]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].path).toBe("root[2]");
      expect(result.errors[1].path).toBe("root[4]");
    });

    test("should validate unique object arrays using JSON.stringify", () => {
      const objectValidator = new ArrayValidator(
        Schema.object({
          id: Schema.number(),
          name: Schema.string(),
        })
      ).unique();

      const validObjects = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
      ];
      expect(objectValidator.validate(validObjects).isValid).toBe(true);

      const duplicateObjects = [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 1, name: "Alice" },
      ];
      const result = objectValidator.validate(duplicateObjects);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("root[2]");
    });
  });

  describe("NoEmpty validation", () => {
    test("should reject empty arrays when noEmpty is enabled", () => {
      const validator = new ArrayValidator(new StringValidator()).noEmpty();

      expect(validator.validate(["a"]).isValid).toBe(true);
      expect(validator.validate(["a", "b"]).isValid).toBe(true);

      const emptyResult = validator.validate([]);
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.errors[0].message).toContain("cannot be empty");
    });
  });

  describe("Complex validation chains", () => {
    test("should handle multiple constraints", () => {
      const validator = new ArrayValidator(new StringValidator().minLength(2))
        .minLength(1)
        .maxLength(3)
        .unique()
        .noEmpty();

      expect(validator.validate(["ab", "cd"]).isValid).toBe(true);

      expect(validator.validate([]).isValid).toBe(false); // empty
      expect(validator.validate(["ab", "cd", "ef", "gh"]).isValid).toBe(false); // too long
      expect(validator.validate(["ab", "cd", "ab"]).isValid).toBe(false); // duplicate
      expect(validator.validate(["a", "bc"]).isValid).toBe(false); // item too short
    });

    test("should validate arrays of emails", () => {
      const emailArrayValidator = new ArrayValidator(
        new StringValidator().email()
      ).minLength(1);

      const validEmails = ["user@example.com", "test@domain.org"];
      expect(emailArrayValidator.validate(validEmails).isValid).toBe(true);

      const invalidEmails = ["user@example.com", "invalid-email"];
      const result = emailArrayValidator.validate(invalidEmails);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("root[1]");
    });
  });

  describe("Optional validation", () => {
    test("should allow undefined for optional validators", () => {
      const validator = new ArrayValidator(new StringValidator())
        .minLength(1)
        .optional();

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(null).isValid).toBe(true);
      expect(validator.validate(["a"]).isValid).toBe(true);
      expect(validator.validate([]).isValid).toBe(false);
    });
  });

  describe("Custom error messages", () => {
    test("should use custom error messages", () => {
      const validator = new ArrayValidator(new StringValidator())
        .minLength(2)
        .withMessage("Array must have at least 2 items");

      const result = validator.validate(["a"]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe("Array must have at least 2 items");
    });
  });

  describe("Schema integration", () => {
    test("should work with Schema.array()", () => {
      const validator = Schema.array(Schema.string().email()).minLength(1);

      expect(validator.validate(["user@example.com"]).isValid).toBe(true);
      expect(validator.validate([]).isValid).toBe(false);
      expect(validator.validate(["invalid-email"]).isValid).toBe(false);
    });

    test("should work with nested arrays", () => {
      const nestedArrayValidator = Schema.array(Schema.array(Schema.number()));

      expect(
        nestedArrayValidator.validate([
          [1, 2],
          [3, 4],
        ]).isValid
      ).toBe(true);
      expect(
        nestedArrayValidator.validate([
          [1, 2],
          ["3", 4],
        ]).isValid
      ).toBe(false);
    });
  });

  describe("Error path handling", () => {
    test("should include correct paths in nested errors", () => {
      const validator = new ArrayValidator(new StringValidator().minLength(3));

      const result = validator.validate(["abc", "x"], "data.items");
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("data.items[1]");
    });
  });

  describe("Edge cases", () => {
    test("should handle arrays with null/undefined items", () => {
      const validator = new ArrayValidator(new StringValidator().optional());

      expect(validator.validate(["a", undefined, "b"]).isValid).toBe(true);
      expect(validator.validate(["a", null, "b"]).isValid).toBe(true);
    });

    test("should handle very large arrays", () => {
      const validator = new ArrayValidator(new NumberValidator());
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);

      expect(validator.validate(largeArray).isValid).toBe(true);
    });

    test("should handle mixed type validation failures", () => {
      const validator = new ArrayValidator(new NumberValidator().positive());

      const result = validator.validate([1, "invalid", -1, 3]);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);

      const errorPaths = result.errors.map((e) => e.path);
      expect(errorPaths).toContain("root[1]"); // string instead of number
      expect(errorPaths).toContain("root[2]"); // negative number
    });
  });
});
