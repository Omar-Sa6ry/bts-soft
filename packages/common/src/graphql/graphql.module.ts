import { ApolloDriver } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "path";
import { HttpExceptionFilter } from "./errorHandling.filter";
// import depthLimit from 'graphql-depth-limit';
// import {
//   createComplexityRule as queryComplexity,
//   fieldExtensionsEstimator,
//   simpleEstimator,
// } from 'graphql-query-complexity';

/**
 * GraphQL configuration module.
 *
 * This module sets up the NestJS GraphQL environment, defines schema generation,
 * enables subscriptions, adds security features, and integrates a global exception filter.
 */
@Module({
  imports: [
    GraphQLModule.forRoot({
      driver: ApolloDriver, // Use Apollo Server as the GraphQL driver
      path: "/graphql",

      // Auto-generate GraphQL schema file in the src/ directory
      autoSchemaFile: join(process.cwd(), "src/schema.gql"),
      // Pass HTTP request and language headers into the GraphQL context
      context: ({ req }) => {
        const user = req?.user ?? null;
        const language = req?.headers?.["accept-language"] || "en";

        return {
          request: req,
          user,
          language,
        };
      },

      // Developer tools and debugging
      playground: true, // Enable GraphQL Playground for development
      debug: false, // Disable verbose debug logs in production
      uploads: false, // Disable file uploads via GraphQL (use REST instead if needed)
      csrfPrevention: false, // Disable CSRF protection (handled elsewhere)

      // Enable real-time subscriptions via WebSocket
      installSubscriptionHandlers: true,
      subscriptions: {
        // Legacy subscription transport (backward compatibility)
        "subscriptions-transport-ws": {
          path: "/graphql", // WebSocket endpoint
          keepAlive: 10000, // Ping interval in milliseconds
        },
        // Modern GraphQL WebSocket support
        "graphql-ws": true,
      },

      // OPTIONAL: Add query depth and complexity limits for security
      // validationRules: [
      //   depthLimit(5), // Prevent overly nested queries
      //   queryComplexity({
      //     estimators: [
      //       fieldExtensionsEstimator(),
      //       simpleEstimator({ defaultComplexity: 1 }),
      //     ],
      //     maximumComplexity: 1000, // Maximum allowed complexity score
      //   }),
      // ],

      /**
       * Custom error formatter to sanitize GraphQL error responses.
       * Removes unnecessary fields such as stacktrace, location, and path.
       */
      formatError: (error) => {
        return {
          message: error.message,
          extensions: {
            ...error.extensions,
            stacktrace: undefined,
            locations: undefined,
            path: undefined,
          },
        };
      },
    }),
  ],

  providers: [
    /**
     * Register the global exception filter to handle and format all GraphQL errors.
     */
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class GraphqlModule {}
