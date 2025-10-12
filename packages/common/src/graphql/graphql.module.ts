import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

/**
 * Global exception filter to handle and format all errors thrown in GraphQL resolvers.
 * 
 * This filter ensures that any exception (HTTP or otherwise) is converted into a
 * structured GraphQL error response that matches the application's error format.
 */
@Catch()
export class HttpExceptionFilter implements GqlExceptionFilter {
  /**
   * Catches any exception thrown in a GraphQL resolver or middleware.
   * 
   * @param exception - The exception thrown during request execution.
   * @param host - Provides access to the context of the current request (REST or GraphQL).
   * @returns A formatted GraphQL error with a consistent structure.
   */
  catch(exception: any, host: ArgumentsHost) {
    // Log the raw exception for debugging or server logs
    console.log(exception);

    // Return a formatted GraphQL error that hides sensitive internal details
    return new GraphQLError(exception.message, {
      extensions: {
        ...exception.extensions, // Preserve any existing GraphQL error extensions
        success: false, // Indicate that the operation failed
        statusCode: exception.extensions?.statusCode || 500, // Default to 500 if not provided
        timeStamp: new Date().toISOString().split('T')[0], // Add date for easier tracking
        code: exception.extensions?.code || 'INTERNAL_SERVER_ERROR', // Default error code
        // Remove fields that are not necessary or may expose sensitive data
        stacktrace: undefined,
        error: undefined,
        locations: undefined,
        path: undefined,
      },
    });
  }
}
