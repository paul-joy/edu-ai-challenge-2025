/**
 * Core types and interfaces for the validation library
 */

/**
 * Represents the result of a validation operation
 */
export interface ValidationResult<T = any> {
  /** Whether the validation was successful */
  isValid: boolean;
  /** The validated data (only present if validation succeeds) */
  data?: T;
  /** Array of validation errors */
  errors: ValidationError[];
}

/**
 * Represents a validation error
 */
export interface ValidationError {
  /** Path to the field that failed validation */
  path: string;
  /** Error message describing the failure */
  message: string;
  /** The actual value that failed validation */
  value: any;
}

/**
 * Base interface for all validators
 */
export interface Validator<T = any> {
  /**
   * Validates the given value
   * @param value - The value to validate
   * @param path - The path to the current field (for nested validation)
   * @returns ValidationResult indicating success or failure
   */
  validate(value: any, path?: string): ValidationResult<T>;

  /**
   * Makes this validator optional (allows undefined values)
   * @returns A new validator that accepts undefined
   */
  optional(): Validator<T | undefined>;

  /**
   * Sets a custom error message for this validator
   * @param message - Custom error message
   * @returns A new validator with the custom message
   */
  withMessage(message: string): Validator<T>;
}

/**
 * Type utility to extract the TypeScript type from a validator
 */
export type InferType<T> = T extends Validator<infer U> ? U : never;

/**
 * Type utility to convert a schema object to its corresponding TypeScript type
 */
export type InferSchemaType<T> = {
  [K in keyof T]: InferType<T[K]>;
};

/**
 * Configuration options for validators
 */
export interface ValidatorOptions {
  /** Custom error message */
  message?: string;
  /** Whether the field is optional */
  optional?: boolean;
}
