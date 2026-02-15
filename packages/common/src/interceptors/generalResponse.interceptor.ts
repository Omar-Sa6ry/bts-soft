import { Observable, throwError } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { GqlExecutionContext } from "@nestjs/graphql";
import { GraphQLError } from "graphql";
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";

@Injectable()
export class GeneralResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const isGraphQL = (context.getType() as string) === "graphql";
    const gqlCtx = isGraphQL ? GqlExecutionContext.create(context) : null;
    const operation = gqlCtx?.getInfo()?.operation?.operation;

    if (operation === "subscription") {
      return next.handle();
    }

    return next.handle().pipe(
      map((data: any) => {

        const isArray = Array.isArray(data);
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.data?.items)
          ? data.data.items
          : [];

        const response = {
          success: true,
          statusCode: data?.statusCode || 200,
          message: data?.message || "Request successful",
          timeStamp: new Date().toISOString(),
          pagination: data?.pagination,
          url: data?.url,
          items,
          data: isArray
            ? data
            : typeof data?.data === "number" || typeof data?.data === "string"
            ? data.data
            : typeof data?.data === "object"
            ? data.data
            : data ?? null,
        };

        if (!isGraphQL) {
          return response;
        }

        return {
          ...response,
        };
      }),

      catchError((error) => {
        const message =
          error?.errors?.map((err: any) => err?.message)?.join(", ") ||
          error?.response?.message ||
          error?.message ||
          "An unexpected error occurred";

        const statusCode = error?.response?.statusCode || error?.status || 500;

        const errorResponse = {
          success: false,
          statusCode,
          message,
          timeStamp: new Date().toISOString(),
          error: error?.response?.error || "Unknown error",
        };

        if (!isGraphQL) {
          throw errorResponse;
        }

        return throwError(
          () =>
            new GraphQLError(message, {
              extensions: errorResponse,
            })
        );
      })
    );
  }
}
