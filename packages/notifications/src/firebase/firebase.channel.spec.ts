import { Test, TestingModule } from '@nestjs/testing';
import { FirebaseChannel } from './firebase.channel';
import { NotificationConfigService } from '../core/config/notification.config';
import { ChannelRegistry } from '../core/registry/channel.registry';
import * as admin from 'firebase-admin';
import { NotificationClientError, NotificationProviderError } from '../core/errors/NotificationError';

jest.mock('firebase-admin', () => {
  const mockMessaging = {
    send: jest.fn().mockResolvedValue('msg_123'),
  };
  return {
    apps: [],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn(),
    },
    messaging: jest.fn(() => mockMessaging),
  };
});

describe('FirebaseChannel', () => {
  let channel: FirebaseChannel;
  let configService: any;

  beforeEach(async () => {
    configService = {
      firebaseServiceAccountPath: '/path/to/cert.json',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FirebaseChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<FirebaseChannel>(FirebaseChannel);
    channel.onModuleInit();
  });

  it('should send FCM notification', async () => {
    const message = {
      recipientId: 'token_123',
      title: 'Title',
      body: 'Body',
    };

    await channel.send(message);

    expect(admin.messaging().send).toHaveBeenCalledWith(expect.objectContaining({
      token: 'token_123',
      notification: { title: 'Title', body: 'Body' },
    }));
  });

  it('should throw NotificationClientError on invalid token code', async () => {
    (admin.messaging().send as jest.Mock).mockRejectedValueOnce({
      code: 'messaging/invalid-registration-token',
      message: 'Invalid token',
    });

    await expect(channel.send({ recipientId: 'x', body: 'b' }))
      .rejects.toThrow(NotificationClientError);
  });

  it('should throw NotificationProviderError on internal error code', async () => {
    (admin.messaging().send as jest.Mock).mockRejectedValueOnce({
      code: 'messaging/internal-error',
      message: 'Server fail',
    });

    await expect(channel.send({ recipientId: 'x', body: 'b' }))
      .rejects.toThrow(NotificationProviderError);
  });
});
