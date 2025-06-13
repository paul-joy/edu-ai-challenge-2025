import {
  Validator,
  ValidationResult,
  ValidationError,
  ValidatorOptions,
} from "./types";

/**
 * Abstract base class for all validators
 * Provides common functionality and enforces the validator interface
 */
export abstract class BaseValidator<T> implements Validator<T> {
  protected options: ValidatorOptions;

  constructor(options: ValidatorOptions = {}) {
    this.options = { ...options };
  }

  /**
   * Abstract method that must be implemented by all concrete validators
   * @param value - The value to validate
   * @param path - The path to the current field
   */
  protected abstract validateValue(
    value: any,
    path: string
  ): ValidationResult<T>;

  /**
   * Main validation method that handles common logic
   * @param value - The value to validate
   * @param path - The path to the current field (defaults to 'root')
   */
  validate(value: any, path: string = "root"): ValidationResult<T> {
    // Handle optional values
    if (this.options.optional && (value === undefined || value === null)) {
      return {
        isValid: true,
        data: undefined as any,
        errors: [],
      };
    }

    // Delegate to concrete implementation
    const result = this.validateValue(value, path);

    // Apply custom error message if provided
    if (!result.isValid && this.options.message) {
      result.errors = result.errors.map((error) => ({
        ...error,
        message: this.options.message!,
      }));
    }

    return result;
  }

  /**
   * Creates a new validator that accepts undefined values
   */
  optional(): this {
    return new (this.constructor as any)({
      ...this.options,
      optional: true,
    });
  }

  /**
   * Creates a new validator with a custom error message
   * @param message - Custom error message
   */
  withMessage(message: string): this {
    return new (this.constructor as any)({
      ...this.options,
      message,
    });
  }

  /**
   * Helper method to create a validation error
   * @param path - Path to the field
   * @param message - Error message
   * @param value - The invalid value
   */
  protected createError(
    path: string,
    message: string,
    value: any
  ): ValidationError {
    return {
      path,
      message,
      value,
    };
  }

  /**
   * Helper method to create a successful validation result
   * @param data - The validated data
   */
  protected createSuccess(data: T): ValidationResult<T> {
    return {
      isValid: true,
      data,
      errors: [],
    };
  }

  /**
   * Helper method to create a failed validation result
   * @param errors - Array of validation errors
   */
  protected createFailure(errors: ValidationError[]): ValidationResult<T> {
    return {
      isValid: false,
      errors,
    };
  }
}
