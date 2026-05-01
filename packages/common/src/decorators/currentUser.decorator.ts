import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

/**
 * CurrentUser Decorator
 * 
 * Extracts the user object from the request context.
 * Compatible with both REST and GraphQL.
 * 
 * Usage: @CurrentUser() user: User
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    const isGraphQL = (context.getType() as string) === 'graphql';

    if (isGraphQL) {
      const ctx = GqlExecutionContext.create(context);
      return ctx.getContext().req?.user || ctx.getContext().user;
    }

    const request = context.switchToHttp().getRequest();
    return request.user;
  },
);
