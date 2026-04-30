import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppChannel } from './whatsapp.channel';
import { NotificationConfigService } from '../../core/config/notification.config';
import { ChannelRegistry } from '../../core/registry/channel.registry';
import { Twilio } from 'twilio';
import { NotificationClientError, NotificationProviderError } from '../../core/errors/NotificationError';

jest.mock('twilio');

describe('WhatsAppChannel', () => {
  let channel: WhatsAppChannel;
  let configService: any;
  let mockTwilioClient: any;

  beforeEach(async () => {
    mockTwilioClient = {
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'WA123' }),
      },
    };
    (Twilio as unknown as jest.Mock).mockReturnValue(mockTwilioClient);

    configService = {
      twilioAccountSid: 'AC123',
      twilioAuthToken: 'token123',
      twilioWhatsappNumber: '+1234567890',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsAppChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<WhatsAppChannel>(WhatsAppChannel);
    channel.onModuleInit();
  });

  it('should send WhatsApp with default number and formatted "whatsapp:" prefix', async () => {
    const message = {
      recipientId: '987654321',
      body: 'WA Test',
    };

    await channel.send(message);

    expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(expect.objectContaining({
      from: 'whatsapp:+1234567890',
      to: 'whatsapp:+987654321',
      body: 'WA Test',
    }));
  });

  it('should support dynamic credentials and from number', async () => {
    const dynamicClient = { messages: { create: jest.fn().mockResolvedValue({}) } };
    (Twilio as unknown as jest.Mock).mockReturnValueOnce(dynamicClient);

    await channel.send({
      recipientId: '123',
      body: 'hi',
      channelOptions: {
        accountSid: 'NEW_SID',
        authToken: 'NEW_TOKEN',
        from: '+999'
      }
    });

    expect(Twilio).toHaveBeenCalledWith('NEW_SID', 'NEW_TOKEN');
    expect(dynamicClient.messages.create).toHaveBeenCalledWith(expect.objectContaining({
      from: 'whatsapp:+999',
    }));
  });

  it('should throw NotificationClientError on 400 rejection', async () => {
    mockTwilioClient.messages.create.mockRejectedValue({ status: 400, message: 'Invalid Number' });

    await expect(channel.send({ recipientId: 'x', body: 'b' }))
      .rejects.toThrow(NotificationClientError);
  });

  it('should throw NotificationProviderError on 500 rejection', async () => {
    mockTwilioClient.messages.create.mockRejectedValue({ status: 500, message: 'Server Error' });

    await expect(channel.send({ recipientId: 'x', body: 'b' }))
      .rejects.toThrow(NotificationProviderError);
  });
});
