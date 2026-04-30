import { Test, TestingModule } from '@nestjs/testing';
import { SmsChannel } from './sms.channel';
import { NotificationConfigService } from '../core/config/notification.config';
import { ChannelRegistry } from '../core/registry/channel.registry';
import { Twilio } from 'twilio';
import { NotificationClientError, NotificationProviderError } from '../core/errors/NotificationError';


jest.mock('twilio');

describe('SmsChannel', () => {
  let channel: SmsChannel;
  let configService: any;
  let mockTwilioClient: any;

  beforeEach(async () => {
    mockTwilioClient = {
      messages: {
        create: jest.fn().mockResolvedValue({ sid: 'SM123' }),
      },
    };
    (Twilio as unknown as jest.Mock).mockReturnValue(mockTwilioClient);

    configService = {
      twilioAccountSid: 'AC123',
      twilioAuthToken: 'token123',
      twilioSmsNumber: '+1234567890',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<SmsChannel>(SmsChannel);
    channel.onModuleInit();
  });

  it('should send SMS with default number', async () => {
    const message = {
      recipientId: '987654321',
      body: 'SMS Test',
    };

    await channel.send(message);

    expect(mockTwilioClient.messages.create).toHaveBeenCalledWith(expect.objectContaining({
      from: '+1234567890',
      to: '+987654321',
      body: 'SMS Test',
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
      from: '+999',
    }));
  });

  it('should throw NotificationProviderError if client is not initialized', async () => {
    configService.twilioAccountSid = undefined;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();
    const brokenChannel = module.get<SmsChannel>(SmsChannel);
    brokenChannel.onModuleInit();

    await expect(brokenChannel.send({ recipientId: '123', body: 'hi' }))
      .rejects.toThrow('Twilio client is not initialized');
  });

  it('should throw NotificationClientError on 4xx status', async () => {
    mockTwilioClient.messages.create.mockRejectedValue({ status: 401, message: 'Unauthorized' });
    await expect(channel.send({ recipientId: '123', body: 'hi' }))
      .rejects.toThrow(NotificationClientError);
  });
});

