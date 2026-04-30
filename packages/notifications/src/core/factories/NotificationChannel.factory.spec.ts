import { Test, TestingModule } from '@nestjs/testing';
import { NotificationChannelFactory } from './NotificationChannel.factory';
import { ChannelRegistry } from '../registry/channel.registry';
import { INotificationChannel } from '../../telegram/channels/INotificationChannel.interface';

describe('NotificationChannelFactory', () => {
  let factory: NotificationChannelFactory;
  let registry: ChannelRegistry;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationChannelFactory,
        {
          provide: ChannelRegistry,
          useValue: {
            getChannel: jest.fn(),
          },
        },

      ],
    }).compile();

    factory = module.get<NotificationChannelFactory>(NotificationChannelFactory);
    registry = module.get<ChannelRegistry>(ChannelRegistry);
  });

  it('should be defined', () => {
    expect(factory).toBeDefined();
  });

  it('should return a channel if registered', () => {
    const mockChannel: INotificationChannel = { name: 'email', send: jest.fn() };
    jest.spyOn(registry, 'getChannel').mockReturnValue(mockChannel);

    const result = factory.getChannel('email');
    expect(result).toBe(mockChannel);
  });

  it('should throw error if channel is not registered', () => {
    jest.spyOn(registry, 'getChannel').mockImplementation(() => {
      throw new Error('Not found');
    });

    expect(() => factory.getChannel('unknown')).toThrow('Not found');
  });
});
