import { Test, TestingModule } from '@nestjs/testing';
import { StreamRedisService } from './streamRedis.service';

describe('StreamRedisService', () => {
  let service: StreamRedisService;
  let redisClient: unknown;

  beforeEach(async () => {
    redisClient = {
      xAdd: jest.fn(),
      xRead: jest.fn(),
      xGroupCreate: jest.fn(),
      xReadGroup: jest.fn(),
      xAck: jest.fn(),
      xLen: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StreamRedisService,
        {
          provide: 'REDIS_CLIENT',
          useValue: redisClient,
        },
      ],
    }).compile();

    service = module.get<StreamRedisService>(StreamRedisService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('xAdd', () => {
    it('should add message to stream with stringified values', async () => {
      (redisClient as any).xAdd.mockResolvedValue('1526985054069-0');
      
      const result = await service.xAdd('mystream', { field1: 'value1', field2: { nested: true } });
      
      expect(result).toBe('1526985054069-0');
      expect((redisClient as any).xAdd).toHaveBeenCalledWith('mystream', '*', {
        field1: 'value1',
        field2: '{"nested":true}',
      });
    });
  });

  describe('xRead', () => {
    it('should read and parse messages from stream', async () => {
      const mockResponse = [
        {
          name: 'mystream',
          messages: [
            { id: '1526985054069-0', message: { field1: 'value1', field2: '{"nested":true}' } }
          ]
        }
      ];
      (redisClient as any).xRead.mockResolvedValue(mockResponse);

      const result = await service.xRead([{ key: 'mystream', id: '0' }], 10, 5000);

      expect(result).toEqual({
        mystream: [
          { id: '1526985054069-0', message: { field1: 'value1', field2: { nested: true } } }
        ]
      });
      expect((redisClient as any).xRead).toHaveBeenCalledWith(
        [{ key: 'mystream', id: '0' }],
        { COUNT: 10, BLOCK: 5000 }
      );
    });

    it('should return null on timeout', async () => {
      (redisClient as any).xRead.mockResolvedValue(null);
      const result = await service.xRead([{ key: 'mystream', id: '$' }], 1, 100);
      expect(result).toBeNull();
    });
  });

  describe('xGroupCreate', () => {
    it('should create consumer group', async () => {
      (redisClient as any).xGroupCreate.mockResolvedValue('OK');
      const result = await service.xGroupCreate('mystream', 'mygroup', '$', true);
      expect(result).toBe('OK');
      expect((redisClient as any).xGroupCreate).toHaveBeenCalledWith('mystream', 'mygroup', '$', { MKSTREAM: true });
    });
  });

  describe('xReadGroup', () => {
    it('should read messages as consumer group', async () => {
      const mockResponse = [
        {
          name: 'mystream',
          messages: [
            { id: '1526985054069-0', message: { data: 'test' } }
          ]
        }
      ];
      (redisClient as any).xReadGroup.mockResolvedValue(mockResponse);

      const result = await service.xReadGroup('mygroup', 'Alice', [{ key: 'mystream', id: '>' }]);

      expect(result).toEqual({
        mystream: [
          { id: '1526985054069-0', message: { data: 'test' } }
        ]
      });
      expect((redisClient as any).xReadGroup).toHaveBeenCalledWith(
        'mygroup',
        'Alice',
        [{ key: 'mystream', id: '>' }],
        {}
      );
    });
  });

  describe('xAck', () => {
    it('should ack messages', async () => {
      (redisClient as any).xAck.mockResolvedValue(2);
      const result = await service.xAck('mystream', 'mygroup', '1-0', '2-0');
      expect(result).toBe(2);
      expect((redisClient as any).xAck).toHaveBeenCalledWith('mystream', 'mygroup', ['1-0', '2-0']);
    });

    it('should return 0 if no ids provided', async () => {
      const result = await service.xAck('mystream', 'mygroup');
      expect(result).toBe(0);
      expect((redisClient as any).xAck).not.toHaveBeenCalled();
    });
  });

  describe('xLen', () => {
    it('should return stream length', async () => {
      (redisClient as any).xLen.mockResolvedValue(5);
      const result = await service.xLen('mystream');
      expect(result).toBe(5);
      expect((redisClient as any).xLen).toHaveBeenCalledWith('mystream');
    });
  });
});
