import { Test, TestingModule } from "@nestjs/testing";
import { SmsChannel } from "./sms.channel";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { TwilioSmsProvider } from "./providers/twilio-sms.provider";
import { SmsMisrProvider } from "./providers/smsmisr.provider";

describe("SmsChannel (Orchestrator)", () => {
  let channel: SmsChannel;
  let configService: any;
  let mockTwilioProvider: any;
  let mockSmsMisrProvider: any;

  beforeEach(async () => {
    mockTwilioProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };
    mockSmsMisrProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      smsProvider: "twilio",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsChannel,
        { provide: TwilioSmsProvider, useValue: mockTwilioProvider },
        { provide: SmsMisrProvider, useValue: mockSmsMisrProvider },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<SmsChannel>(SmsChannel);
  });

  it("should route to Twilio provider by default", async () => {
    const message = { recipientId: "123", body: "test" };
    await channel.send(message);

    expect(mockTwilioProvider.send).toHaveBeenCalledWith(message);
    expect(mockSmsMisrProvider.send).not.toHaveBeenCalled();
  });

  it("should route to SmsMisr provider when default config is set to smsmisr", async () => {
    configService.smsProvider = "smsmisr";
    const message = { recipientId: "123", body: "test" };
    await channel.send(message);

    expect(mockSmsMisrProvider.send).toHaveBeenCalledWith(message);
    expect(mockTwilioProvider.send).not.toHaveBeenCalled();
  });

  it("should route to SmsMisr provider when channelOptions.provider is smsmisr", async () => {
    const message = {
      recipientId: "123",
      body: "test",
      channelOptions: { provider: "smsmisr" },
    };
    await channel.send(message);

    expect(mockSmsMisrProvider.send).toHaveBeenCalledWith(message);
    expect(mockTwilioProvider.send).not.toHaveBeenCalled();
  });

  it("should route to Twilio provider when channelOptions.provider is twilio even if default is smsmisr", async () => {
    configService.smsProvider = "smsmisr";
    const message = {
      recipientId: "123",
      body: "test",
      channelOptions: { provider: "twilio" },
    };
    await channel.send(message);

    expect(mockTwilioProvider.send).toHaveBeenCalledWith(message);
    expect(mockSmsMisrProvider.send).not.toHaveBeenCalled();
  });
});
