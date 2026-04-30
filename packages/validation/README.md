# @bts-soft/validation

An enterprise-grade validation toolkit for NestJS, providing a robust set of decorators for DTO validation, data transformation, and security auditing. It is designed to work seamlessly with both REST (Express) and GraphQL (Apollo/Mercurius) APIs.

---

## Features

- **Protocol Agnostic**: Full support for both REST DTOs and GraphQL InputTypes.
- **Auto-Transformation**: Integrated with `class-transformer` for automatic data sanitization (e.g., capitalization, lowercase normalization).
- **Security First**: Built-in protection against common SQL injection patterns in text fields.
- **Internationalization Ready**: Customizable error messages for all decorators.
- **Comprehensive Testing**: 100% coverage with both Unit and E2E test suites.

---

## Installation

```bash
npm install @bts-soft/validation
```

Required peer dependencies: `@nestjs/common`, `@nestjs/graphql`, `class-validator`, `class-transformer`, `reflect-metadata`.

---

## Decorators Reference

### Identity & Security
- `IdField(label, length)`: Validates unique identifiers (e.g., ULID, UUID).
- `NationalIdField()`: Validates Egyptian National IDs (14 digits) with auto-sanitization.
- `PasswordField(min, max, complexity)`: Enforces password policies with 3 complexity scenarios:
    - `ALPHANUMERIC` (Default)
    - `SYMBOLIC`
    - `COMPREHENSIVE`

### String & Text
- `TextField(label, min, max)`: Standard text validation with SQL injection protection.
- `CapitalTextField(label, min, max)`: Auto-capitalizes words (e.g., for Cities or Proper Names).
- `NameField(label, min, max)`: Optimized for Person Names with auto-capitalization.
- `UsernameField()`: Enforces strict alphanumeric/underscore rules for handles.
- `DescriptionField(label, min, max)`: For long-form text with multi-line support.

### Contact & Web
- `EmailField()`: Standard email validation with lowercase transformation.
- `PhoneField(region)`: International phone validation using `libphonenumber-js`.
- `UrlField(label)`: Validates web addresses with lowercase transformation.

### Primitive & Logical
- `NumberField(label, min, max, isInt)`: Numeric validation for both integers and floats.
- `BooleanField()`: Strict boolean validation.
- `DateField(label)`: Handles date strings and Date objects with auto-type conversion.
- `EnumField(enum, label)`: Validates values against a specific TypeScript enum.

---

## Usage Example

### REST DTO

```typescript
import { NameField, EmailField, PasswordField } from '@bts-soft/validation';

export class CreateUserDto {
  @NameField('Full Name')
  name: string;

  @EmailField()
  email: string;

  @PasswordField()
  password: string;
}
```

### GraphQL Input

```typescript
import { InputType } from '@nestjs/graphql';
import { TextField, NumberField } from '@bts-soft/validation';

@InputType()
export class UpdateProfileInput {
  @TextField('Bio', 10, 500)
  bio: string;

  @NumberField('Age', 18, 99)
  age: number;
}
```

---

## Testing

The package includes a comprehensive test suite to ensure reliability:

```bash
npm run test      # Run unit tests for every decorator
npm run test:e2e  # Run end-to-end integration tests with NestJS
npm run test:cov  # Generate coverage report
```

---

## License

MIT © 2025 BTS Soft - Developed by Omar Sabry.
