import { Test, TestingModule } from "@nestjs/testing";
import { InAppChannel } from "./inapp.channel";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { PusherInAppProvider } from "./providers/pusher-inapp.provider";

describe("InAppChannel", () => {
  let channel: InAppChannel;
  let configService: any;
  let mockPusherProvider: any;

  beforeEach(async () => {
    mockPusherProvider = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    configService = {
      inAppProvider: "pusher",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InAppChannel,
        { provide: PusherInAppProvider, useValue: mockPusherProvider },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<InAppChannel>(InAppChannel);
  });

  it("should be defined", () => {
    expect(channel).toBeDefined();
  });

  it("should route to PusherInAppProvider by default", async () => {
    const message = {
      recipientId: "channel-123",
      body: "Hello realtime",
    };

    await channel.send(message);

    expect(mockPusherProvider.send).toHaveBeenCalledWith(message);
  });

  it("should route to PusherInAppProvider when overridden in channelOptions", async () => {
    configService.inAppProvider = "something-else";
    const message = {
      recipientId: "channel-123",
      body: "Hello realtime",
      channelOptions: { provider: "pusher" },
    };

    await channel.send(message);

    expect(mockPusherProvider.send).toHaveBeenCalledWith(message);
  });
});
