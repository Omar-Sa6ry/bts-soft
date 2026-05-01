import { Test } from '@nestjs/testing';
import { GraphqlModule } from './graphql.module';
import { GraphQLModule } from '@nestjs/graphql';

describe('GraphqlModule', () => {
  it('should be defined with default options', async () => {
    const module = await Test.createTestingModule({
      imports: [GraphqlModule.forRoot()],
    }).compile();

    expect(module).toBeDefined();
    expect(module.get(GraphQLModule)).toBeDefined();
  });

  it('should accept custom path', async () => {
    const module = await Test.createTestingModule({
      imports: [GraphqlModule.forRoot({ path: '/custom-gql' })],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should accept debug and playground options', async () => {
    const module = await Test.createTestingModule({
      imports: [GraphqlModule.forRoot({ debug: true, playground: false })],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should handle autoSchemaFile as boolean', async () => {
    const module = await Test.createTestingModule({
      imports: [GraphqlModule.forRoot({ autoSchemaFile: true })],
    }).compile();

    expect(module).toBeDefined();
  });

  it('should accept installSubscriptionHandlers option', async () => {
    const module = await Test.createTestingModule({
      imports: [GraphqlModule.forRoot({ installSubscriptionHandlers: false })],
    }).compile();

    expect(module).toBeDefined();
  });
});
