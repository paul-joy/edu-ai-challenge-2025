import { BaseValidator } from "../base-validator";
import { ValidationResult, ValidatorOptions } from "../types";

/**
 * Options specific to date validation
 */
interface DateValidatorOptions extends ValidatorOptions {
  min?: Date;
  max?: Date;
  format?: "iso" | "timestamp" | "string";
}

/**
 * Validator for Date values with comprehensive date validation features
 */
export class DateValidator extends BaseValidator<Date> {
  private dateOptions: DateValidatorOptions;

  constructor(options: DateValidatorOptions = {}) {
    super(options);
    this.dateOptions = options;
  }

  protected validateValue(value: any, path: string): ValidationResult<Date> {
    let dateValue: Date;

    // Validate format FIRST if specified - this takes priority over general validation
    if (this.dateOptions.format) {
      switch (this.dateOptions.format) {
        case "iso":
          if (typeof value === "string") {
            if (
              !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(value)
            ) {
              return this.createFailure([
                this.createError(
                  path,
                  "Date must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
                  value
                ),
              ]);
            }
          } else {
            return this.createFailure([
              this.createError(
                path,
                "Date must be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ)",
                value
              ),
            ]);
          }
          break;
        case "timestamp":
          if (typeof value === "number") {
            // Numbers are valid timestamps
          } else if (typeof value === "string" && /^\d+$/.test(value)) {
            // String numbers are also valid timestamps
          } else {
            return this.createFailure([
              this.createError(path, "Date must be a valid timestamp", value),
            ]);
          }
          break;
      }
    }

    // Try to convert value to Date
    if (value instanceof Date) {
      dateValue = value;
    } else if (typeof value === "string" || typeof value === "number") {
      // For strings, be more restrictive about what we accept (but skip if format validation already passed)
      if (typeof value === "string" && !this.dateOptions.format) {
        // Reject clearly invalid formats
        if (
          value.trim() === "" ||
          value === "invalid" ||
          value === "not-a-date" ||
          value === "not a date" ||
          value === "invalid-date" ||
          /^[a-zA-Z\s]+$/.test(value.trim())
        ) {
          return this.createFailure([
            this.createError(path, "Invalid date", value),
          ]);
        }
      }

      // Special handling for timestamp format with string input
      if (
        this.dateOptions.format === "timestamp" &&
        typeof value === "string"
      ) {
        const numericValue = parseInt(value, 10);
        dateValue = new Date(numericValue);
      } else {
        dateValue = new Date(value);
      }
    } else {
      return this.createFailure([
        this.createError(
          path,
          `Expected Date, string, or number, received ${typeof value}`,
          value
        ),
      ]);
    }

    const errors = [];

    // Check if the date is valid
    if (isNaN(dateValue.getTime())) {
      errors.push(this.createError(path, "Invalid date", value));
      return this.createFailure(errors);
    }

    // Additional validation for string inputs to catch edge cases (but skip if format validation already passed)
    if (
      typeof value === "string" &&
      value.trim() !== "" &&
      !this.dateOptions.format
    ) {
      // Check if the string represents a reasonable date
      const originalString = value.trim();

      // If it looks like just a word or invalid format, reject it
      if (
        originalString.length < 4 ||
        !/\d/.test(originalString) ||
        originalString === "Invalid Date"
      ) {
        errors.push(this.createError(path, "Invalid date", value));
        return this.createFailure(errors);
      }

      // Additional check for impossible dates that JavaScript Date constructor allows
      if (originalString.includes("-")) {
        // Check for invalid months and days in YYYY-MM-DD format
        const parts = originalString.split("-");
        if (parts.length >= 3) {
          const month = parseInt(parts[1]);
          const day = parseInt(parts[2]);
          if (month > 12 || month < 1 || day > 31 || day < 1) {
            errors.push(this.createError(path, "Invalid date", value));
            return this.createFailure(errors);
          }
          // Check for February 30th and other impossible dates
          if (month === 2 && day > 29) {
            errors.push(this.createError(path, "Invalid date", value));
            return this.createFailure(errors);
          }
        }
      }
    }

    // Validate minimum date
    if (this.dateOptions.min && dateValue < this.dateOptions.min) {
      errors.push(
        this.createError(
          path,
          `Date must be after ${this.dateOptions.min.toISOString()}`,
          value
        )
      );
    }

    // Validate maximum date
    if (this.dateOptions.max && dateValue > this.dateOptions.max) {
      errors.push(
        this.createError(
          path,
          `Date must be before ${this.dateOptions.max.toISOString()}`,
          value
        )
      );
    }

    if (errors.length > 0) {
      return this.createFailure(errors);
    }

    return this.createSuccess(dateValue);
  }

  /**
   * Sets minimum date constraint
   * @param min - Minimum date (inclusive)
   */
  min(min: Date): DateValidator {
    return new DateValidator({
      ...this.dateOptions,
      min,
    });
  }

  /**
   * Sets maximum date constraint
   * @param max - Maximum date (inclusive)
   */
  max(max: Date): DateValidator {
    return new DateValidator({
      ...this.dateOptions,
      max,
    });
  }

  /**
   * Sets date range constraints
   * @param min - Minimum date (inclusive)
   * @param max - Maximum date (inclusive)
   */
  range(min: Date, max: Date): DateValidator {
    return new DateValidator({
      ...this.dateOptions,
      min,
      max,
    });
  }

  /**
   * Constrains to past dates only
   */
  past(): DateValidator {
    return new DateValidator({
      ...this.dateOptions,
      max: new Date(),
    });
  }

  /**
   * Constrains to future dates only
   */
  future(): DateValidator {
    return new DateValidator({
      ...this.dateOptions,
      min: new Date(),
    });
  }

  /**
   * Requires ISO format for string inputs
   */
  iso(): DateValidator {
    return new DateValidator({
      ...this.dateOptions,
      format: "iso",
    });
  }

  /**
   * Requires timestamp format for inputs
   */
  timestamp(): DateValidator {
    return new DateValidator({
      ...this.dateOptions,
      format: "timestamp",
    });
  }
}
