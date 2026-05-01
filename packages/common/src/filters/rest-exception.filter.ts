import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ResponseFormatter } from '../interceptors/ResponseFormatter';

/**
 * RestExceptionFilter
 * 
 * A global exception filter for REST APIs.
 * Ensures that every error response follows the standardized JSON structure.
 * 
 * Note: Uses 'any' for Response/Request to remain technology-agnostic 
 * and avoid hard dependencies on express/fastify at the common package level.
 */
@Catch()
export class RestExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<any>();
    const request = ctx.getRequest<any>();

    // Extract status code and error details
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorResponse = ResponseFormatter.formatError(exception);

    // Ensure we add the request URL for better debugging
    const finalResponse = {
      ...errorResponse,
      statusCode: status,
      path: request.url,
    };

    if (response.status && typeof response.status === 'function') {
      response.status(status).json(finalResponse);
    }
  }
}
