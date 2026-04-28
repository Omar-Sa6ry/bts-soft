import { Test, TestingModule } from '@nestjs/testing';
import { GeoRedisService } from './geoRedis.service';
import * as RedisMock from 'ioredis-mock';

describe('GeoRedisService', () => {
  let service: GeoRedisService;
  let redisClient: any;

  beforeEach(async () => {
    redisClient = new RedisMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeoRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<GeoRedisService>(GeoRedisService);
    
 
    redisClient.geoAdd = jest.fn();
    redisClient.geoPos = jest.fn();
    redisClient.geoDist = jest.fn();
    redisClient.geoHash = jest.fn();
    redisClient.zRem = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('geoAdd', () => {
    it('should call geoAdd with correct arguments', async () => {
      const key = 'places';
      const member = 'point1';
      await service.geoAdd(key, 31.2357, 30.0444, member);
      
      expect(redisClient.geoAdd).toHaveBeenCalledWith(key, {
        longitude: 31.2357,
        latitude: 30.0444,
        member: member
      });
    });
  });

  describe('geoPos', () => {
    it('should return member coordinates', async () => {
      const expected = [{ longitude: '31.2357', latitude: '30.0444' }];
      redisClient.geoPos.mockResolvedValue(expected);
      
      const res = await service.geoPos('places', 'point1');
      expect(res).toEqual(expected);
      expect(redisClient.geoPos).toHaveBeenCalledWith('places', 'point1');
    });
  });

  describe('geoDist', () => {
    it('should return distance between members', async () => {
      redisClient.geoDist.mockResolvedValue(150.5);
      const res = await service.geoDist('places', 'p1', 'p2', 'km');
      expect(res).toBe(150.5);
      expect(redisClient.geoDist).toHaveBeenCalledWith('places', 'p1', 'p2', 'km');
    });
  });

  describe('geoHash', () => {
    it('should return geohash strings', async () => {
      redisClient.geoHash.mockResolvedValue(['stqvw']);
      const res = await service.geoHash('places', 'p1');
      expect(res).toEqual(['stqvw']);
    });
  });

  describe('geoRemove', () => {
    it('should remove member using zRem', async () => {
      redisClient.zRem.mockResolvedValue(1);
      const res = await service.geoRemove('places', 'p1');
      expect(res).toBe(1);
      expect(redisClient.zRem).toHaveBeenCalledWith('places', 'p1');
    });
  });
});
