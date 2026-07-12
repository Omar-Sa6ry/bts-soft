import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@bts-soft/cache';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second
  
  // In-Memory Fallback Store
  private readonly memoryStore = new Map<string, { tokens: number; lastRefilled: number }>();

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly redisService?: RedisService,
  ) {
    this.capacity = Number(this.configService.get<number>('UPLOAD_RATE_LIMIT_CAPACITY') ?? 10);
    this.refillRate = Number(this.configService.get<number>('UPLOAD_RATE_LIMIT_REFILL_RATE') ?? 2);
    this.logger.log(`RateLimiterService initialized with capacity: ${this.capacity}, refillRate: ${this.refillRate} tokens/sec`);
    if (this.redisService) {
      this.logger.log('RateLimiterService is using Redis for distributed state.');
    } else {
      this.logger.log('RateLimiterService is using In-Memory fallback store.');
    }
  }

  async consume(key: string): Promise<boolean> {
    const now = Date.now();
    
    if (this.redisService) {
      try {
        const redisKey = `upload_rate_limit:${key}`;
        const data = await this.redisService.hGetAll(redisKey);
        
        let currentTokens: number;
        let lastRefilled: number;

        if (!data || Object.keys(data).length === 0) {
          currentTokens = this.capacity;
          lastRefilled = now;
        } else {
          currentTokens = data.tokens ? Number(data.tokens) : this.capacity;
          lastRefilled = data.lastRefilled ? Number(data.lastRefilled) : now;
        }

        // Calculate refilled tokens
        const elapsedMs = now - lastRefilled;
        const refillRatePerMs = this.refillRate / 1000;
        const tokensToAdd = elapsedMs * refillRatePerMs;
        
        let updatedTokens = Math.min(this.capacity, currentTokens + tokensToAdd);

        if (updatedTokens >= 1) {
          updatedTokens -= 1;
          
          // Save back
          await this.redisService.hSet(redisKey, 'tokens', updatedTokens.toString());
          await this.redisService.hSet(redisKey, 'lastRefilled', now.toString());
          await this.redisService.expire(redisKey, 3600); // 1 hour TTL
          
          return true;
        }
        
        return false;
      } catch (err) {
        this.logger.error(`Redis rate limiting failed, falling back to in-memory: ${(err as Error).message}`);
        // fallback to memory if redis operation fails
        return this.consumeMemory(key, now);
      }
    } else {
      return this.consumeMemory(key, now);
    }
  }

  private consumeMemory(key: string, now: number): boolean {
    let entry = this.memoryStore.get(key);
    if (!entry) {
      entry = { tokens: this.capacity, lastRefilled: now };
    }

    const elapsedMs = now - entry.lastRefilled;
    const refillRatePerMs = this.refillRate / 1000;
    const tokensToAdd = elapsedMs * refillRatePerMs;
    
    let tokens = Math.min(this.capacity, entry.tokens + tokensToAdd);

    if (tokens >= 1) {
      tokens -= 1;
      this.memoryStore.set(key, { tokens, lastRefilled: now });
      return true;
    }
    
    return false;
  }
}
