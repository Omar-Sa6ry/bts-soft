import { Test, TestingModule } from '@nestjs/testing';
import { DiscordChannel } from './discord.channel';
import { NotificationConfigService } from '../core/config/notification.config';
import { ChannelRegistry } from '../core/registry/channel.registry';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { NotificationClientError, NotificationProviderError } from '../core/errors/NotificationError';

describe('DiscordChannel', () => {
  let channel: DiscordChannel;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: {} })),
    };

    configService = {
      discordWebhookUrl: 'https://discord.com/api/default',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordChannel,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<DiscordChannel>(DiscordChannel);
  });

  it('should send notification to default webhook', async () => {
    await channel.send({
      recipientId: 'none',
      body: 'Discord Hello',
    });

    expect(httpService.post).toHaveBeenCalledWith(
      'https://discord.com/api/default',
      expect.objectContaining({ content: 'Discord Hello' })
    );
  });

  it('should override webhookUrl if provided in channelOptions', async () => {
    await channel.send({
      recipientId: 'none',
      body: 'Override',
      channelOptions: { webhookUrl: 'https://discord.com/api/dynamic' }
    });

    expect(httpService.post).toHaveBeenCalledWith(
      'https://discord.com/api/dynamic',
      expect.any(Object)
    );
  });

  it('should throw NotificationProviderError if webhookUrl is missing', async () => {
    configService.discordWebhookUrl = undefined;
    await expect(channel.send({ recipientId: 'n', body: 'b' }))
      .rejects.toThrow('Discord Webhook URL is not configured');
  });

  it('should throw NotificationClientError on 4xx response', async () => {
    const error: any = { response: { status: 403, data: 'Forbidden' } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error)
    });

    await expect(channel.send({ recipientId: 'n', body: 'b' }))
      .rejects.toThrow(NotificationClientError);
  });

  it('should throw NotificationProviderError on 5xx response', async () => {
    const error: any = { response: { status: 500, data: 'Server Error' } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error)
    });

    await expect(channel.send({ recipientId: 'n', body: 'b' }))
      .rejects.toThrow(NotificationProviderError);
  });
});

