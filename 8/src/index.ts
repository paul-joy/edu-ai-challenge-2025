/**
 * TypeScript Validation Library
 *
 * A robust, type-safe validation library for TypeScript applications.
 * Supports primitive types, complex objects, arrays, and custom validation rules.
 *
 * @example
 * ```typescript
 * import { Schema } from 'ts-validator';
 *
 * const userSchema = Schema.object({
 *   name: Schema.string().minLength(2).maxLength(50),
 *   email: Schema.string().email(),
 *   age: Schema.number().min(0).max(120).optional(),
 *   isActive: Schema.boolean(),
 *   tags: Schema.array(Schema.string()).minLength(1)
 * });
 *
 * const result = userSchema.validate(userData);
 * if (result.isValid) {
 *   // TypeScript knows the exact type of result.data
 *   console.log('Valid user:', result.data);
 * } else {
 *   console.log('Validation errors:', result.errors);
 * }
 * ```
 */

// Export main Schema class
export { Schema } from "./schema";

// Export types for advanced usage
export type {
  Validator,
  ValidationResult,
  ValidationError,
  ValidatorOptions,
  InferType,
  InferSchemaType,
} from "./types";

// Export individual validator classes for advanced usage
export { StringValidator } from "./validators/string-validator";
export { NumberValidator } from "./validators/number-validator";
export { BooleanValidator } from "./validators/boolean-validator";
export { DateValidator } from "./validators/date-validator";
export { ArrayValidator } from "./validators/array-validator";
export { ObjectValidator } from "./validators/object-validator";
export { BaseValidator } from "./base-validator";

// Export default as Schema for convenience
import { Schema } from "./schema";
export default Schema;
