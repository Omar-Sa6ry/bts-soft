import { Test, TestingModule } from '@nestjs/testing';
import { OneSignalChannel } from './onesignal.channel';
import { NotificationConfigService } from '../core/config/notification.config';
import { ChannelRegistry } from '../core/registry/channel.registry';
import * as OneSignal from '@onesignal/node-onesignal';
import { NotificationClientError, NotificationProviderError } from '../core/errors/NotificationError';

jest.mock('@onesignal/node-onesignal', () => {
  const mockCreateNotification = jest.fn().mockResolvedValue({ id: 'onesignal_notification_id' });
  return {
    createConfiguration: jest.fn().mockReturnValue({}),
    DefaultApi: jest.fn().mockImplementation(() => {
      return {
        createNotification: mockCreateNotification,
      };
    }),
    Notification: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

describe('OneSignalChannel', () => {
  let channel: OneSignalChannel;
  let configService: any;
  let registry: any;
  let mockDefaultApiInstance: any;

  beforeEach(async () => {
    configService = {
      onesignalAppId: 'default-app-id',
      onesignalRestApiKey: 'default-rest-api-key',
    };

    registry = {
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OneSignalChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: registry },
      ],
    }).compile();

    channel = module.get<OneSignalChannel>(OneSignalChannel);
    channel.onModuleInit();

    mockDefaultApiInstance = new OneSignal.DefaultApi({} as any);
    mockDefaultApiInstance.createNotification.mockClear();
    (OneSignal.createConfiguration as jest.Mock).mockClear();
    (OneSignal.DefaultApi as jest.Mock).mockClear();
  });

  it('should register channel on module init', () => {
    expect(registry.register).toHaveBeenCalledWith(channel);
  });

  it('should send notification using default configuration and subscription ID targeting', async () => {
    await channel.send({
      recipientId: 'player-id-123',
      body: 'Hello OneSignal',
      title: 'Greeting',
    });

    expect(mockDefaultApiInstance.createNotification).toHaveBeenCalled();
    const sentNotification = mockDefaultApiInstance.createNotification.mock.calls[0][0];
    
    expect(sentNotification.app_id).toBe('default-app-id');
    expect(sentNotification.contents).toEqual({ en: 'Hello OneSignal' });
    expect(sentNotification.headings).toEqual({ en: 'Greeting' });
    expect(sentNotification.include_subscription_ids).toEqual(['player-id-123']);
  });

  it('should handle custom lang parameter', async () => {
    await channel.send({
      recipientId: 'player-id-123',
      body: 'Hello OneSignal',
      title: 'Greeting',
      lang: 'es',
    });

    const sentNotification = mockDefaultApiInstance.createNotification.mock.calls[0][0];
    expect(sentNotification.contents).toEqual({ es: 'Hello OneSignal' });
    expect(sentNotification.headings).toEqual({ es: 'Greeting' });
  });

  it('should support override parameters in channelOptions', async () => {
    await channel.send({
      recipientId: 'player-id-123',
      body: 'Hello',
      channelOptions: {
        appId: 'override-app-id',
        restApiKey: 'override-rest-api-key',
        included_segments: ['Active Users'],
        ios_badgeType: 'Increase',
        ios_badgeCount: 1,
      },
    });

    expect(OneSignal.createConfiguration).toHaveBeenCalledWith(expect.objectContaining({
      restApiKey: 'override-rest-api-key',
    }));

    const sentNotification = mockDefaultApiInstance.createNotification.mock.calls[0][0];
    expect(sentNotification.app_id).toBe('override-app-id');
    expect(sentNotification.included_segments).toEqual(['Active Users']);
    expect(sentNotification.include_subscription_ids).toBeUndefined();
    expect((sentNotification as any).ios_badgeType).toBe('Increase');
    expect((sentNotification as any).ios_badgeCount).toBe(1);
  });

  it('should throw NotificationProviderError if App ID is missing', async () => {
    configService.onesignalAppId = undefined;
    await expect(channel.send({ recipientId: 'player-id-123', body: 'Hello' }))
      .rejects.toThrow('OneSignal App ID is not configured.');
  });

  it('should throw NotificationProviderError if REST API Key is missing', async () => {
    configService.onesignalRestApiKey = undefined;
    await expect(channel.send({ recipientId: 'player-id-123', body: 'Hello' }))
      .rejects.toThrow('OneSignal REST API Key is not configured.');
  });

  it('should throw NotificationClientError on 4xx response error from OneSignal client', async () => {
    mockDefaultApiInstance.createNotification.mockRejectedValueOnce({
      code: 400,
      body: '{"errors":["App ID not found"]}',
      message: 'Bad Request',
    });

    await expect(channel.send({ recipientId: 'player-id-123', body: 'Hello' }))
      .rejects.toThrow(NotificationClientError);
  });

  it('should throw NotificationProviderError on 5xx or general error from OneSignal client', async () => {
    mockDefaultApiInstance.createNotification.mockRejectedValueOnce({
      code: 500,
      message: 'Internal Server Error',
    });

    await expect(channel.send({ recipientId: 'player-id-123', body: 'Hello' }))
      .rejects.toThrow(NotificationProviderError);
  });
});
