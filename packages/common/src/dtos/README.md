
# PaginationInfo and CurrentUserDto

This module provides two reusable Data Transfer Objects (DTOs) designed to work seamlessly with both **GraphQL** and **REST APIs** in a NestJS application.

---

## 1. PaginationInfo

### Purpose

`PaginationInfo` represents metadata about paginated results, including the total number of items, the total number of pages, and the current page.  
It ensures consistent pagination response formatting across both REST and GraphQL endpoints.

### Features

- Works for both GraphQL and REST APIs.
    
- Automatically serializes data when returned from a REST controller using `class-transformer`.
    
- Provides clear GraphQL schema definitions using `@ObjectType` and `@Field` decorators.
    

### Code Example

```ts
import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType({ description: 'Metadata describing pagination details' })
export class PaginationInfo {
  @Field(() => Int, { description: 'Total number of pages' })
  @Expose()
  totalPages: number;

  @Field(() => Int, { description: 'Current page number' })
  @Expose()
  currentPage: number;

  @Field(() => Int, { description: 'Total number of records/items' })
  @Expose()
  totalItems: number;
}
```

### Example Usage

#### In a GraphQL Resolver

```ts
@Query(() => PaginationInfo)
getPaginationExample(): PaginationInfo {
  return {
    totalPages: 10,
    currentPage: 2,
    totalItems: 200,
  };
}
```

#### In a REST Controller

```ts
@Get('pagination')
getPaginationExample(): PaginationInfo {
  return {
    totalPages: 5,
    currentPage: 1,
    totalItems: 45,
  };
}
```

---

## 2. CurrentUserDto

### Purpose

`CurrentUserDto` represents the minimal data structure for an authenticated user, containing only essential information such as the user ID and email.  
It is commonly used to expose user information in both REST and GraphQL contexts.

### Features

- Consistent representation of authenticated user data across APIs.
    
- Compatible with GraphQL via decorators.
    
- Automatically serialized in REST responses using `class-transformer`.
    

### Code Example

```ts
import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';

@ObjectType({ description: 'Minimal representation of the authenticated user' })
export class CurrentUserDto {
  @Field(() => String, { description: 'Unique user ID' })
  @Expose()
  id: string;

  @Field(() => String, { description: 'Email address of the user' })
  @Expose()
  email: string;
}
```

### Example Usage

#### In a GraphQL Resolver

```ts
@Query(() => CurrentUserDto)
getProfile(@CurrentUser() user: CurrentUserDto): CurrentUserDto {
  return user;
}
```

#### In a REST Controller

```ts
@Get('profile')
getProfile(@CurrentUser() user: CurrentUserDto): CurrentUserDto {
  return user;
}
```

---

## Summary

|DTO|Purpose|Works In|Key Fields|
|---|---|---|---|
|**PaginationInfo**|Provides pagination metadata for responses|REST & GraphQL|totalPages, currentPage, totalItems|
|**CurrentUserDto**|Represents authenticated user data (minimal info)|REST & GraphQL|id, email|

Both DTOs help maintain a consistent, well-structured API response format and can be extended easily to fit additional use cases.