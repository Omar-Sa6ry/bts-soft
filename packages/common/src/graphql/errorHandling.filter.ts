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

    let statusCode = exception.extensions?.statusCode || 500;
    let message = exception.message;
    let response: any = null;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      response = exception.getResponse();
      if (response && typeof response === 'object') {
        message = response.message || exception.message;
      }
    } else if (exception && typeof exception === 'object') {
      const status = exception.status || exception.statusCode || exception.extensions?.statusCode;
      if (status) {
        statusCode = status;
      }
      if (typeof exception.getResponse === 'function') {
        response = exception.getResponse();
      } else if (exception.response) {
        response = exception.response;
      }
      if (response && typeof response === 'object') {
        message = response.message || exception.message;
      }
    }

    // Return a formatted GraphQL error that hides sensitive internal details
    return new GraphQLError(
      Array.isArray(message) ? message[0] : message,
      {
        extensions: {
          ...exception.extensions, // Preserve any existing GraphQL error extensions
          response, // Include the response containing detailed validation errors
          success: false, // Indicate that the operation failed
          statusCode, // Default to 500 if not provided
          timeStamp: new Date().toISOString().split('T')[0], // Add date for easier tracking
          code: exception.extensions?.code || (statusCode === 400 ? 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR'), // Default error code
          // Remove fields that are not necessary or may expose sensitive data
          stacktrace: undefined,
          error: undefined,
          locations: undefined,
          path: undefined,
        },
      }
    );
  }
}
