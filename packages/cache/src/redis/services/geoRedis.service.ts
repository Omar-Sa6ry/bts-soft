import { Injectable, Inject } from "@nestjs/common";
import { RedisClientType } from "redis";

@Injectable()
export class GeoRedisService {
  constructor(@Inject("REDIS_CLIENT") private redisClient: RedisClientType) {}

  /**
   * Add geospatial item (longitude, latitude) with member name to sorted set
   * @param key - Geospatial key
   * @param longitude - Longitude coordinate (-180 to 180)
   * @param latitude - Latitude coordinate (-85.05112878 to 85.05112878)
   * @param member - Member identifier
   * @returns Number of elements added
   */
  async geoAdd(
    key: string,
    longitude: number,
    latitude: number,
    member: string,
  ): Promise<number> {
    return this.redisClient.geoAdd(key, { longitude, latitude, member });
  }

  /**
   * Get longitude/latitude coordinates of a member
   * @param key - Geospatial key
   * @param member - Member to get coordinates for
   * @returns Array of coordinate objects or null if member not found
   */
  async geoPos(
    key: string,
    member: string,
  ): Promise<{ longitude: string; latitude: string }[]> {
    return this.redisClient.geoPos(key, member);
  }

  /**
   * Calculate distance between two members in specified units
   * @param key - Geospatial key
   * @param member1 - First member
   * @param member2 - Second member
   * @param unit - Distance unit: 'm' (meters), 'km' (kilometers), 'mi' (miles), 'ft' (feet)
   * @returns Distance in specified units or null if either member not found
   */
  async geoDist(
    key: string,
    member1: string,
    member2: string,
    unit: "m" | "km" | "mi" | "ft" = "km",
  ): Promise<number> {
    return this.redisClient.geoDist(key, member1, member2, unit);
  }

  /**
   * Get Geohash string representation of member's position
   * Geohash is a compact string encoding of coordinates
   * @param key - Geospatial key
   * @param member - Member to get geohash for
   * @returns Array of geohash strings
   */
  async geoHash(key: string, member: string): Promise<string[]> {
    return this.redisClient.geoHash(key, member);
  }

  /**
   * Remove geospatial member (uses standard ZREM since geodata is stored in sorted set)
   * @param key - Geospatial key
   * @param member - Member to remove
   * @returns 1 if removed, 0 if member didn't exist
   */
  async geoRemove(key: string, member: string): Promise<number> {
    return this.redisClient.zRem(key, member);
  }
}
