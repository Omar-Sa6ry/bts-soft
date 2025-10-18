# @bts-soft/validation

A powerful and reusable validation utilities package for NestJS applications.  
This package provides decorators and transformation utilities for validating and sanitizing user input in both GraphQL and REST contexts.  
It also includes built-in SQL injection protection and smart text formatting utilities.

---

## Features

- **Reusable validation decorators** for common fields such as:
    
    - Email
        
    - Password
        
    - Phone number (Egyptian Defualt)
        
    - National ID (Egyptian format)
        
    - Text and capitalized text fields
        
    - Custom-length IDs
        
- **Automatic string transformations**
    
    - Convert text to lowercase or capitalize words
        
- **SQL Injection Protection** via `SQL_INJECTION_REGEX`
    
- **GraphQL + REST Compatibility**
    
    - Easily toggle between GraphQL and REST DTO validation using the `isGraphql` flag
        
- **Consistent validation logic** across all modules in your application
    

---

## Installation

```bash
npm install @bts-soft/validation
```

or

```bash
yarn add @bts-soft/validation
```

---

## Usage

### 1. Import and Use in DTOs

Each decorator can be applied directly to DTO fields.

#### Example: Using in GraphQL DTO

```typescript
import { EmailField, PasswordField, PhoneField } from '@bts-soft/validation';

@InputType()
export class CreateUserInput {
  @EmailField()
  email: string;

  @PasswordField()
  password: string;

  @PhoneField()
  phone: string;
}
```

#### Example: Using in REST DTO

```typescript
import { EmailField, PasswordField, PhoneField } from '@bts-soft/validation';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  @EmailField(false, false) // GraphQL disabled
  email: string;

  @ApiProperty()
  @PasswordField(8, 16, false, false)
  password: string;

  @ApiProperty()
  @PhoneField(false, false)
  phone: string;
}
```

---

## Decorators Overview

### 1. **EmailField**

Validates standard email format, checks for SQL injection, and converts to lowercase.

```typescript
@EmailField(nullable?: boolean, isGraphql?: boolean)
```

---

### 2. **PasswordField**

Enforces a strong password policy:

- Must contain uppercase, lowercase, number, and special character.
    
- Configurable minimum and maximum length.
    

```typescript
@PasswordField(min?: number, max?: number, nullable?: boolean, isGraphql?: boolean)
```

---

### 3. **PhoneField**

Validates Egyptian phone numbers and removes unwanted characters.

```typescript
@PhoneField(nullable?: boolean, isGraphql?: boolean)
```

---

### 4. **NationalIdField**

Validates Egyptian National ID:

- Must be exactly 14 digits.
    
- Must start with 2 or 3.
    

```typescript
@NationalIdField(nullable?: boolean, isGraphql?: boolean)
```

---

### 5. **TextField**

Allows alphanumeric characters and basic punctuation.  
Automatically converts the text to lowercase.

```typescript
@TextField(fieldName: string, min?: number, max?: number, nullable?: boolean, isGraphql?: boolean)
```

---

### 6. **CapitalTextField**

Ensures words are capitalized and contain only letters and spaces.

```typescript
@CapitalTextField(fieldName: string, min?: number, max?: number, nullable?: boolean, isGraphql?: boolean)
```

---

### 7. **IdField**

Validates string IDs of fixed length (default 26).

```typescript
@IdField(fieldName: string, length?: number, nullable?: boolean, isGraphql?: boolean)
```

---

## Utility Functions

### `LowwerWords(value: string): string`

Converts a string to lowercase.

### `CapitalizeWords(value: string): string`

Capitalizes the first letter of each word.

### `SQL_INJECTION_REGEX`

Regular expression used across all decorators to prevent SQL injection attempts.

---

## Example Integration

You can create a reusable base DTO:

```typescript
import { EmailField, PasswordField, PhoneField } from '@bts-soft/validation';

export class BaseUserDto {
  @EmailField()
  email: string;

  @PasswordField()
  password: string;

  @PhoneField()
  phone: string;
}
```

---

## Contact

**Author:** Omar Sabry  

**Email:** [omar.sabry.dev@gmail.com](mailto:omar.sabry.dev@gmail.com)  

**LinkedIn:** [Omar Sabry | LinkedIn](https://www.linkedin.com/in/omarsa6ry/)

Portfolio: [Portfolio](https://omarsabry.netlify.app/)

## Repository


**GitHub:** [GitHub Repo](https://github.com/Omar-Sa6ry/bts-soft/tree/main/packages/validation)

---
## License

This package is licensed under the MIT License.  
Developed and maintained by **BTS Soft**.

