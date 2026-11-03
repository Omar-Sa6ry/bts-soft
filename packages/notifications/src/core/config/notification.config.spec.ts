import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotificationConfigService } from './notification.config';

describe('NotificationConfigService', () => {
  let service: NotificationConfigService;
  let mockEnv: Record<string, any>;

  beforeEach(async () => {
    mockEnv = {
      EMAIL_SENDER: 'sender@test.com',
      EMAIL_USER: 'user@test.com',
      EMAIL_PASS: 'password123',
      EMAIL_HOST: 'smtp.test.com',
      EMAIL_PORT: 587,
      EMAIL_SERVICE: 'gmail',
      EMAIL_PROVIDER: 'ses',
      SENDGRID_API_KEY: 'sg-123',
      TWILIO_ACCOUNT_SID: 'AC123',
      TWILIO_AUTH_TOKEN: 'token123',
      TWILIO_WHATSAPP_NUMBER: '+123456789',
      TWILIO_SMS_NUMBER: '+987654321',
      TELEGRAM_BOT_TOKEN: 'bot123',
      DISCORD_WEBHOOK_URL: 'http://discord.com',
      TEAMS_WEBHOOK_URL: 'http://teams.com',
      FB_PAGE_ACCESS_TOKEN: 'fb-token',
      FB_GRAPH_API_VERSION: 'v19.0',
      FIREBASE_SERVICE_ACCOUNT_PATH: '/path/to/firebase.json',
      SLACK_WEBHOOK_URL: 'https://slack.com/hook',
      SLACK_BOT_TOKEN: 'xoxb-slack',
      SLACK_DEFAULT_CHANNEL: '#general',
      WEBHOOK_DEFAULT_SIGNING_SECRET: 'whsec_123',
      ONESIGNAL_APP_ID: 'one-app-id',
      ONESIGNAL_REST_API_KEY: 'one-api-key',
      WEB_PUSH_PUBLIC_KEY: 'pub-key',
      WEB_PUSH_PRIVATE_KEY: 'priv-key',
      WEB_PUSH_SUBJECT: 'mailto:admin@example.com',
      SMSMISR_USERNAME: 'misr_user',
      SMSMISR_PASSWORD: 'misr_password',
      SMSMISR_SENDER: 'misr_sender',
      SMS_PROVIDER: 'smsmisr',
      SMSMISR_ENVIRONMENT: 2,
      VONAGE_API_KEY: 'vonage_key',
      VONAGE_API_SECRET: 'vonage_secret',
      VONAGE_SENDER: 'vonage_sender',
      AWS_SES_ACCESS_KEY_ID: 'aws_key',
      AWS_SES_SECRET_ACCESS_KEY: 'aws_secret',
      AWS_SES_REGION: 'eu-west-1',
      IN_APP_PROVIDER: 'custom-inapp',
      PUSHER_APP_ID: 'p_app',
      PUSHER_KEY: 'p_key',
      PUSHER_SECRET: 'p_secret',
      PUSHER_CLUSTER: 'eu',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationConfigService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockEnv[key]),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationConfigService>(NotificationConfigService);
  });

  it('should initialize and validate config on module init', () => {
    expect(() => service.onModuleInit()).not.toThrow();
  });

  it('should warn when validation has errors', () => {
    mockEnv.EMAIL_PORT = 'not-a-number-and-should-fail' as any;
    expect(() => service.onModuleInit()).not.toThrow();
  });

  it('should return all getters properly when configured', () => {
    expect(service.telegramToken).toBe('bot123');
    expect(service.discordWebhookUrl).toBe('http://discord.com');
    expect(service.teamsWebhookUrl).toBe('http://teams.com');
    expect(service.facebookPageAccessToken).toBe('fb-token');
    expect(service.facebookGraphApiVersion).toBe('v19.0');
    expect(service.twilioAccountSid).toBe('AC123');
    expect(service.twilioAuthToken).toBe('token123');
    expect(service.twilioWhatsappNumber).toBe('+123456789');
    expect(service.twilioSmsNumber).toBe('+987654321');
    expect(service.firebaseServiceAccountPath).toBe('/path/to/firebase.json');
    expect(service.emailUser).toBe('user@test.com');
    expect(service.emailPass).toBe('password123');
    expect(service.emailHost).toBe('smtp.test.com');
    expect(service.emailPort).toBe(587);
    expect(service.emailService).toBe('gmail');
    expect(service.emailSender).toBe('sender@test.com');
    expect(service.emailProvider).toBe('ses');
    expect(service.sendgridApiKey).toBe('sg-123');
    expect(service.slackWebhookUrl).toBe('https://slack.com/hook');
    expect(service.slackBotToken).toBe('xoxb-slack');
    expect(service.slackDefaultChannel).toBe('#general');
    expect(service.webhookDefaultSigningSecret).toBe('whsec_123');
    expect(service.onesignalAppId).toBe('one-app-id');
    expect(service.onesignalRestApiKey).toBe('one-api-key');
    expect(service.webPushPublicKey).toBe('pub-key');
    expect(service.webPushPrivateKey).toBe('priv-key');
    expect(service.webPushSubject).toBe('mailto:admin@example.com');
    expect(service.smsmisrUsername).toBe('misr_user');
    expect(service.smsmisrPassword).toBe('misr_password');
    expect(service.smsmisrSender).toBe('misr_sender');
    expect(service.smsProvider).toBe('smsmisr');
    expect(service.smsmisrEnvironment).toBe(2);
    expect(service.vonageApiKey).toBe('vonage_key');
    expect(service.vonageApiSecret).toBe('vonage_secret');
    expect(service.vonageSender).toBe('vonage_sender');
    expect(service.awsSesAccessKeyId).toBe('aws_key');
    expect(service.awsSesSecretAccessKey).toBe('aws_secret');
    expect(service.awsSesRegion).toBe('eu-west-1');
    expect(service.inAppProvider).toBe('custom-inapp');
    expect(service.pusherAppId).toBe('p_app');
    expect(service.pusherKey).toBe('p_key');
    expect(service.pusherSecret).toBe('p_secret');
    expect(service.pusherCluster).toBe('eu');
  });

  it('should fall back to defaults when optional config keys are absent', () => {
    mockEnv = {}; // empty
    expect(service.facebookGraphApiVersion).toBe('v18.0');
    expect(service.emailProvider).toBe('nodemailer');
    expect(service.smsProvider).toBe('twilio');
    expect(service.smsmisrEnvironment).toBe(1);
    expect(service.inAppProvider).toBe('pusher');
    expect(service.emailPort).toBeUndefined();
    expect(service.emailSender).toBeUndefined();
  });

  it('should use emailUser for emailSender if emailSender is absent', () => {
    mockEnv = { EMAIL_USER: 'fallback@example.com' };
    expect(service.emailSender).toBe('fallback@example.com');
  });
});
