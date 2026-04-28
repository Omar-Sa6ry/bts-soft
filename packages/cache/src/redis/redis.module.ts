import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { RedisConfigService } from "./config/redisConfig.service";
import { RedisService } from "./redis.service";
import { RedisServiceProvider } from "./provider/redisService.provider";
import { createRedisClient } from "./factory/redisClient.factory";
import { RedisHealth } from "./redis.health";
import { CoreRedisService } from "./services/core.service";
import { StringRedisService } from "./services/stringRedis.service";
import { NumberRedisService } from "./services/numberRedis.service";
import { UtilityRedisService } from "./services/utilityRedis.service";
import { HashRedisService } from "./services/hashRedis.service";
import { OperationRedisService } from "./services/operationRedis.service";
import { SortedORedisService } from "./services/sortedORedis.service";
import { ListORedisService } from "./services/ListORedis.service";
import { HyperLogLogRedisService } from "./services/hyperLogLogRedis.service";
import { GeoRedisService } from "./services/geoRedis.service";
import { TransactionRedisService } from "./services/transactionRedis.service";
import { PubSubRedisService } from "./services/pubSubRedis.service";
import { LockRedisService } from "./services/lockRedis.service";
/**
 * RedisModule
 *
 * This module integrates Redis into your NestJS application.
 * It sets up:
 *  - A cache manager using `cache-manager-ioredis`.
 *  - A shared Redis client.
 *  - Health checking for Redis connection.
 *  - Providers for dependency injection.
 */
@Module({
  imports: [
    // Registers the cache manager asynchronously using our custom configuration
    CacheModule.registerAsync({
      useClass: RedisConfigService,
    }),
  ],
  providers: [
    // Provides a singleton Redis client connection
    {
      provide: "REDIS_CLIENT",
      useFactory: createRedisClient,
    },
    // Health check provider for connection verification
    RedisHealth,
    // Factory-based service provider (implements interface)
    RedisServiceProvider,

    // Services
    RedisService,
    CoreRedisService,
    StringRedisService,
    NumberRedisService,
    UtilityRedisService,
    HashRedisService,
    OperationRedisService,
    SortedORedisService,
    ListORedisService,
    HyperLogLogRedisService,
    GeoRedisService,
    TransactionRedisService,
    PubSubRedisService,
    LockRedisService,
  ],
  // Expose these providers for other modules to use
  exports: [RedisService, RedisServiceProvider],
})
export class RedisModule {}
