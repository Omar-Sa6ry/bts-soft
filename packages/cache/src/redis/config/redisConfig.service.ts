import { Injectable } from "@nestjs/common";
import { CacheModuleOptions, CacheOptionsFactory } from "@nestjs/cache-manager";
import * as redisStore from "cache-manager-ioredis";

@Injectable()
export class RedisConfigService implements CacheOptionsFactory {
  createCacheOptions(): CacheModuleOptions {
    return {
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
      tls:
        process.env.REDIS_TLS === "true" || process.env.REDISTLS === "true"
          ? { rejectUnauthorized: false }
          : undefined,
      family: 4,
      ttl: 3600,
      retryStrategy: (times: number) => {
        if (times > 10) {
          return undefined;
        }
        return Math.min(times * 100, 5000);
      },
    };
  }
}
