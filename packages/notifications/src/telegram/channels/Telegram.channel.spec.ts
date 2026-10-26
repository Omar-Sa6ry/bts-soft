import { vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramChannel } from './Telegram.channel';
import { NotificationConfigService } from '../../core/config/notification.config';
import { ChannelRegistry } from '../../core/registry/channel.registry';
import { NotificationClientError, NotificationProviderError } from '../../core/errors/NotificationError';

const { mockTelegramBotCtor } = vi.hoisted(() => ({
  mockTelegramBotCtor: vi.fn(),
}));

vi.mock('node-telegram-bot-api', () => ({
  default: mockTelegramBotCtor,
}));

describe('TelegramChannel', () => {
  let channel: TelegramChannel;
  let configService: any;
  let mockBot: any;

  beforeEach(async () => {
    mockBot = {
      sendMessage: jest.fn().mockResolvedValue({ message_id: 123 }),
    };
    mockTelegramBotCtor.mockImplementation(function () {
      return mockBot;
    });

    configService = {
      telegramToken: 'token123',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<TelegramChannel>(TelegramChannel);
    channel.onModuleInit();
  });

  it('should send telegram message using default bot', async () => {
    await channel.send({
      recipientId: 'chat123',
      body: 'Hello',
    });

    expect(mockBot.sendMessage).toHaveBeenCalledWith('chat123', 'Hello', expect.any(Object));
  });

  it('should support dynamic bot token override', async () => {
    const dynamicBot = { sendMessage: jest.fn().mockResolvedValue({}) };
    mockTelegramBotCtor.mockImplementationOnce(function () {
      return dynamicBot;
    });

    await channel.send({
      recipientId: 'chat123',
      body: 'Override',
      channelOptions: { botToken: 'new_token' }
    });

    expect(mockTelegramBotCtor).toHaveBeenCalledWith('new_token', expect.any(Object));
    expect(dynamicBot.sendMessage).toHaveBeenCalledWith('chat123', 'Override', expect.any(Object));
  });

  it('should throw NotificationClientError on 4xx rejection', async () => {
    mockBot.sendMessage.mockRejectedValue({ response: { statusCode: 403 }, message: 'Blocked' });

    await expect(channel.send({ recipientId: 'x', body: 'b' }))
      .rejects.toThrow(NotificationClientError);
  });

  it('should throw NotificationProviderError on 5xx rejection', async () => {
    mockBot.sendMessage.mockRejectedValue({ response: { statusCode: 500 }, message: 'Server Error' });

    await expect(channel.send({ recipientId: 'x', body: 'b' }))
      .rejects.toThrow(NotificationProviderError);
  });
});
