import { Test, TestingModule } from "@nestjs/testing";
import { EmailChannel } from "./mail.channel";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NodemailerMailProvider } from "./providers/nodemailer.provider";
import { TwilioMailProvider } from "./providers/twilio-mail.provider";

describe("EmailChannel", () => {
  let channel: EmailChannel;
  let configService: any;
  let nodemailerProvider: any;
  let twilioProvider: any;

  beforeEach(async () => {
    nodemailerProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    twilioProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      emailSender: "default@test.com",
      emailProvider: "nodemailer",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
        { provide: NodemailerMailProvider, useValue: nodemailerProvider },
        { provide: TwilioMailProvider, useValue: twilioProvider },
      ],
    }).compile();

    channel = module.get<EmailChannel>(EmailChannel);
  });

  it("should be defined", () => {
    expect(channel).toBeDefined();
  });

  it("should route to NodemailerMailProvider by default", async () => {
    const message = {
      recipientId: "user@test.com",
      subject: "Test Subject",
      body: "Hello",
    };

    await channel.send(message);

    expect(nodemailerProvider.send).toHaveBeenCalledWith(message, "default@test.com");
    expect(twilioProvider.send).not.toHaveBeenCalled();
  });

  it("should route to TwilioMailProvider if global config is set to twilio", async () => {
    configService.emailProvider = "twilio";
    const message = {
      recipientId: "user@test.com",
      subject: "Test Subject",
      body: "Hello",
    };

    await channel.send(message);

    expect(twilioProvider.send).toHaveBeenCalledWith(message, "default@test.com");
    expect(nodemailerProvider.send).not.toHaveBeenCalled();
  });

  it("should route to TwilioMailProvider if provider is overridden in channelOptions", async () => {
    const message = {
      recipientId: "user@test.com",
      subject: "Test Subject",
      body: "Hello",
      channelOptions: { provider: "twilio" },
    };

    await channel.send(message);

    expect(twilioProvider.send).toHaveBeenCalledWith(message, "default@test.com");
    expect(nodemailerProvider.send).not.toHaveBeenCalled();
  });
});
