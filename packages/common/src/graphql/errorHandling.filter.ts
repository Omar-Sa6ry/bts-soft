import { ArgumentsHost, Catch, HttpException, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';

/**
 * Global GraphQL exception filter.
 * Converts HTTP and internal exceptions into structured GraphQL error responses.
 */
@Catch()
export class HttpExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof Error) {
      this.logger.error(`GraphQL Exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error('GraphQL Exception', JSON.stringify(exception));
    }

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
