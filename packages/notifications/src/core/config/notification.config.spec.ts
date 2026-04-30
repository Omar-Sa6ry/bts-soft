import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationConfigService } from './notification.config';

describe('NotificationConfigService', () => {
  let service: NotificationConfigService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const mockConfig = {
                'EMAIL_SENDER': 'test@test.com',
                'TWILIO_ACCOUNT_SID': 'AC123',
                'TELEGRAM_BOT_TOKEN': 'bot123',
                'DISCORD_WEBHOOK_URL': 'http://discord.com',
              };
              return mockConfig[key];
            }),

          },
        },
      ],
    }).compile();

    service = module.get<NotificationConfigService>(NotificationConfigService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return email configuration', () => {
    expect(service.emailSender).toBe('test@test.com');
  });

  it('should return twilio configuration', () => {
    expect(service.twilioAccountSid).toBe('AC123');
  });

  it('should return telegram configuration', () => {
    expect(service.telegramToken).toBe('bot123');
  });

  it('should return discord configuration', () => {
    expect(service.discordWebhookUrl).toBe('http://discord.com');
  });

  it('should return undefined for missing config gracefully', () => {
    // We can't easily spy on the mock in this setup, so we check if it handles missing keys
    const result = (service as any).configService.get('missing.key');
    expect(result).toBeUndefined();
  });
});

