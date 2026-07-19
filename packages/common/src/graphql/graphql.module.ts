import { ApolloDriver, ApolloDriverConfig, ApolloFederationDriver } from "@nestjs/apollo";
import { DynamicModule, Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "path";
import { HttpExceptionFilter } from "./errorHandling.filter";
import { GraphQLUpload } from "graphql-upload-minimal";

export interface GraphqlModuleOptions {
  path?: string;
  autoSchemaFile?: string | boolean;
  playground?: boolean;
  debug?: boolean;
  installSubscriptionHandlers?: boolean;
  csrfPrevention?: boolean;
  federation?: boolean;
  driver?: any;
  webSocket?: {
    enabled?: boolean;
    path?: string;
    keepAlive?: number;
  };
}

/**
 * Dynamic GraphQL module leveraging Apollo Driver & Apollo Federation.
 * Supports WebSockets subscriptions, upload scalars, and custom error filters.
 */
@Module({})
export class GraphqlModule {
  static forRoot(options?: GraphqlModuleOptions): DynamicModule {
    const isFederated = options?.federation === true;
    const selectedDriver = options?.driver || (isFederated ? ApolloFederationDriver : ApolloDriver);

    const wsConfig = {
      "subscriptions-transport-ws": {
        path: options?.webSocket?.path || options?.path || "/graphql",
        keepAlive: options?.webSocket?.keepAlive || 10000,
      },
      "graphql-ws": options?.webSocket?.enabled !== false,
    };

    const gqlConfig: ApolloDriverConfig = {
      driver: selectedDriver,
      path: options?.path || "/graphql",
      autoSchemaFile: options?.autoSchemaFile === undefined 
        ? join(process.cwd(), "src/schema.gql") 
        : options.autoSchemaFile as any,
      context: ({ req, res, connection }) => ({
        req: req || connection?.context,
        res,
        request: req || connection?.context,
        user: req?.user || connection?.context?.user,
        language: req?.headers?.["accept-language"] || connection?.context?.["accept-language"] || "en",
      }),
      playground: options?.playground !== undefined ? options.playground : true,
      debug: options?.debug !== undefined ? options.debug : false,
      csrfPrevention: options?.csrfPrevention !== undefined ? options.csrfPrevention : false,
      installSubscriptionHandlers: options?.installSubscriptionHandlers !== undefined 
        ? options.installSubscriptionHandlers 
        : true,
      subscriptions: wsConfig,
      resolvers: {
        Upload: GraphQLUpload,
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
