import { Schema } from "../src";

// Example 1: Basic validators
console.log("=== Basic Validators ===");

const nameValidator = Schema.string().minLength(2).maxLength(50);
const ageValidator = Schema.number().min(0).max(120).integer();
const emailValidator = Schema.string().email();

console.log("Valid name:", nameValidator.validate("John Doe"));
console.log("Invalid name:", nameValidator.validate("J"));
console.log("Valid age:", ageValidator.validate(25));
console.log("Invalid age:", ageValidator.validate(-5));
console.log("Valid email:", emailValidator.validate("john@example.com"));
console.log("Invalid email:", emailValidator.validate("invalid-email"));

// Example 2: Complex object validation
console.log("\n=== Object Validation ===");

const addressSchema = Schema.object({
  street: Schema.string().minLength(1),
  city: Schema.string().minLength(1),
  postalCode: Schema.string().pattern(/^\d{5}(-\d{4})?$/),
  country: Schema.string().minLength(2),
});

const userSchema = Schema.object({
  id: Schema.string().uuid(),
  name: Schema.string().minLength(2).maxLength(50),
  email: Schema.string().email(),
  age: Schema.number().min(13).max(120).optional(),
  isActive: Schema.boolean(),
  tags: Schema.array(Schema.string()).minLength(1).unique(),
  address: addressSchema.optional(),
  metadata: Schema.object({
    createdAt: Schema.date(),
    updatedAt: Schema.date().optional(),
  }).optional(),
});

const validUser = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "John Doe",
  email: "john@example.com",
  age: 30,
  isActive: true,
  tags: ["developer", "typescript"],
  address: {
    street: "123 Main St",
    city: "Anytown",
    postalCode: "12345",
    country: "USA",
  },
  metadata: {
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2023-12-01"),
  },
};

const invalidUser = {
  id: "invalid-uuid",
  name: "J",
  email: "invalid-email",
  age: -5,
  isActive: "true",
  tags: ["developer", "developer"], // duplicate
  address: {
    street: "",
    city: "Anytown",
    postalCode: "invalid",
    country: "US",
  },
};

console.log("Valid user result:", userSchema.validate(validUser));
console.log("Invalid user result:", userSchema.validate(invalidUser));

// Example 3: Array validation
console.log("\n=== Array Validation ===");

const numbersValidator = Schema.array(Schema.number().positive())
  .minLength(1)
  .maxLength(10);
const uniqueStringsValidator = Schema.array(Schema.string()).unique();

console.log("Valid numbers:", numbersValidator.validate([1, 2, 3, 4, 5]));
console.log("Invalid numbers:", numbersValidator.validate([-1, 0, 1]));
console.log(
  "Valid unique strings:",
  uniqueStringsValidator.validate(["a", "b", "c"])
);
console.log(
  "Invalid unique strings:",
  uniqueStringsValidator.validate(["a", "b", "a"])
);

// Example 4: Union types
console.log("\n=== Union Types ===");

const stringOrNumberValidator = Schema.union([
  Schema.string(),
  Schema.number(),
]);

console.log("Valid string:", stringOrNumberValidator.validate("hello"));
console.log("Valid number:", stringOrNumberValidator.validate(42));
console.log("Invalid boolean:", stringOrNumberValidator.validate(true));

// Example 5: Custom error messages
console.log("\n=== Custom Error Messages ===");

const passwordValidator = Schema.string()
  .minLength(8)
  .withMessage("Password must be at least 8 characters long")
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage(
    "Password must contain at least one lowercase letter, one uppercase letter, and one digit"
  );

console.log("Invalid password:", passwordValidator.validate("weak"));

// Example 6: Optional and nullable fields
console.log("\n=== Optional and Nullable Fields ===");

const profileSchema = Schema.object({
  username: Schema.string().minLength(3),
  bio: Schema.string().optional(),
  avatar: Schema.nullable(Schema.string().url()),
});

console.log(
  "Valid profile with optional fields:",
  profileSchema.validate({
    username: "johndoe",
    bio: "Software developer",
    avatar: "https://example.com/avatar.jpg",
  })
);

console.log(
  "Valid profile without optional fields:",
  profileSchema.validate({
    username: "johndoe",
    avatar: null,
  })
);

// Example 7: Schema composition and extension
console.log("\n=== Schema Composition ===");

const baseUserSchema = Schema.object({
  id: Schema.string(),
  name: Schema.string(),
  email: Schema.string().email(),
});

const adminUserSchema = baseUserSchema.extend({
  role: Schema.string(),
  permissions: Schema.array(Schema.string()),
});

console.log(
  "Valid admin user:",
  adminUserSchema.validate({
    id: "1",
    name: "Admin User",
    email: "admin@example.com",
    role: "administrator",
    permissions: ["read", "write", "delete"],
  })
);

// Example 8: Partial validation
console.log("\n=== Partial Validation ===");

const updateUserSchema = userSchema.partial();

console.log(
  "Valid partial update:",
  updateUserSchema.validate({
    name: "Updated Name",
    email: "updated@example.com",
  })
);

// Example 9: Date validation
console.log("\n=== Date Validation ===");

const eventSchema = Schema.object({
  title: Schema.string(),
  startDate: Schema.date().future(),
  endDate: Schema.date().min(new Date()),
  createdAt: Schema.date().past(),
});

const futureDate = new Date();
futureDate.setDate(futureDate.getDate() + 7);

const pastDate = new Date();
pastDate.setDate(pastDate.getDate() - 1);

console.log(
  "Valid event:",
  eventSchema.validate({
    title: "Future Event",
    startDate: futureDate,
    endDate: futureDate,
    createdAt: pastDate,
  })
);

// Example 10: Boolean validation modes
console.log("\n=== Boolean Validation ===");

const strictBooleanValidator = Schema.boolean().strict();
const truthyBooleanValidator = Schema.boolean().truthy();

console.log("Strict boolean - valid:", strictBooleanValidator.validate(true));
console.log(
  "Strict boolean - invalid:",
  strictBooleanValidator.validate("true")
);
console.log(
  "Truthy boolean - valid string:",
  truthyBooleanValidator.validate("true")
);
console.log(
  "Truthy boolean - valid number:",
  truthyBooleanValidator.validate(1)
);
