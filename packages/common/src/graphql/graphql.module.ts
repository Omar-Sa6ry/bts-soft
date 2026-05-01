import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { DynamicModule, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "path";
import { HttpExceptionFilter } from "./errorHandling.filter";

export interface GraphqlModuleOptions {
  path?: string;
  autoSchemaFile?: string | boolean;
  playground?: boolean;
  debug?: boolean;
  installSubscriptionHandlers?: boolean;
}

/**
 * GraphQL configuration module with dynamic support.
 */
@Module({})
export class GraphqlModule {
  static forRoot(options?: GraphqlModuleOptions): DynamicModule {
    const gqlConfig: ApolloDriverConfig = {
      driver: ApolloDriver,
      path: options?.path || "/graphql",
      autoSchemaFile: options?.autoSchemaFile === undefined 
        ? join(process.cwd(), "src/schema.gql") 
        : options.autoSchemaFile as any,
      context: ({ req }) => ({
        request: req,
        user: req.user,
        language: req.headers["accept-language"] || "en",
      }),
      playground: options?.playground !== undefined ? options.playground : true,
      debug: options?.debug !== undefined ? options.debug : false,
      uploads: false,
      csrfPrevention: false,
      installSubscriptionHandlers: options?.installSubscriptionHandlers !== undefined 
        ? options.installSubscriptionHandlers 
        : true,
      subscriptions: {
        "subscriptions-transport-ws": {
          path: options?.path || "/graphql",
          keepAlive: 10000,
        },
        "graphql-ws": true,
      },
      formatError: (error) => {
        return {
          message: error.message,
          extensions: {
            ...error.extensions,
            stacktrace: undefined,
            locations: undefined,
            path: undefined,
          },
        };
      },
    };

    return {
      module: GraphqlModule,
      imports: [
        GraphQLModule.forRoot<ApolloDriverConfig>(gqlConfig),
      ],
      providers: [
        {
          provide: APP_FILTER,
          useClass: HttpExceptionFilter,
        },
      ],
      exports: [GraphQLModule],
    };
  }
}
