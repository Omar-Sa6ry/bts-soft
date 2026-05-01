import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './currentUser.decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

function getParamDecoratorFactory(decorator: any) {
  class Test {
    test(@decorator() value: any) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, Test, 'test');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser Decorator', () => {
  it('should return user from request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const user = { id: '1', email: 'test@test.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getType: () => 'http',
    };

    const result = factory(null, mockContext);
    expect(result).toEqual(user);
  });

  it('should return null if no user in request', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({}), // no user
      }),
      getType: () => 'http',
    };

    const result = factory(null, mockContext);
    expect(result).toBeNull();
  });

  it('should return user from GraphQL context (req.user)', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const user = { id: '1', email: 'gql@test.com' };
    const mockGqlContext = {
      getContext: () => ({ req: { user } }),
    };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

    const mockContext = {
      getType: () => 'graphql',
    };

    const result = factory(null, mockContext);
    expect(result).toEqual(user);
  });

  it('should return user from GraphQL context (ctx.user)', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const user = { id: '2', email: 'gql2@test.com' };
    const mockGqlContext = {
      getContext: () => ({ user }),
    };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

    const mockContext = {
      getType: () => 'graphql',
    };

    const result = factory(null, mockContext);
    expect(result).toEqual(user);
  });

  it('should return null from GraphQL context if no user', () => {
    const factory = getParamDecoratorFactory(CurrentUser);
    const mockGqlContext = {
      getContext: () => ({}),
    };
    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

    const mockContext = {
      getType: () => 'graphql',
    };

    const result = factory(null, mockContext);
    expect(result).toBeNull();
  });
});
