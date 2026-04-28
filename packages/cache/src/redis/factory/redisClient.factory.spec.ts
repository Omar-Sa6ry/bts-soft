import { createRedisClient } from './redisClient.factory';
import * as redis from 'redis';
import { Logger } from '@nestjs/common';

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('createRedisClient Factory', () => {
  let mockClient: any;
  let loggerErrorSpy: jest.SpyInstance;
  let loggerLogSpy: jest.SpyInstance;

  beforeEach(() => {
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
    };
    (redis.createClient as jest.Mock).mockReturnValue(mockClient);
    
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerErrorSpy.mockRestore();
    loggerLogSpy.mockRestore();
  });

  it('should create and connect the client successfully', async () => {
    const client = await createRedisClient();
    
    expect(redis.createClient).toHaveBeenCalled();
    expect(mockClient.connect).toHaveBeenCalled();
    expect(loggerLogSpy).toHaveBeenCalledWith('Successfully connected to Redis');
    expect(client).toBe(mockClient);
  });

  it('should handle connection errors and throw', async () => {
    const error = new Error('Connection failed');
    mockClient.connect.mockRejectedValue(error);

    await expect(createRedisClient()).rejects.toThrow('Connection failed');
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to connect to Redis: Connection failed'),
      error.stack
    );
  });

  it('should register error event listener', async () => {
    await createRedisClient();
    expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    
    // Test the error listener logic
    const errorListener = mockClient.on.mock.calls.find(call => call[0] === 'error')[1];
    
    // ECONNREFUSED case
    errorListener({ code: 'ECONNREFUSED' });
    expect(loggerErrorSpy).toHaveBeenCalledWith('Redis connection refused - is Redis running?');
    
    // Other error case
    errorListener({ message: 'Unknown error' });
    expect(loggerErrorSpy).toHaveBeenCalledWith('Redis error: Unknown error');
  });
});
