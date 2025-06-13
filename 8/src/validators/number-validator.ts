import { BaseValidator } from "../base-validator";
import { ValidationResult, ValidatorOptions } from "../types";

/**
 * Options specific to number validation
 */
interface NumberValidatorOptions extends ValidatorOptions {
  min?: number;
  max?: number;
  integer?: boolean;
  positive?: boolean;
  negative?: boolean;
  finite?: boolean;
  multipleOf?: number;
}

/**
 * Validator for number values with comprehensive numeric validation features
 */
export class NumberValidator extends BaseValidator<number> {
  private numberOptions: NumberValidatorOptions;

  constructor(options: NumberValidatorOptions = {}) {
    super(options);
    this.numberOptions = options;
  }

  protected validateValue(value: any, path: string): ValidationResult<number> {
    // Check if value is a number
    if (typeof value !== "number") {
      return this.createFailure([
        this.createError(
          path,
          `Expected number, received ${typeof value}`,
          value
        ),
      ]);
    }

    const errors = [];

    // Check for NaN
    if (isNaN(value)) {
      errors.push(
        this.createError(path, "Value must be a valid number (not NaN)", value)
      );
      return this.createFailure(errors);
    }

    // Validate finite constraint
    if (this.numberOptions.finite && !isFinite(value)) {
      errors.push(this.createError(path, "Number must be finite", value));
    }

    // Validate minimum value
    if (
      this.numberOptions.min !== undefined &&
      value < this.numberOptions.min
    ) {
      errors.push(
        this.createError(
          path,
          `Number must be at least ${this.numberOptions.min}`,
          value
        )
      );
    }

    // Validate maximum value
    if (
      this.numberOptions.max !== undefined &&
      value > this.numberOptions.max
    ) {
      errors.push(
        this.createError(
          path,
          `Number must be at most ${this.numberOptions.max}`,
          value
        )
      );
    }

    // Validate integer constraint
    if (this.numberOptions.integer && !Number.isInteger(value)) {
      errors.push(this.createError(path, "Number must be an integer", value));
    }

    // Validate positive constraint
    if (this.numberOptions.positive && value <= 0) {
      errors.push(this.createError(path, "Number must be positive", value));
    }

    // Validate negative constraint
    if (this.numberOptions.negative && value >= 0) {
      errors.push(this.createError(path, "Number must be negative", value));
    }

    // Validate multiple of constraint
    if (
      this.numberOptions.multipleOf !== undefined &&
      value % this.numberOptions.multipleOf !== 0
    ) {
      errors.push(
        this.createError(
          path,
          `Number must be a multiple of ${this.numberOptions.multipleOf}`,
          value
        )
      );
    }

    if (errors.length > 0) {
      return this.createFailure(errors);
    }

    return this.createSuccess(value);
  }

  /**
   * Sets minimum value constraint
   * @param min - Minimum value (inclusive)
   */
  min(min: number): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      min,
    });
  }

  /**
   * Sets maximum value constraint
   * @param max - Maximum value (inclusive)
   */
  max(max: number): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      max,
    });
  }

  /**
   * Sets range constraints
   * @param min - Minimum value (inclusive)
   * @param max - Maximum value (inclusive)
   */
  range(min: number, max: number): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      min,
      max,
    });
  }

  /**
   * Constrains to integer values only
   */
  integer(): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      integer: true,
    });
  }

  /**
   * Constrains to positive values only (> 0)
   */
  positive(): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      positive: true,
    });
  }

  /**
   * Constrains to negative values only (< 0)
   */
  negative(): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      negative: true,
    });
  }

  /**
   * Constrains to finite values only (excludes Infinity and -Infinity)
   */
  finite(): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      finite: true,
    });
  }

  /**
   * Constrains to multiples of the specified number
   * @param divisor - The number that the value must be a multiple of
   */
  multipleOf(divisor: number): NumberValidator {
    return new NumberValidator({
      ...this.numberOptions,
      multipleOf: divisor,
    });
  }
}
