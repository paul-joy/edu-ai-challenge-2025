import { StringValidator } from "./validators/string-validator";
import { NumberValidator } from "./validators/number-validator";
import { BooleanValidator } from "./validators/boolean-validator";
import { DateValidator } from "./validators/date-validator";
import { ArrayValidator } from "./validators/array-validator";
import { ObjectValidator } from "./validators/object-validator";
import { Validator, InferSchemaType } from "./types";

/**
 * Main Schema class providing a fluent API for creating validators
 *
 * @example
 * ```typescript
 * const userSchema = Schema.object({
 *   name: Schema.string().minLength(2),
 *   email: Schema.string().email(),
 *   age: Schema.number().min(0).optional()
 * });
 *
 * const result = userSchema.validate(userData);
 * if (result.isValid) {
 *   console.log('Valid user:', result.data);
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */
export class Schema {
  /**
   * Creates a string validator
   *
   * @example
   * ```typescript
   * const nameValidator = Schema.string()
   *   .minLength(2)
   *   .maxLength(50)
   *   .trim();
   * ```
   */
  static string(): StringValidator {
    return new StringValidator();
  }

  /**
   * Creates a number validator
   *
   * @example
   * ```typescript
   * const ageValidator = Schema.number()
   *   .min(0)
   *   .max(120)
   *   .integer();
   * ```
   */
  static number(): NumberValidator {
    return new NumberValidator();
  }

  /**
   * Creates a boolean validator
   *
   * @example
   * ```typescript
   * const isActiveValidator = Schema.boolean().strict();
   * ```
   */
  static boolean(): BooleanValidator {
    return new BooleanValidator();
  }

  /**
   * Creates a date validator
   *
   * @example
   * ```typescript
   * const birthdateValidator = Schema.date()
   *   .past()
   *   .min(new Date('1900-01-01'));
   * ```
   */
  static date(): DateValidator {
    return new DateValidator();
  }

  /**
   * Creates an array validator
   *
   * @param itemValidator - Validator for array items
   *
   * @example
   * ```typescript
   * const tagsValidator = Schema.array(Schema.string())
   *   .minLength(1)
   *   .unique();
   * ```
   */
  static array<T>(itemValidator: Validator<T>): ArrayValidator<T> {
    return new ArrayValidator<T>(itemValidator);
  }

  /**
   * Creates an object validator
   *
   * @param schema - Schema definition for object properties
   *
   * @example
   * ```typescript
   * const addressSchema = Schema.object({
   *   street: Schema.string(),
   *   city: Schema.string(),
   *   zipCode: Schema.string().pattern(/^\d{5}$/)
   * });
   * ```
   */
  static object<T extends Record<string, Validator<any>>>(
    schema: T
  ): ObjectValidator<InferSchemaType<T>> {
    return new ObjectValidator<InferSchemaType<T>>(schema);
  }

  /**
   * Creates a validator that accepts any value
   *
   * @example
   * ```typescript
   * const metadataValidator = Schema.any();
   * ```
   */
  static any(): Validator<any> {
    return {
      validate: (value: any) => ({
        isValid: true,
        data: value,
        errors: [],
      }),
      optional: () => Schema.any(),
      withMessage: () => Schema.any(),
    };
  }

  /**
   * Creates a validator that accepts null or undefined values
   *
   * @example
   * ```typescript
   * const optionalField = Schema.nullable(Schema.string());
   * ```
   */
  static nullable<T>(validator: Validator<T>): Validator<T | null> {
    return {
      validate: (value: any, path: string = "root") => {
        if (value === null || value === undefined) {
          return {
            isValid: true,
            data: null,
            errors: [],
          };
        }
        return validator.validate(value, path);
      },
      optional: () => Schema.nullable(validator),
      withMessage: (message: string) =>
        Schema.nullable(validator.withMessage(message)),
    };
  }

  /**
   * Creates a union validator that accepts values matching any of the provided validators
   *
   * @param validators - Array of validators to try
   *
   * @example
   * ```typescript
   * const stringOrNumber = Schema.union([
   *   Schema.string(),
   *   Schema.number()
   * ]);
   * ```
   */
  static union<T extends readonly Validator<any>[]>(
    validators: T
  ): Validator<T[number] extends Validator<infer U> ? U : never> {
    return {
      validate: (value: any, path: string = "root") => {
        const errors = [];

        for (const validator of validators) {
          const result = validator.validate(value, path);
          if (result.isValid) {
            return result;
          }
          errors.push(...result.errors);
        }

        return {
          isValid: false,
          errors: [
            {
              path,
              message: "Value does not match any of the union types",
              value,
            },
          ],
        };
      },
      optional: () => Schema.union(validators),
      withMessage: (message: string) => ({
        ...Schema.union(validators),
        validate: (value: any, path: string = "root") => {
          const result = Schema.union(validators).validate(value, path);
          if (!result.isValid) {
            result.errors = result.errors.map((error) => ({
              ...error,
              message,
            }));
          }
          return result;
        },
      }),
    };
  }
}
