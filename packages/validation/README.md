# @bts-soft/validation

A robust and highly reusable toolkit of NestJS decorators designed for cross-platform DTO validation, data transformation, and security sanitization. This package provides a unified set of decorators that work seamlessly with both GraphQL and REST protocols, ensuring consistent validation logic across your entire application.

---

## Key Features

- **Security First**: Every text-based decorator includes automatic protection against common SQL Injection patterns. 
- **Data Sanitization**: Automatic transformations like lowercase conversion or word capitalization are built-in.
- **Protocol Agnostic**: Full functionality for both GraphQL Input Types and REST DTOs using a simple toggle.
- **Automatic Dependency Management**: All required libraries like `class-validator`, `class-transformer`, and `libphonenumber-js` are handled automatically.

---

## Installation

To install the package, run the following command in your project directory:

```bash
npm install @bts-soft/validation
```

---

## Detailed Decorators Reference

Each decorator accepts a set of parameters to customize its behavior. Most decorators include `nullable` (for GraphQL schema generation) and `isGraphql` (to toggle between GraphQL and REST modes).

### 1. EmailField
Used to validate a standard email address format.
- **Transformations**: Automatically converts the input string to lowercase.
- **Security**: Includes a check against common SQL injection keywords.
- **Parameters**:
  - `nullable` (boolean): Whether the field can be null in the GraphQL schema.
  - `isGraphql` (boolean): Set to false for REST-only DTOs.

### 2. PasswordField
Enforces a secure password policy requiring at least one uppercase letter, one lowercase letter, one digit, and one special character.
- **Security**: SQL Injection prevention.
- **Parameters**:
  - `min` (number): Minimum length (default is 8).
  - `max` (number): Maximum length (default is 16).
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 3. NameField
Specialized for personal names, student names, or entity titles.
- **Validation**: Restricts input to letters and spaces only.
- **Transformations**: Automatically capitalizes the first letter of every word (e.g., "john doe" becomes "John Doe").
- **Parameters**:
  - `text` (string): The display name of the field for error messages.
  - `min` (number): Minimum length (default 2).
  - `max` (number): Maximum length (default 100).
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 4. DescriptionField
Optimized for long-form text fields such as biographies, descriptions, or comment sections.
- **Validation**: Allows a wide range of characters including letters, numbers, spaces, and punctuation (.,!?-()_). Supports multi-line input (\n, \r).
- **Transformations**: Automatically converts the text to lowercase for consistency.
- **Parameters**:
  - `text` (string): The display name of the field for error messages.
  - `min` (number): Minimum length (default 10).
  - `max` (number): Maximum length (default 2000).
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 5. PhoneField
Validates international phone numbers using the `libphonenumber-js` library.
- **Standard**: Defaults to Egyptian (EG) format but supports any valid ISO country code.
- **Transformations**: Strips all non-digit characters from the input string (while preserving the '+' prefix).
- **Parameters**:
  - `format` (CountryCode): The ISO country code for validation (default 'EG').
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 6. NationalIdField
Specific validation for Egyptian National Identification numbers.
- **Rules**: Must be exactly 14 digits and start with either '2' or '3'.
- **Transformations**: Removes any non-digit characters before validation.
- **Parameters**:
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 7. NumberField
Provides robust validation for numeric inputs, supporting both integers and decimals.
- **Parameters**:
  - `text` (string): Field name for errors.
  - `min` (number): Minimum allowable value.
  - `max` (number): Maximum allowable value.
  - `isInt` (boolean): If true, enforces an integer-only requirement.
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 8. DateField
Validates date inputs and automatically transforms them into JavaScript Date objects using the `Type` decorator from `class-transformer`.
- **Parameters**:
  - `text` (string): Field name for errors.
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 9. BooleanField
A straightforward decorator for validating boolean (true/false) values.
- **Parameters**:
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 10. UsernameField
Validates usernames against a strict alphanumeric policy.
- **Policy**: Must start with a letter and can only contain letters, numbers, and underscores. Length must be between 3 and 30 characters.
- **Security**: SQL Injection prevention.
- **Parameters**:
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 11. EnumField
Ensures that the input value is strictly contained within a provided TypeScript Enum.
- **Parameters**:
  - `enumType` (object): The TypeScript Enum to validate against.
  - `name` (string): The name of the enum for documentation and errors.
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 12. TextField
A general-purpose text decorator allowing letters, numbers, spaces, and basic symbols (.,-).
- **Transformations**: Automatically converts the input to lowercase.
- **Parameters**:
  - `text` (string): Field name for errors.
  - `min` (number): Minimum length (default 1).
  - `max` (number): Maximum length (default 255).
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 13. CapitalTextField
Similar to TextField but restricted to letters and spaces, intended for titles or labels.
- **Transformations**: Automatically capitalizes the first letter of every word.
- **Parameters**:
  - `text` (string): Field name for errors.
  - `min` (number): Minimum length.
  - `max` (number): Maximum length.

### 14. IdField
Validates unique identifier strings (e.g., CUID, NanoID) with a configurable fixed length.
- **Parameters**:
  - `id` (string): Field name for errors.
  - `length` (number): The required exact length (default 26).
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

### 15. UrlField
Validates that the input is a correctly formatted URL.
- **Transformations**: Automatically converts the URL string to lowercase.
- **Parameters**:
  - `text` (string): Field name for errors (default 'url').
  - `nullable` (boolean): GraphQL nullability.
  - `isGraphql` (boolean): Protocol toggle.

---

## Utility Utilities

For advanced use cases, we export several internal transformation functions:

- **LowerWords**: Converts strings to lowercase.
- **CapitalizeWords**: Capitalizes every word in a sentence.
- **ValidatePhoneNumber**: Strips formatting from phone strings.
- **ValidateNationalId**: Strips non-digit characters from National ID strings.
- **SQL_INJECTION_REGEX**: The regular expression used globally to prevent injection attacks.

---

## Practical Examples

### Using in GraphQL
```typescript
import { NameField, EmailField } from '@bts-soft/validation';
import { InputType } from '@nestjs/graphql';

@InputType()
export class CreateProfileInput {
  @NameField('User Name')
  fullName: string;

  @EmailField()
  email: string;
}
```

### Using in REST DTOs
```typescript
import { TextField, NumberField } from '@bts-soft/validation';

export class UpdateProductDto {
  @TextField('Product Label', 5, 50, false, false)
  label: string;

  @NumberField('Price', 0, 1000, false, false, false)
  price: number;
}
```

---

## About the Author

**Developer**: [Omar Sabry](https://www.linkedin.com/in/omarsa6ry/)  
**Company**: **BTS Soft**  
**Portfolio**: [omarsabry.netlify.app](https://omarsabry.netlify.app/)  
**Email**: omar.sabry.dev@gmail.com

---

## License

This project is licensed under the MIT License. Developed and maintained by **BTS Soft**.
