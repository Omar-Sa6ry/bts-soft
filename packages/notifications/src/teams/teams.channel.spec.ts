import { Test, TestingModule } from '@nestjs/testing';
import { TeamsChannel } from './teams.channel';
import { NotificationConfigService } from '../core/config/notification.config';
import { ChannelRegistry } from '../core/registry/channel.registry';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { NotificationClientError, NotificationProviderError } from '../core/errors/NotificationError';


describe('TeamsChannel', () => {
  let channel: TeamsChannel;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: {} })),
    };

    configService = {
      teamsWebhookUrl: 'https://teams.com/api/default',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsChannel,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<TeamsChannel>(TeamsChannel);
  });

  it('should send Teams notification to default webhook', async () => {
    await channel.send({
      recipientId: 'none',
      body: 'Teams Hello',
    });

    expect(httpService.post).toHaveBeenCalledWith(
      'https://teams.com/api/default',
      expect.objectContaining({ text: 'Teams Hello' })
    );
  });

  it('should override webhookUrl if provided in channelOptions', async () => {
    await channel.send({
      recipientId: 'none',
      body: 'Override',
      channelOptions: { webhookUrl: 'https://teams.com/api/dynamic' }
    });

    expect(httpService.post).toHaveBeenCalledWith(
      'https://teams.com/api/dynamic',
      expect.any(Object)
    );
  });

  it('should throw NotificationProviderError if webhookUrl is missing', async () => {
    configService.teamsWebhookUrl = undefined;
    await expect(channel.send({ recipientId: 'n', body: 'b' }))
      .rejects.toThrow('Teams Webhook URL is not configured');
  });

  it('should throw NotificationClientError on 4xx response', async () => {
    const error: any = { response: { status: 400, data: 'Bad Request' } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error)
    });

    await expect(channel.send({ recipientId: 'n', body: 'b' }))
      .rejects.toThrow(NotificationClientError);
  });
});

