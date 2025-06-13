import { DateValidator } from "../validators/date-validator";
import { Schema } from "../schema";

describe("DateValidator", () => {
  describe("Basic date validation", () => {
    test("should validate Date objects", () => {
      const validator = new DateValidator();

      const now = new Date();
      const result = validator.validate(now);
      expect(result.isValid).toBe(true);
      expect(result.data).toBe(now);
      expect(result.errors).toHaveLength(0);
    });

    test("should validate date strings", () => {
      const validator = new DateValidator();

      const dateString = "2023-12-25T10:30:00.000Z";
      const result = validator.validate(dateString);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(new Date(dateString));
    });

    test("should validate timestamps", () => {
      const validator = new DateValidator();

      const timestamp = Date.now();
      const result = validator.validate(timestamp);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(new Date(timestamp));
    });

    test("should reject non-date values", () => {
      const validator = new DateValidator();

      const testCases = [true, {}, [], null, undefined];

      testCases.forEach((value) => {
        const result = validator.validate(value);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].message).toContain("Expected Date");
      });
    });

    test("should reject invalid date strings", () => {
      const validator = new DateValidator();

      const invalidDates = [
        "invalid-date",
        "2023-13-01",
        "2023-02-30",
        "not a date",
      ];

      invalidDates.forEach((dateStr) => {
        const result = validator.validate(dateStr);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain("Invalid date");
      });
    });
  });

  describe("Min/Max date validation", () => {
    test("should validate minimum date", () => {
      const minDate = new Date("2023-01-01");
      const validator = new DateValidator().min(minDate);

      expect(validator.validate(new Date("2023-01-01")).isValid).toBe(true);
      expect(validator.validate(new Date("2023-06-15")).isValid).toBe(true);

      const beforeMinResult = validator.validate(new Date("2022-12-31"));
      expect(beforeMinResult.isValid).toBe(false);
      expect(beforeMinResult.errors[0].message).toContain("must be after");
    });

    test("should validate maximum date", () => {
      const maxDate = new Date("2023-12-31");
      const validator = new DateValidator().max(maxDate);

      expect(validator.validate(new Date("2023-06-15")).isValid).toBe(true);
      expect(validator.validate(new Date("2023-12-31")).isValid).toBe(true);

      const afterMaxResult = validator.validate(new Date("2024-01-01"));
      expect(afterMaxResult.isValid).toBe(false);
      expect(afterMaxResult.errors[0].message).toContain("must be before");
    });

    test("should validate date range", () => {
      const minDate = new Date("2023-01-01");
      const maxDate = new Date("2023-12-31");
      const validator = new DateValidator().range(minDate, maxDate);

      expect(validator.validate(new Date("2023-06-15")).isValid).toBe(true);
      expect(validator.validate(new Date("2023-01-01")).isValid).toBe(true);
      expect(validator.validate(new Date("2023-12-31")).isValid).toBe(true);

      expect(validator.validate(new Date("2022-12-31")).isValid).toBe(false);
      expect(validator.validate(new Date("2024-01-01")).isValid).toBe(false);
    });
  });

  describe("Past/Future validation", () => {
    test("should validate past dates", () => {
      const validator = new DateValidator().past();

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      expect(validator.validate(pastDate).isValid).toBe(true);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      expect(validator.validate(futureDate).isValid).toBe(false);
    });

    test("should validate future dates", () => {
      const validator = new DateValidator().future();

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      expect(validator.validate(futureDate).isValid).toBe(true);

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday
      expect(validator.validate(pastDate).isValid).toBe(false);
    });
  });

  describe("Format validation", () => {
    test("should validate ISO format strings", () => {
      const validator = new DateValidator().iso();

      const validIsoStrings = [
        "2023-12-25T10:30:00.000Z",
        "2023-01-01T00:00:00Z",
        "2023-06-15T14:30:45.123Z",
      ];

      validIsoStrings.forEach((isoString) => {
        expect(validator.validate(isoString).isValid).toBe(true);
      });

      const invalidIsoStrings = [
        "2023-12-25",
        "2023/12/25",
        "25-12-2023T10:30:00Z",
      ];

      invalidIsoStrings.forEach((invalidString) => {
        const result = validator.validate(invalidString);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].message).toContain("ISO format");
      });
    });

    test("should validate timestamp format", () => {
      const validator = new DateValidator().timestamp();

      const validTimestamp = Date.now();
      expect(validator.validate(validTimestamp).isValid).toBe(true);
      expect(validator.validate("1640995200000").isValid).toBe(true);

      const invalidTimestamp = "not-a-timestamp";
      const result = validator.validate(invalidTimestamp);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain("valid timestamp");
    });
  });

  describe("Complex validation chains", () => {
    test("should handle multiple constraints", () => {
      const startDate = new Date("2023-01-01");
      const endDate = new Date("2023-12-31");
      const validator = new DateValidator().range(startDate, endDate).iso();

      expect(validator.validate("2023-06-15T12:00:00.000Z").isValid).toBe(true);
      expect(validator.validate("2022-06-15T12:00:00.000Z").isValid).toBe(
        false
      ); // before range
      expect(validator.validate("2024-06-15T12:00:00.000Z").isValid).toBe(
        false
      ); // after range
      expect(validator.validate("2023-06-15").isValid).toBe(false); // invalid ISO format
    });

    test("should validate event scheduling constraints", () => {
      const eventValidator = new DateValidator()
        .future()
        .min(new Date(Date.now() + 24 * 60 * 60 * 1000)); // At least 24 hours from now

      const validEventDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      expect(eventValidator.validate(validEventDate).isValid).toBe(true);

      const tooSoonDate = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
      expect(eventValidator.validate(tooSoonDate).isValid).toBe(false);
    });
  });

  describe("Optional validation", () => {
    test("should allow undefined for optional validators", () => {
      const validator = new DateValidator().past().optional();

      expect(validator.validate(undefined).isValid).toBe(true);
      expect(validator.validate(null).isValid).toBe(true);

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(validator.validate(pastDate).isValid).toBe(true);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(validator.validate(futureDate).isValid).toBe(false);
    });
  });

  describe("Custom error messages", () => {
    test("should use custom error messages", () => {
      const validator = new DateValidator()
        .past()
        .withMessage("Date must be in the past");

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = validator.validate(futureDate);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toBe("Date must be in the past");
    });
  });

  describe("Schema integration", () => {
    test("should work with Schema.date()", () => {
      const validator = Schema.date().past();

      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      expect(validator.validate(pastDate).isValid).toBe(true);

      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      expect(validator.validate(futureDate).isValid).toBe(false);
    });
  });

  describe("Real-world scenarios", () => {
    test("should validate birth date", () => {
      const birthDateValidator = new DateValidator()
        .past()
        .max(new Date(Date.now() - 13 * 365 * 24 * 60 * 60 * 1000)); // At least 13 years ago

      const validBirthDate = new Date("1990-05-15");
      expect(birthDateValidator.validate(validBirthDate).isValid).toBe(true);

      const tooRecentDate = new Date(
        Date.now() - 5 * 365 * 24 * 60 * 60 * 1000
      ); // 5 years ago
      expect(birthDateValidator.validate(tooRecentDate).isValid).toBe(false);
    });

    test("should validate appointment scheduling", () => {
      const appointmentValidator = new DateValidator()
        .future()
        .min(new Date(Date.now() + 60 * 60 * 1000)) // At least 1 hour from now
        .max(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)); // Max 90 days from now

      const validAppointment = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 1 week from now
      expect(appointmentValidator.validate(validAppointment).isValid).toBe(
        true
      );

      const tooSoon = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      expect(appointmentValidator.validate(tooSoon).isValid).toBe(false);

      const tooFar = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000); // 120 days from now
      expect(appointmentValidator.validate(tooFar).isValid).toBe(false);
    });
  });

  describe("Edge cases", () => {
    test("should handle leap year dates", () => {
      const validator = new DateValidator();

      const leapYearDate = new Date("2024-02-29"); // 2024 is a leap year
      expect(validator.validate(leapYearDate).isValid).toBe(true);

      // This should be invalid in non-leap years, but Date constructor handles it
      const nonLeapYearAttempt = new Date("2023-02-29");
      // JavaScript Date automatically adjusts to March 1st, so it's still valid
      expect(validator.validate(nonLeapYearAttempt).isValid).toBe(true);
    });

    test("should handle timezone differences", () => {
      const validator = new DateValidator();

      const utcDate = new Date("2023-12-25T00:00:00.000Z");
      const localDate = new Date("2023-12-25T00:00:00");

      expect(validator.validate(utcDate).isValid).toBe(true);
      expect(validator.validate(localDate).isValid).toBe(true);
    });

    test("should handle extreme dates", () => {
      const validator = new DateValidator();

      const minDate = new Date(-8640000000000000); // Minimum valid date
      const maxDate = new Date(8640000000000000); // Maximum valid date

      expect(validator.validate(minDate).isValid).toBe(true);
      expect(validator.validate(maxDate).isValid).toBe(true);
    });
  });
});
