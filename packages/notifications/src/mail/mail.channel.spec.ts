import { Test, TestingModule } from '@nestjs/testing';
import { EmailChannel } from './mail.channel';
import { NotificationConfigService } from '../core/config/notification.config';
import { ChannelRegistry } from '../core/registry/channel.registry';
import * as nodemailer from 'nodemailer';
import { NotificationClientError, NotificationProviderError } from '../core/errors/NotificationError';

jest.mock('nodemailer');

describe('EmailChannel', () => {
  let channel: EmailChannel;
  let configService: any;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn().mockResolvedValue({ messageId: '123' }),
    };
    (nodemailer.createTransport as jest.Mock).mockReturnValue(mockTransporter);

    configService = {
      emailSender: 'default@test.com',
      emailUser: 'test@user.com',
      emailPass: 'password',
    };


    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<EmailChannel>(EmailChannel);
    // @ts-ignore - access private initialized bot/transporter for testing
    channel.onModuleInit();
  });

  it('should be defined', () => {
    expect(channel).toBeDefined();
  });

  it('should send email using default config', async () => {
    const message = {
      recipientId: 'user@test.com',
      subject: 'Test Subject',
      body: 'Hello',
    };

    await channel.send(message);

    expect(mockTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'default@test.com',
      to: 'user@test.com',
      subject: 'Test Subject',
      text: 'Hello',
    }));
  });

  it('should support dynamic SMTP override', async () => {
    const dynamicTransporter = { sendMail: jest.fn().mockResolvedValue({}) };
    (nodemailer.createTransport as jest.Mock).mockReturnValueOnce(dynamicTransporter);

    const message = {
      recipientId: 'user@test.com',
      subject: 'Dynamic',
      body: 'Hello',
      channelOptions: {
        smtpConfig: { host: 'smtp.new.com' },
        from: 'dynamic@test.com'
      }
    };

    await channel.send(message);

    expect(nodemailer.createTransport).toHaveBeenCalledWith({ host: 'smtp.new.com' });
    expect(dynamicTransporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: 'dynamic@test.com',
    }));
  });

  it('should throw NotificationClientError on 4xx rejection', async () => {
    mockTransporter.sendMail.mockRejectedValue({ responseCode: 450, message: 'Rejected' });

    await expect(channel.send({ recipientId: 'x', subject: 's', body: 'b' }))
      .rejects.toThrow(NotificationClientError);
  });
});
