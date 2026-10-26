import { Test, TestingModule } from '@nestjs/testing';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService, NOTIFICATION_QUEUE_NAME } from '../src/notification.service';
import { NotificationProcessor } from '../src/notification.processor';
import {
  FirebaseFcmProcessor,
  FacebookMessengerProcessor,
  WhatsAppProcessor,
  TelegramProcessor,
  DiscordProcessor,
  TeamsProcessor,
  EmailProcessor,
  SmsProcessor,
  SlackProcessor,
  WebhookProcessor,
  OneSignalProcessor,
  WebPushProcessor,
  InAppProcessor,
} from '../src/notification.processors';
import { NotificationChannelFactory } from '../src/core/factories/NotificationChannel.factory';
import { TemplateService } from '../src/core/templates/template.service';
import { NOTIFICATION_LOG_REPOSITORY } from '../src/core/models/NotificationLog.interface';
import { InMemoryNotificationLogRepository } from '../src/core/repositories/InMemoryNotificationLog.repository';
import { NotificationConfigService } from '../src/core/config/notification.config';
import { ChannelRegistry } from '../src/core/registry/channel.registry';
import { NotificationClientError, NotificationProviderError } from '../src/core/errors/NotificationError';
import { ChannelType } from '../src/core/enums/ChannelType.enum';
import { I18nService } from 'nestjs-i18n';
import { NOTIFICATION_RETRY_CONFIG } from '../src/core/models/RetryPolicy.interface';

