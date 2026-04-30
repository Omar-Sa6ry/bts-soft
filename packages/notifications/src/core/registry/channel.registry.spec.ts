import { Test, TestingModule } from '@nestjs/testing';
import { ChannelRegistry } from './channel.registry';
import { INotificationChannel } from '../../telegram/channels/INotificationChannel.interface';

describe('ChannelRegistry', () => {
  let registry: ChannelRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChannelRegistry],
    }).compile();

    registry = module.get<ChannelRegistry>(ChannelRegistry);
  });

  it('should be defined', () => {
    expect(registry).toBeDefined();
  });

  it('should register and retrieve a channel', () => {
    const mockChannel: INotificationChannel = {
      name: 'mock',
      send: jest.fn(),
    };

    registry.register(mockChannel);
    expect(registry.getChannel('mock')).toBe(mockChannel);
  });

  it('should throw error for non-existent channel', () => {
    expect(() => registry.getChannel('non-existent')).toThrow('Notification channel not found: non-existent');
  });

  it('should list all registered channels', () => {
    const channel1: INotificationChannel = { name: 'c1', send: jest.fn() };
    const channel2: INotificationChannel = { name: 'c2', send: jest.fn() };

    registry.register(channel1);
    registry.register(channel2);

    const channels = registry.getAllChannels();
    expect(channels).toContain(channel1);
    expect(channels).toContain(channel2);
    expect(channels.length).toBe(2);
  });
});
