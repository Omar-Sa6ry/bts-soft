import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { NotificationService, NOTIFICATION_QUEUE_NAME } from '../src/notification.service';
import { NotificationProcessor } from '../src/notification.processor';
import { NotificationChannelFactory } from '../src/core/factories/NotificationChannel.factory';
import { TemplateService } from '../src/core/templates/template.service';
import { NOTIFICATION_LOG_REPOSITORY, INotificationLogRepository } from '../src/core/models/NotificationLog.interface';
import { InMemoryNotificationLogRepository } from '../src/core/repositories/InMemoryNotificationLog.repository';
import { NotificationConfigService } from '../src/core/config/notification.config';
import { ChannelRegistry } from '../src/core/registry/channel.registry';
import { NotificationClientError, NotificationProviderError } from '../src/core/errors/NotificationError';
import { NotificationStatus } from '../src/core/models/NotificationLog.interface';
import { ChannelType } from '../src/core/models/ChannelType.const';
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
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
          },
        }),
        BullModule.registerQueue({
          name: NOTIFICATION_QUEUE_NAME,
        }),
      ],
      providers: [
        NotificationService,
        NotificationProcessor,
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

    service = moduleFixture.get<NotificationService>(NotificationService);
    logRepo = moduleFixture.get<InMemoryNotificationLogRepository>(NOTIFICATION_LOG_REPOSITORY);

  });

  afterAll(async () => {
    await moduleFixture.close();
  });


  beforeEach(() => {
    Object.values(mockChannels).forEach(c => c.send.mockClear());
  });

  const testChannel = async (type: ChannelType, recipient: string) => {
    const message = {
      recipientId: recipient,
      subject: `Test ${type}`,
      body: `Hello from E2E ${type}`,
    };

    await service.send(type, message);
    await new Promise((r) => setTimeout(r, 2000)); // Wait for processing

    expect(mockChannels[type].send).toHaveBeenCalled();
  };

  it('should process EMAIL notifications', () => testChannel(ChannelType.EMAIL, 'user@mail.com'));
  it('should process SMS notifications', () => testChannel(ChannelType.SMS, '+123456'));
  it('should process WHATSAPP notifications', () => testChannel(ChannelType.WHATSAPP, 'whatsapp:+123'));
  it('should process TELEGRAM notifications', () => testChannel(ChannelType.TELEGRAM, 'chat_id_123'));
  it('should process FIREBASE notifications', () => testChannel(ChannelType.FIREBASE_FCM, 'device_token_abc'));
  it('should process DISCORD notifications', () => testChannel(ChannelType.DISCORD, 'webhook_discord'));
  it('should process TEAMS notifications', () => testChannel(ChannelType.TEAMS, 'webhook_teams'));
  it('should process MESSENGER notifications', () => testChannel(ChannelType.MESSENGER, 'psid_123'));

  it('should handle Provider failures and retries', async () => {
    mockChannels[ChannelType.EMAIL].send
      .mockRejectedValueOnce(new NotificationProviderError('Fail'))
      .mockResolvedValueOnce(undefined);
    
    await service.send(ChannelType.EMAIL, {
      recipientId: 'retry@test.com',
      body: 'Retry me'
    });

    await new Promise((r) => setTimeout(r, 4000));
    expect(mockChannels[ChannelType.EMAIL].send).toHaveBeenCalledTimes(2);
  });

  it('should stop retries on Client Errors (Unrecoverable)', async () => {
    mockChannels[ChannelType.SMS].send.mockRejectedValue(new NotificationClientError('Invalid Number'));
    
    await service.send(ChannelType.SMS, {
      recipientId: 'wrong',
      body: 'No retry'
    });

    await new Promise((r) => setTimeout(r, 3000));
    // Should only attempt ONCE despite the policy of 2 attempts
    expect(mockChannels[ChannelType.SMS].send).toHaveBeenCalledTimes(1);
  });
});
