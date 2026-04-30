import { Test, TestingModule } from '@nestjs/testing';
import { FacebookMessengerChannel } from './messenger.channel';
import { NotificationConfigService } from '../core/config/notification.config';
import { ChannelRegistry } from '../core/registry/channel.registry';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { NotificationClientError } from '../core/errors/NotificationError';

describe('FacebookMessengerChannel', () => {
  let channel: FacebookMessengerChannel;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: {} })),
    };

    configService = {
      facebookPageAccessToken: 'token123',
      facebookGraphApiVersion: 'v18.0',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacebookMessengerChannel,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<FacebookMessengerChannel>(FacebookMessengerChannel);
  });

  it('should send Facebook Messenger notification', async () => {
    await channel.send({
      recipientId: 'psid_123',
      body: 'Messenger Hello',
    });

    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('v18.0'),
      expect.objectContaining({
        recipient: { id: 'psid_123' },
        message: { text: 'Messenger Hello' }
      })
    );
  });

  it('should include access_token in the URL', async () => {
    await channel.send({
      recipientId: 'psid_123',
      body: 'Messenger Hello',
    });

    expect(httpService.post).toHaveBeenCalledWith(
      expect.stringContaining('access_token=token123'),
      expect.any(Object)
    );
  });

  it('should throw NotificationProviderError if access token is missing', async () => {
    configService.facebookPageAccessToken = undefined;
    await expect(channel.send({ recipientId: 'psid', body: 'b' }))
      .rejects.toThrow('Facebook Page Access Token is missing');
  });


  it('should throw NotificationClientError on 4xx response', async () => {
    const error: any = { response: { status: 401, data: { error: { message: 'Invalid token' } } } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error)
    });

    await expect(channel.send({ recipientId: 'p', body: 'b' }))
      .rejects.toThrow(NotificationClientError);
  });
});

