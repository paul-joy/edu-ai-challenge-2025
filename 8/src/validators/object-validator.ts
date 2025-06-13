import { BaseValidator } from "../base-validator";
import {
  ValidationResult,
  ValidatorOptions,
  Validator,
  InferSchemaType,
} from "../types";

/**
 * Options specific to object validation
 */
interface ObjectValidatorOptions extends ValidatorOptions {
  strict?: boolean;
  partial?: boolean;
  allowNull?: boolean;
  optional?: boolean;
  message?: string;
}

/**
 * Validator for object values with comprehensive object validation features
 */
export class ObjectValidator<
  T extends Record<string, any>
> extends BaseValidator<T> {
  private objectOptions: ObjectValidatorOptions;
  private schema: Record<string, Validator<any>>;

  constructor(
    schema: Record<string, Validator<any>>,
    options: ObjectValidatorOptions = {}
  ) {
    super(options);
    this.schema = schema;
    this.objectOptions = options;
  }

  protected validateValue(value: any, path: string): ValidationResult<T> {
    // Handle null values
    if (value === null) {
      if (this.objectOptions.allowNull) {
        return this.createSuccess(null as any);
      } else {
        return this.createFailure([
          this.createError(path, "Object cannot be null", value),
        ]);
      }
    }

    // Check if value is an object
    if (typeof value !== "object" || Array.isArray(value)) {
      return this.createFailure([
        this.createError(
          path,
          `Expected object, received ${
            Array.isArray(value) ? "array" : typeof value
          }`,
          value
        ),
      ]);
    }

    const errors = [];
    const validatedObject: any = {};

    // Validate each property in the schema
    for (const [key, validator] of Object.entries(this.schema)) {
      const fieldPath = path === "root" ? key : `${path}.${key}`;
      const fieldValue = value[key];

      const fieldResult = validator.validate(fieldValue, fieldPath);

      if (!fieldResult.isValid) {
        errors.push(...fieldResult.errors);
      } else if (fieldResult.data !== undefined) {
        validatedObject[key] = fieldResult.data;
      }
    }

    // In strict mode, check for unexpected properties
    if (this.objectOptions.strict) {
      const schemaKeys = new Set(Object.keys(this.schema));
      const valueKeys = Object.keys(value);

      for (const key of valueKeys) {
        if (!schemaKeys.has(key)) {
          const fieldPath = path === "root" ? key : `${path}.${key}`;
          errors.push(
            this.createError(
              fieldPath,
              `Unexpected property "${key}"`,
              value[key]
            )
          );
        }
      }
    } else {
      // In non-strict mode, copy over additional properties
      const schemaKeys = new Set(Object.keys(this.schema));
      const valueKeys = Object.keys(value);

      for (const key of valueKeys) {
        if (!schemaKeys.has(key)) {
          validatedObject[key] = value[key];
        }
      }
    }

    if (errors.length > 0) {
      return this.createFailure(errors);
    }

    return this.createSuccess(validatedObject as T);
  }

  /**
   * Enables strict mode (no additional properties allowed)
   */
  strict(): ObjectValidator<T> {
    return new ObjectValidator(this.schema, {
      ...this.objectOptions,
      strict: true,
    });
  }

  /**
   * Enables partial mode (all properties become optional)
   */
  partial(): ObjectValidator<Partial<T>> {
    const partialSchema: Record<string, Validator<any>> = {};

    for (const [key, validator] of Object.entries(this.schema)) {
      partialSchema[key] = validator.optional();
    }

    return new ObjectValidator(partialSchema, {
      ...this.objectOptions,
      partial: true,
    });
  }

  /**
   * Allows null values (returns ObjectValidator<T> with allowNull option enabled)
   */
  allowNull(): ObjectValidator<T> {
    return new ObjectValidator(this.schema, {
      ...this.objectOptions,
      allowNull: true,
    });
  }

  /**
   * Picks specific keys from the schema
   * @param keys - Array of keys to pick
   */
  pick<K extends keyof T>(keys: K[]): ObjectValidator<Pick<T, K>> {
    const pickedSchema: Record<string, Validator<any>> = {};

    for (const key of keys) {
      if (this.schema[key as string]) {
        pickedSchema[key as string] = this.schema[key as string];
      }
    }

    return new ObjectValidator(pickedSchema, this.objectOptions);
  }

  /**
   * Omits specific keys from the schema
   * @param keys - Array of keys to omit
   */
  omit<K extends keyof T>(keys: K[]): ObjectValidator<Omit<T, K>> {
    const omittedSchema: Record<string, Validator<any>> = {};
    const keysToOmit = new Set(keys as string[]);

    for (const [key, validator] of Object.entries(this.schema)) {
      if (!keysToOmit.has(key)) {
        omittedSchema[key] = validator;
      }
    }

    return new ObjectValidator(omittedSchema, this.objectOptions);
  }

  /**
   * Extends the schema with additional properties
   * @param extension - Additional schema properties
   */
  extend<U extends Record<string, Validator<any>>>(
    extension: U
  ): ObjectValidator<T & InferSchemaType<U>> {
    const extendedSchema = {
      ...this.schema,
      ...extension,
    };

    return new ObjectValidator(extendedSchema, this.objectOptions);
  }

  /**
   * Creates a new validator that accepts undefined values
   */
  optional(): this {
    return new ObjectValidator(this.schema, {
      ...this.objectOptions,
      optional: true,
    }) as this;
  }

  /**
   * Creates a new validator with a custom error message
   * @param message - Custom error message
   */
  withMessage(message: string): this {
    return new ObjectValidator(this.schema, {
      ...this.objectOptions,
      message,
    }) as this;
  }
}
