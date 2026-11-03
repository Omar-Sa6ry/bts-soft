import { describe, it, expect } from 'vitest';
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
} from './notification.processors';
import { NotificationProcessor } from './notification.processor';

describe('Notification Processors', () => {
  const mockDeps = [
    {} as any, // factory
    {} as any, // templateService
    {} as any, // logRepository
    {} as any, // retryConfig
    undefined, // rateLimiter
    undefined, // userPreferenceRepo
    undefined, // deduplicationStore
    undefined, // observers
    undefined, // dlqService
    undefined, // i18nService
  ] as const;

  it('should instantiate all channel-specific processors correctly', () => {
    const processors = [
      new FirebaseFcmProcessor(...mockDeps),
      new FacebookMessengerProcessor(...mockDeps),
      new WhatsAppProcessor(...mockDeps),
      new TelegramProcessor(...mockDeps),
      new DiscordProcessor(...mockDeps),
      new TeamsProcessor(...mockDeps),
      new EmailProcessor(...mockDeps),
      new SmsProcessor(...mockDeps),
      new SlackProcessor(...mockDeps),
      new WebhookProcessor(...mockDeps),
      new OneSignalProcessor(...mockDeps),
      new WebPushProcessor(...mockDeps),
      new InAppProcessor(...mockDeps),
    ];

    for (const p of processors) {
      expect(p).toBeInstanceOf(NotificationProcessor);
    }
  });
});

