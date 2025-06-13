import { BaseValidator } from "../base-validator";
import { ValidationResult, ValidatorOptions, Validator } from "../types";

/**
 * Options specific to array validation
 */
interface ArrayValidatorOptions extends ValidatorOptions {
  minLength?: number;
  maxLength?: number;
  unique?: boolean;
  noEmpty?: boolean;
  optional?: boolean;
  message?: string;
}

/**
 * Validator for array values with comprehensive array validation features
 */
export class ArrayValidator<T> extends BaseValidator<T[]> {
  private arrayOptions: ArrayValidatorOptions;
  private itemValidator: Validator<T>;

  constructor(
    itemValidator: Validator<T>,
    options: ArrayValidatorOptions = {}
  ) {
    super(options);
    this.itemValidator = itemValidator;
    this.arrayOptions = options;
  }

  protected validateValue(value: any, path: string): ValidationResult<T[]> {
    // Check if value is an array
    if (!Array.isArray(value)) {
      return this.createFailure([
        this.createError(
          path,
          `Expected array, received ${typeof value}`,
          value
        ),
      ]);
    }

    const errors = [];
    const validatedItems: T[] = [];

    // Validate array length constraints
    if (
      this.arrayOptions.minLength !== undefined &&
      value.length < this.arrayOptions.minLength
    ) {
      errors.push(
        this.createError(
          path,
          `Array must have at least ${this.arrayOptions.minLength} items`,
          value
        )
      );
    }

    if (
      this.arrayOptions.maxLength !== undefined &&
      value.length > this.arrayOptions.maxLength
    ) {
      errors.push(
        this.createError(
          path,
          `Array must have at most ${this.arrayOptions.maxLength} items`,
          value
        )
      );
    }

    // Check for empty array if noEmpty is enabled
    if (this.arrayOptions.noEmpty && value.length === 0) {
      errors.push(this.createError(path, "Array cannot be empty", value));
    }

    // Validate each item in the array
    for (let i = 0; i < value.length; i++) {
      const itemPath = `${path}[${i}]`;
      const itemResult = this.itemValidator.validate(value[i], itemPath);

      if (!itemResult.isValid) {
        errors.push(...itemResult.errors);
      } else if (itemResult.data !== undefined) {
        validatedItems.push(itemResult.data);
      }
    }

    // Check for uniqueness if required
    if (this.arrayOptions.unique && validatedItems.length > 0) {
      const seen = new Set();
      const duplicates = new Set();

      for (let i = 0; i < validatedItems.length; i++) {
        const item = validatedItems[i];
        const key =
          typeof item === "object" && item !== null
            ? JSON.stringify(item)
            : item;

        if (seen.has(key)) {
          duplicates.add(i);
        } else {
          seen.add(key);
        }
      }

      if (duplicates.size > 0) {
        for (const index of duplicates) {
          const indexNumber = index as number;
          errors.push(
            this.createError(
              `${path}[${indexNumber}]`,
              "Array items must be unique",
              validatedItems[indexNumber]
            )
          );
        }
      }
    }

    if (errors.length > 0) {
      return this.createFailure(errors);
    }

    return this.createSuccess(validatedItems);
  }

  /**
   * Sets minimum length constraint
   * @param length - Minimum number of items
   */
  minLength(length: number): ArrayValidator<T> {
    return new ArrayValidator(this.itemValidator, {
      ...this.arrayOptions,
      minLength: length,
    });
  }

  /**
   * Sets maximum length constraint
   * @param length - Maximum number of items
   */
  maxLength(length: number): ArrayValidator<T> {
    return new ArrayValidator(this.itemValidator, {
      ...this.arrayOptions,
      maxLength: length,
    });
  }

  /**
   * Sets length constraints
   * @param min - Minimum number of items
   * @param max - Maximum number of items
   */
  length(min: number, max: number): ArrayValidator<T> {
    return new ArrayValidator(this.itemValidator, {
      ...this.arrayOptions,
      minLength: min,
      maxLength: max,
    });
  }

  /**
   * Requires all items to be unique
   */
  unique(): ArrayValidator<T> {
    return new ArrayValidator(this.itemValidator, {
      ...this.arrayOptions,
      unique: true,
    });
  }

  /**
   * Requires array to have at least one item
   */
  noEmpty(): ArrayValidator<T> {
    return new ArrayValidator(this.itemValidator, {
      ...this.arrayOptions,
      noEmpty: true,
    });
  }

  /**
   * Creates a new validator that accepts undefined values
   */
  optional(): this {
    return new ArrayValidator(this.itemValidator, {
      ...this.arrayOptions,
      optional: true,
    }) as this;
  }

  /**
   * Creates a new validator with a custom error message
   * @param message - Custom error message
   */
  withMessage(message: string): this {
    return new ArrayValidator(this.itemValidator, {
      ...this.arrayOptions,
      message,
    }) as this;
  }
}
