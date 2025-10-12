## @bts-soft/common — BaseEntity & BaseResponse

### Overview

This package provides two abstract base classes — `BaseEntity` and `BaseResponse` — designed to standardize your backend architecture across **REST API** and **GraphQL** in **NestJS**.

They improve consistency, maintainability, and productivity by providing shared behaviors for all entities and API responses.

---

## 1. BaseEntity

### File

`base.entity.ts`

### Purpose

`BaseEntity` extends TypeORM’s `BaseEntity` and provides a standardized structure for all database entities.

It works in both REST and GraphQL contexts, automatically handling:

- Unique ID generation using **ULID**
    
- Creation and update timestamps
    
- Lifecycle logging for insert, update, and delete operations
    

### Features

- **ULID-based ID** for consistent and sortable identifiers
    
- **Automatic timestamps** (`createdAt`, `updatedAt`)
    
- **Lifecycle hooks** to log entity changes
    
- **GraphQL-ready decorators** (`@ObjectType`, `@Field`)
    
- **REST-ready serialization** with `class-transformer`’s `@Expose`
    

### Example

```ts
import { Entity, Column } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseEntity } from '@bts-soft/common';

@Entity()
@ObjectType()
export class User extends BaseEntity {
  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  email: string;
}
```

This will automatically:

- Generate a ULID for each new record
    
- Add `createdAt` and `updatedAt` timestamps
    
- Log insert, update, and delete operations in the console
    

---

## 2. BaseResponse

### File

`base.response.ts`

### Purpose

`BaseResponse` provides a standardized structure for API responses across both **REST** and **GraphQL**.

It defines a consistent set of fields (`message`, `success`, `statusCode`, `timeStamp`) that can be extended by specific response classes.

### Features

- Works for both **GraphQL** and **REST**
    
- Enforces a consistent response shape
    
- Uses decorators from:
    
    - `class-validator` (validation)
        
    - `class-transformer` (serialization)
        
    - `@nestjs/graphql` (GraphQL schema generation)
        

### Example for GraphQL

```ts
import { ObjectType, Field } from '@nestjs/graphql';
import { BaseResponse } from '@bts-soft/common';

@ObjectType()
export class CreateUserResponse extends BaseResponse {
  @Field({ nullable: true })
  userId?: string;
}
```

### Example for REST API

```ts
import { plainToInstance } from 'class-transformer';
import { BaseResponse } from '@bts-soft/common';
import { Post, Body, Controller } from '@nestjs/common';

@Controller('user')
export class UserController {
  @Post('create')
  createUser(@Body() dto: any) {
    return plainToInstance(BaseResponse, {
      message: 'User created successfully',
      success: true,
      statusCode: 201,
      timeStamp: new Date().toISOString(),
    });
  }
}
```

---

## Integration

To use these classes in both REST and GraphQL modules:

1. Import from your shared package (e.g., `@bts-soft/common`)
    
2. Extend `BaseEntity` for all database entities
    
3. Extend `BaseResponse` for all response DTOs
    

---

## Benefits

|Feature|Description|
|---|---|
|**Consistency**|Standardized entity and response structures across the entire app|
|**Compatibility**|Works natively with both REST and GraphQL|
|**Maintainability**|Common logic centralized in a single shared package|
|**Developer Experience**|Less boilerplate and clearer architecture|
