import { Module } from '@nestjs/common';
// Import NestJS's ConfigModule and rename it to 'config' to avoid conflict with the local class name.
import { ConfigModule as config } from '@nestjs/config';

/**
 * @Module ConfigModule
 * This module is responsible for loading and managing environment variables
 * to ensure all services in the application/Monorepo use a consistent
 * mechanism for configuration.
 *
 * Key features enabled via 'config.forRoot':
 * 1. Global: Automatically makes the configuration service available throughout the application.
 * 2. Cache: Caches loaded environment variables for performance improvement.
 * 3. Dynamic Environment File Loading: Loads the appropriate .env file based on the
 * 'NODE_ENV' variable.
 */
@Module({
  imports: [
    config.forRoot({
      // Enable caching of loaded environment variables.
      // This speeds up subsequent lookups and prevents repeated file reads.
      cache: true,
      
      // Make the module global so it only needs to be imported in the root module (AppModule).
      isGlobal: true,
      
      // Dynamically set the environment file path. 
      // It checks NODE_ENV (e.g., 'production', 'staging') and falls back to 'development'.
      // Example: If NODE_ENV is 'production', it looks for '.env.production'.
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
  ],
})
export class ConfigModule {}
