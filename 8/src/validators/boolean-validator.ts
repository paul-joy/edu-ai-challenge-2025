import { BaseValidator } from "../base-validator";
import { ValidationResult, ValidatorOptions } from "../types";

/**
 * Options specific to boolean validation
 */
interface BooleanValidatorOptions extends ValidatorOptions {
  strict?: boolean;
  truthy?: boolean;
}

/**
 * Validator for boolean values with support for strict and truthy validation
 */
export class BooleanValidator extends BaseValidator<boolean> {
  private booleanOptions: BooleanValidatorOptions;

  constructor(options: BooleanValidatorOptions = {}) {
    super(options);
    this.booleanOptions = options;
  }

  protected validateValue(value: any, path: string): ValidationResult<boolean> {
    const errors = [];

    // Strict mode: only accept actual boolean values
    if (this.booleanOptions.strict === true) {
      if (typeof value !== "boolean") {
        errors.push(
          this.createError(
            path,
            `Expected boolean, received ${typeof value}`,
            value
          )
        );
        return this.createFailure(errors);
      }
      return this.createSuccess(value);
    }

    // Truthy mode: accept any value and convert to boolean
    if (this.booleanOptions.truthy) {
      return this.createSuccess(!!value);
    }

    // Default: accept boolean values and common boolean representations
    if (typeof value === "boolean") {
      return this.createSuccess(value);
    }

    // Accept common string representations
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase().trim();
      if (
        lowerValue === "true" ||
        lowerValue === "1" ||
        lowerValue === "yes" ||
        lowerValue === "on"
      ) {
        return this.createSuccess(true);
      }
      if (
        lowerValue === "false" ||
        lowerValue === "0" ||
        lowerValue === "no" ||
        lowerValue === "off"
      ) {
        return this.createSuccess(false);
      }
    }

    // Accept numeric representations
    if (typeof value === "number") {
      if (value === 1) {
        return this.createSuccess(true);
      }
      if (value === 0) {
        return this.createSuccess(false);
      }
    }

    errors.push(
      this.createError(path, `Cannot convert ${typeof value} to boolean`, value)
    );

    return this.createFailure(errors);
  }

  /**
   * Enables strict boolean validation (only accepts true/false)
   */
  strict(): BooleanValidator {
    return new BooleanValidator({
      ...this.booleanOptions,
      strict: true,
    });
  }

  /**
   * Enables truthy validation (converts any value to boolean using truthiness)
   */
  truthy(): BooleanValidator {
    return new BooleanValidator({
      ...this.booleanOptions,
      truthy: true,
    });
  }
}