describe('NotificationSystem Full Integration (E2E)', () => {
  let moduleFixture: TestingModule;
  let service: NotificationService;
  let logRepo: InMemoryNotificationLogRepository;

  
  const mockChannels: Record<string, any> = {
    [ChannelType.EMAIL]: { name: 'email', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.SMS]: { name: 'sms', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.WHATSAPP]: { name: 'whatsapp', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.TELEGRAM]: { name: 'telegram', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.FIREBASE_FCM]: { name: 'firebase_fcm', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.DISCORD]: { name: 'discord', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.TEAMS]: { name: 'teams', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.MESSENGER]: { name: 'messenger', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.SLACK]: { name: 'slack', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.WEBHOOK]: { name: 'webhook', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.ONESIGNAL]: { name: 'onesignal', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.WEB_PUSH]: { name: 'web_push', send: jest.fn().mockResolvedValue(undefined) },
    [ChannelType.IN_APP]: { name: 'in_app', send: jest.fn().mockResolvedValue(undefined) },
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST || '127.0.0.1',
            port: parseInt(process.env.REDIS_PORT || '6380'),
          },
        }),
        BullModule.registerQueue(
          { name: NOTIFICATION_QUEUE_NAME },
          ...Object.values(ChannelType).map((channel) => ({
            name: `send-notification-${channel}`,
          }))
        ),
      ],
      providers: [
        NotificationService,
        NotificationProcessor,
        FirebaseFcmProcessor,
        FacebookMessengerProcessor,
        WhatsAppProcessor,
        TelegramProcessor,
        DiscordProcessor,
        TeamsProcessor,
        EmailProcessor,
        SmsProcessor,
        SlackProcessor,
        WebhookProcessor,
        OneSignalProcessor,
        WebPushProcessor,
        InAppProcessor,
        TemplateService,
        {
          provide: NotificationChannelFactory,
          useValue: {
            getChannel: jest.fn((name) => mockChannels[name]),
          },
        },
        {
          provide: NOTIFICATION_LOG_REPOSITORY,
          useClass: InMemoryNotificationLogRepository,
        },
        {
          provide: NOTIFICATION_RETRY_CONFIG,
          useValue: {
            default: { attempts: 2, delay: 100, backoffType: 'fixed', removeOnComplete: true, removeOnFail: false },
          },
        },
        {
          provide: NotificationConfigService,
          useValue: {
            emailSender: 'noreply@test.com',
            facebookGraphApiVersion: 'v18.0',
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key) => `translated_${key}`),
          },
        },
        ChannelRegistry,
      ],
    }).compile();

    await moduleFixture.init();

    const processorTypes = [
      NotificationProcessor,
      FirebaseFcmProcessor,
      FacebookMessengerProcessor,
      WhatsAppProcessor,
      TelegramProcessor,
      DiscordProcessor,
      TeamsProcessor,
      EmailProcessor,
      SmsProcessor,
      SlackProcessor,
      WebhookProcessor,
      OneSignalProcessor,
      WebPushProcessor,
      InAppProcessor,
    ];
    await Promise.all(
      processorTypes.map((processorType) =>
        moduleFixture.get<any>(processorType).worker.waitUntilReady(),
      ),
    );

    service = moduleFixture.get<NotificationService>(NotificationService);
    logRepo = moduleFixture.get<InMemoryNotificationLogRepository>(NOTIFICATION_LOG_REPOSITORY);

  });

  afterAll(async () => {
    await moduleFixture.close();
  }, 60000);


  beforeEach(() => {
    Object.values(mockChannels).forEach(c => c.send.mockClear());
  });

  const waitForSendCalls = async (channel: ChannelType, expectedCalls = 1) => {
    const timeoutAt = Date.now() + 15_000;
    while (mockChannels[channel].send.mock.calls.length < expectedCalls && Date.now() < timeoutAt) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    expect(mockChannels[channel].send).toHaveBeenCalledTimes(expectedCalls);
  };

  const testChannel = async (type: ChannelType, recipient: string) => {
    const message = {
      recipientId: recipient,
      subject: `Test ${type}`,
      body: `Hello from E2E ${type}`,
    };

    await service.send(type, message);
    await waitForSendCalls(type);
  };

  it('should process EMAIL notifications', () => testChannel(ChannelType.EMAIL, 'user@mail.com'));
  it('should process SMS notifications', () => testChannel(ChannelType.SMS, '+123456'));
  it('should process WHATSAPP notifications', () => testChannel(ChannelType.WHATSAPP, 'whatsapp:+123'));
  it('should process TELEGRAM notifications', () => testChannel(ChannelType.TELEGRAM, 'chat_id_123'));
  it('should process FIREBASE notifications', () => testChannel(ChannelType.FIREBASE_FCM, 'device_token_abc'));
  it('should process DISCORD notifications', () => testChannel(ChannelType.DISCORD, 'webhook_discord'));
  it('should process TEAMS notifications', () => testChannel(ChannelType.TEAMS, 'webhook_teams'));
  it('should process MESSENGER notifications', () => testChannel(ChannelType.MESSENGER, 'psid_123'));
  it('should process SLACK notifications', () => testChannel(ChannelType.SLACK, 'https://hooks.slack.com/services/abc'));
  it('should process WEBHOOK notifications', () => testChannel(ChannelType.WEBHOOK, 'https://api.receiver.com/hook'));
  it('should process ONESIGNAL notifications', () => testChannel(ChannelType.ONESIGNAL, 'player_id_123'));
  it('should process WEB_PUSH notifications', () => testChannel(ChannelType.WEB_PUSH, '{"endpoint":"http://endpoint","keys":{"auth":"auth","p256dh":"p256dh"}}'));
  it('should process IN_APP notifications', () => testChannel(ChannelType.IN_APP, 'user-channel'));

  it('should handle Provider failures and retries', async () => {
    mockChannels[ChannelType.EMAIL].send
      .mockRejectedValueOnce(new NotificationProviderError('Fail'))
      .mockResolvedValueOnce(undefined);
    
    await service.send(ChannelType.EMAIL, {
      recipientId: 'retry@test.com',
      body: 'Retry me'
    });

    await waitForSendCalls(ChannelType.EMAIL, 2);
  });

  it('should stop retries on Client Errors (Unrecoverable)', async () => {
    mockChannels[ChannelType.SMS].send.mockRejectedValue(new NotificationClientError('Invalid Number'));
    
    await service.send(ChannelType.SMS, {
      recipientId: 'wrong',
      body: 'No retry'
    });

    // Should only attempt ONCE despite the policy of 2 attempts
    await waitForSendCalls(ChannelType.SMS);
    await new Promise((r) => setTimeout(r, 500));
    expect(mockChannels[ChannelType.SMS].send).toHaveBeenCalledTimes(1);
  });
});
