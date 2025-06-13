import { BaseValidator } from "../base-validator";
import { ValidationResult, ValidatorOptions } from "../types";

/**
 * Options specific to string validation
 */
interface StringValidatorOptions extends ValidatorOptions {
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  trim?: boolean;
  email?: boolean;
  url?: boolean;
  uuid?: boolean;
}

/**
 * Validator for string values with comprehensive string validation features
 */
export class StringValidator extends BaseValidator<string> {
  private stringOptions: StringValidatorOptions;

  constructor(options: StringValidatorOptions = {}) {
    super(options);
    this.stringOptions = options;
  }

  protected validateValue(value: any, path: string): ValidationResult<string> {
    // Check if value is a string
    if (typeof value !== "string") {
      return this.createFailure([
        this.createError(
          path,
          `Expected string, received ${typeof value}`,
          value
        ),
      ]);
    }

    let stringValue = value;

    // Apply trimming if enabled
    if (this.stringOptions.trim) {
      stringValue = stringValue.trim();
    }

    const errors = [];

    // Validate minimum length
    if (
      this.stringOptions.minLength !== undefined &&
      stringValue.length < this.stringOptions.minLength
    ) {
      errors.push(
        this.createError(
          path,
          `String must be at least ${this.stringOptions.minLength} characters long`,
          value
        )
      );
    }

    // Validate maximum length
    if (
      this.stringOptions.maxLength !== undefined &&
      stringValue.length > this.stringOptions.maxLength
    ) {
      errors.push(
        this.createError(
          path,
          `String must be at most ${this.stringOptions.maxLength} characters long`,
          value
        )
      );
    }

    // Validate pattern
    if (
      this.stringOptions.pattern &&
      !this.stringOptions.pattern.test(stringValue)
    ) {
      errors.push(
        this.createError(path, `String does not match required pattern`, value)
      );
    }

    // Validate email format
    if (this.stringOptions.email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (
        !emailRegex.test(stringValue) ||
        stringValue.includes("..") ||
        stringValue.startsWith(".") ||
        stringValue.endsWith(".") ||
        stringValue.includes(" ")
      ) {
        errors.push(this.createError(path, "Invalid email format", value));
      }
    }

    // Validate URL format
    if (this.stringOptions.url) {
      try {
        const url = new URL(stringValue);
        // Additional validation to reject incomplete URLs
        if (
          !url.hostname ||
          url.hostname === "" ||
          url.protocol === "" ||
          (url.protocol !== "http:" && url.protocol !== "https:") ||
          url.hostname.endsWith(".") ||
          url.hostname.startsWith(".")
        ) {
          throw new Error("Invalid URL");
        }
      } catch {
        errors.push(this.createError(path, "Invalid URL format", value));
      }
    }

    // Validate UUID format
    if (this.stringOptions.uuid) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(stringValue)) {
        errors.push(this.createError(path, "Invalid UUID format", value));
      }
    }

    if (errors.length > 0) {
      return this.createFailure(errors);
    }

    return this.createSuccess(stringValue);
  }

  /**
   * Sets minimum length constraint
   * @param length - Minimum length
   */
  minLength(length: number): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      minLength: length,
    });
  }

  /**
   * Sets maximum length constraint
   * @param length - Maximum length
   */
  maxLength(length: number): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      maxLength: length,
    });
  }

  /**
   * Sets length constraints
   * @param min - Minimum length
   * @param max - Maximum length
   */
  length(min: number, max: number): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      minLength: min,
      maxLength: max,
    });
  }

  /**
   * Sets pattern constraint using regular expression
   * @param pattern - Regular expression pattern
   */
  pattern(pattern: RegExp): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      pattern,
    });
  }

  /**
   * Enables automatic trimming of whitespace
   */
  trim(): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      trim: true,
    });
  }

  /**
   * Validates email format
   */
  email(): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      email: true,
    });
  }

  /**
   * Validates URL format
   */
  url(): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      url: true,
    });
  }

  /**
   * Validates UUID format
   */
  uuid(): StringValidator {
    return new StringValidator({
      ...this.stringOptions,
      uuid: true,
    });
  }
}
