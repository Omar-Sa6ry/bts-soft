// ========== Core & Agnostic Bases ==========
export * from "./core/bases/AgnosticEntity";
export * from "./core/bases/AgnosticResponse";
export * from "./bases/BaseResponse";
export * from "./bases/BaseEntity";

// ========== ORM Specific Bases (Agnostic - Safe to keep Prisma as it has no external imports) ==========
export * from "./orm/prisma/PrismaBase";

// NOTE: TypeORM, Sequelize, and Mongoose bases are excluded from the main entry point
// to prevent mandatory peer dependency requirements. 
// Import them via sub-paths: @bts-soft/common/typeorm, @bts-soft/common/sequelize, etc.

// ========== API Specific (GraphQL) ==========
export * from "./graphql/bases/GraphqlBaseEntity";
export * from "./graphql/bases/GraphqlBaseResponse";
export * from "./graphql/graphql.module";
export * from "./graphql/errorHandling.filter";


// ========== Filters & Interceptors ==========
export * from "./interceptors/ResponseFormatter";
export * from "./interceptors/generalResponse.interceptor";
export * from "./interceptors/sqlInjection.interceptor";
export * from "./interceptors/main.interceptor";
export * from "./filters/rest-exception.filter";

// ========== Decorators ==========
export * from "./decorators/currentUser.decorator";
export * from "./decorators/public.decorator";

// ========== DTOs ==========
export * from "./dtos/currentUser.dto";
export * from "./dtos/pagintion";

// ========== Logging ==========
export * from "./logger/logger.service";

// ========== Infrastructure Modules ==========
export * from "./config/config.module";
export * from "./throttler/throttling.module";
export * from "./translation/translation.module";

// ========== Utilities ==========
export * from "./production/displayConsoles";
