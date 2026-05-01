import { Observable, throwError } from "rxjs";
import { map, catchError } from "rxjs/operators";
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { ResponseFormatter } from "./ResponseFormatter";

/**
 * GeneralResponseInterceptor
 * 
 * Standardized response interceptor for REST APIs.
 * For GraphQL specific error handling, use GqlResponseInterceptor or a specialized Filter.
 */
@Injectable()
export class GeneralResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // If it's GraphQL, we might want to handle it differently, 
    // but this base implementation works for standard REST.
    const isGraphQL = (context.getType() as string) === "graphql";

    return next.handle().pipe(
      map((data: any) => ResponseFormatter.formatSuccess(data)),
      catchError((error) => {
        const errorResponse = ResponseFormatter.formatError(error);

        if (isGraphQL) {
          // If we are in GQL context but using this interceptor, 
          // we throw it so the GqlExceptionFilter can catch it.
          throw error; 
        }

        return throwError(() => errorResponse);
      })
    );
  }
}
