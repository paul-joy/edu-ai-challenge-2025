import { StringValidator } from "../validators/string-validator";
import { Schema } from "../schema";

describe("StringValidator", () => {
  describe("Basic string validation", () => {
    test("should validate valid strings", () => {
      const validator = new StringValidator();
      const result = validator.validate("hello world");

      expect(result.isValid).toBe(true);
      expect(result.data).toBe("hello world");
      expect(result.errors).toHaveLength(0);
    });

    test("should reject non-string values", () => {
      const validator = new StringValidator();

      const testCases = [123, true, null, undefined, {}, []];

      testCases.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain("Expected string");
      });
    });
  });

  describe("Length validation", () => {
    test("should validate minimum length", () => {
      const validator = new StringValidator().minLength(3);

      expect(validator.validate("abc").isValid).toBe(true);
      expect(validator.validate("abcd").isValid).toBe(true);

      const shortResult = validator.validate("ab");
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.errors[0].message).toContain("at least 3 characters");
    });

    test("should validate maximum length", () => {
      const validator = new StringValidator().maxLength(5);

      expect(validator.validate("abc").isValid).toBe(true);
      expect(validator.validate("abcde").isValid).toBe(true);

      const longResult = validator.validate("abcdef");
      expect(longResult.isValid).toBe(false);
      expect(longResult.errors[0].message).toContain("at most 5 characters");
    });

    test("should validate length range", () => {
      const validator = new StringValidator().length(2, 4);

      expect(validator.validate("ab").isValid).toBe(true);
      expect(validator.validate("abc").isValid).toBe(true);
      expect(validator.validate("abcd").isValid).toBe(true);

      expect(validator.validate("a").isValid).toBe(false);
      expect(validator.validate("abcde").isValid).toBe(false);
    });
  });

  describe("Pattern validation", () => {
    test("should validate regex patterns", () => {
      const validator = new StringValidator().pattern(/^[A-Z]+$/);

      expect(validator.validate("ABC").isValid).toBe(true);
      expect(validator.validate("HELLO").isValid).toBe(true);

      const invalidResult = validator.validate("abc");
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.errors[0].message).toContain(
        "does not match required pattern"
      );
    });

    test("should handle complex patterns", () => {
      const phoneValidator = new StringValidator().pattern(
        /^\+\d{1,3}-\d{3}-\d{3}-\d{4}$/
      );

      expect(phoneValidator.validate("+1-555-123-4567").isValid).toBe(true);
      expect(phoneValidator.validate("555-123-4567").isValid).toBe(false);
      expect(phoneValidator.validate("+1-555-123-456").isValid).toBe(false);
    });
  });

  describe("Email validation", () => {
    test("should validate correct email addresses", () => {
      const validator = new StringValidator().email();

      const validEmails = [
        "user@example.com",
        "test.email@domain.co.uk",
        "user+tag@example.org",
        "firstname.lastname@company.com",
      ];

      validEmails.forEach((email) => {
        const result = validator.validate(email);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(email);
      });
    });

    test("should reject invalid email addresses", () => {
      const validator = new StringValidator().email();

      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "user@",
        "user@.com",
        "user..name@example.com",
        "user name@example.com",
      ];

      invalidEmails.forEach((email) => {
        const result = validator.validate(email);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toBe("Invalid email format");
      });
    });
  });

  describe("URL validation", () => {
    test("should validate correct URLs", () => {
      const validator = new StringValidator().url();

      const validUrls = [
        "https://example.com",
        "http://example.com",
        "https://www.example.com/path",
        "https://example.com:8080/path?query=value",
      ];

      validUrls.forEach((url) => {
        const result = validator.validate(url);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(url);
      });
    });

    test("should reject invalid URLs", () => {
      const validator = new StringValidator().url();

      const invalidUrls = [
        "not-a-url",
        "ftp://invalid",
        "just-text",
        "http://",
        "https://",
      ];

      invalidUrls.forEach((url) => {
        const result = validator.validate(url);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toBe("Invalid URL format");
      });
    });
  });

  describe("UUID validation", () => {
    test("should validate correct UUIDs", () => {
      const validator = new StringValidator().uuid();

      const validUuids = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      ];

      validUuids.forEach((uuid) => {
        const result = validator.validate(uuid);
        expect(result.isValid).toBe(true);
        expect(result.data).toBe(uuid);
      });
    });

    test("should reject invalid UUIDs", () => {
      const validator = new StringValidator().uuid();

      const invalidUuids = [
        "not-a-uuid",
        "123e4567-e89b-12d3-a456",
        "123e4567-e89b-12d3-a456-426614174000-extra",
        "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      ];

      invalidUuids.forEach((uuid) => {
        const result = validator.validate(uuid);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toBe("Invalid UUID format");
      });
    });
  });

  describe("Trim functionality", () => {
    test("should trim whitespace when enabled", () => {
      const validator = new StringValidator().trim().minLength(3);

      const result = validator.validate("  abc  ");
      expect(result.isValid).toBe(true);
      expect(result.data).toBe("abc");
    });

    test("should not trim when disabled", () => {
      const validator = new StringValidator().minLength(3);

      const result = validator.validate("  a  ");
      expect(result.isValid).toBe(true);
      expect(result.data).toBe("  a  ");
    });
  });

  describe("Optional validation", () => {
    test("should allow undefined for optional validators", () => {
      const validator = new StringValidator().minLength(3).optional();

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(null).isValid).toBe(true);
      expect(validator.validate("abc").isValid).toBe(true);
      expect(validator.validate("ab").isValid).toBe(false);
    });
  });

  describe("Custom error messages", () => {
    test("should use custom error messages", () => {
      const validator = new StringValidator()
        .minLength(5)
        .withMessage("Custom error message");

      const result = validator.validate("abc");
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe("Custom error message");
    });
  });

  describe("Method chaining", () => {
    test("should support method chaining", () => {
      const validator = new StringValidator()
        .minLength(3)
        .maxLength(10)
        .pattern(/^[a-zA-Z]+$/)
        .trim();

      expect(validator.validate("  Hello  ").isValid).toBe(true);
      expect(validator.validate("  Hi  ").isValid).toBe(false); // too short
      expect(validator.validate("  VeryLongString  ").isValid).toBe(false); // too long
      expect(validator.validate("  Hello123  ").isValid).toBe(false); // invalid pattern
    });
  });

  describe("Schema integration", () => {
    test("should work with Schema.string()", () => {
      const validator = Schema.string().email().minLength(5);

      expect(validator.validate("user@example.com").isValid).toBe(true);
      expect(validator.validate("a@b.c").isValid).toBe(false); // too short
      expect(validator.validate("invalid-email").isValid).toBe(false);
    });
  });

  describe("Error path handling", () => {
    test("should include correct path in errors", () => {
      const validator = new StringValidator().minLength(5);

      const result = validator.validate("abc", "user.name");
      expect(result.isValid).toBe(false);
      expect(result.errors[0].path).toBe("user.name");
    });
  });
});
