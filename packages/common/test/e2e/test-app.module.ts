import { Module, Controller, Get, UseInterceptors, UseFilters, Post, Body } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ObjectType, Field, ID } from '@nestjs/graphql';
import { 
  ConfigModule, 
  TranslationModule, 
  ThrottlingModule, 
  GraphqlModule,
  CurrentUser,
  Public,
  RestExceptionFilter,
  GeneralResponseInterceptor,
  SqlInjectionInterceptor,
  GraphqlBaseResponse
} from '../../src';
import { I18nService } from 'nestjs-i18n';
import * as path from 'path';

@ObjectType()
class TestUser {
  @Field(() => ID)
  id: string;

  @Field()
  username: string;
}

@ObjectType()
class TestResponse extends GraphqlBaseResponse {
  @Field(() => TestUser, { nullable: true })
  data?: TestUser;
}

@Controller('test')
@UseInterceptors(GeneralResponseInterceptor, SqlInjectionInterceptor)
@UseFilters(RestExceptionFilter)
export class TestController {
  constructor(private readonly i18n: I18nService) {}

  @Get('hello')
  @Public()
  async getHello() {
    return { message: await this.i18n.t('test.HELLO') };
  }

  @Get('secure')
  getSecure(@CurrentUser() user: any) {
    return user;
  }

  @Post('sql')
  @Public()
  testSql(@Body() body: any) {
    return body;
  }

  @Get('error')
  @Public()
  throwError() {
    throw new Error('Test Error');
  }

  @Get('throttle-me')
  @Public()
  throttleMe() {
    return { ok: true };
  }
}

@Resolver(() => TestUser)
export class TestResolver {
  @Query(() => String)
  @Public()
  async helloGql() {
    return 'GQL Hello';
  }

  @Mutation(() => TestResponse)
  @Public()
  async testMutation(@Args('id') id: string) {
    return {
      success: true,
      message: 'Mutation Success',
      data: { id, username: 'test_user' }
    };
  }
}

@Module({
  imports: [
    ConfigModule,
    TranslationModule.forRoot({
      localesPath: path.join(process.cwd(), 'test/e2e/locales'),
      fallbackLanguage: 'en',
      watch: false,
    }),
    ThrottlingModule.forRoot([
      {
        name: 'test',
        ttl: 60000,
        limit: 100,
      },
    ]),
    GraphqlModule.forRoot({
      autoSchemaFile: true,
      playground: false,
    }),
  ],
  controllers: [TestController],
  providers: [TestResolver],
})
export class TestAppModule {}
