import { Test, TestingModule } from "@nestjs/testing";
import { PusherInAppProvider } from "./pusher-inapp.provider";
import { NotificationConfigService } from "../../core/config/notification.config";
import Pusher from "pusher";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

jest.mock("pusher", () => {
  const mockTrigger = jest.fn().mockResolvedValue({});
  const mockPusherConstructor = jest.fn().mockImplementation(() => {
    return {
      trigger: mockTrigger,
    };
  });
  return {
    __esModule: true,
    default: mockPusherConstructor,
    mockTrigger,
    mockPusherConstructor,
  };
});

const mockTrigger = (require("pusher") as any).mockTrigger;
const mockPusherConstructor = (require("pusher") as any).mockPusherConstructor;

describe("PusherInAppProvider", () => {
  let provider: PusherInAppProvider;
  let configService: any;

  beforeEach(async () => {
    mockTrigger.mockClear();
    mockTrigger.mockResolvedValue({});
    mockPusherConstructor.mockClear();

    configService = {
      pusherAppId: "app-123",
      pusherKey: "key-123",
      pusherSecret: "secret-123",
      pusherCluster: "eu",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PusherInAppProvider,
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();

    provider = module.get<PusherInAppProvider>(PusherInAppProvider);
  });

  it("should send notification successfully using default settings", async () => {
    const message = {
      recipientId: "user-channel",
      title: "New Alert",
      body: "Alert body details",
      context: { key: "value" },
    };

    await provider.send(message);

    expect(mockPusherConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: "app-123",
        key: "key-123",
        secret: "secret-123",
        cluster: "eu",
      })
    );

    expect(mockTrigger).toHaveBeenCalledWith(
      "user-channel",
      "notification",
      expect.objectContaining({
        title: "New Alert",
        body: "Alert body details",
        context: { key: "value" },
        timestamp: expect.any(String),
      })
    );
  });

  it("should support dynamic event name and payload overrides in channelOptions", async () => {
    const message = {
      recipientId: "user-channel",
      body: "Text details",
      channelOptions: {
        eventName: "custom-event",
        payload: { extraData: 42 },
      },
    };

    await provider.send(message);

    expect(mockTrigger).toHaveBeenCalledWith(
      "user-channel",
      "custom-event",
      expect.objectContaining({
        body: "Text details",
        extraData: 42,
      })
    );
  });

  it("should support dynamic credentials overrides", async () => {
    const dynamicTrigger = jest.fn().mockResolvedValue({});
    mockPusherConstructor.mockImplementationOnce(() => {
      return {
        trigger: dynamicTrigger,
      };
    });

    await provider.send({
      recipientId: "user-channel",
      body: "hi",
      channelOptions: {
        appId: "dyn-app",
        key: "dyn-key",
        secret: "dyn-secret",
        cluster: "us2",
      },
    });

    expect(mockPusherConstructor).toHaveBeenCalledWith(
      expect.objectContaining({
        appId: "dyn-app",
        key: "dyn-key",
        secret: "dyn-secret",
        cluster: "us2",
      })
    );

    expect(dynamicTrigger).toHaveBeenCalled();
  });

  it("should throw NotificationProviderError if default client is missing and no credentials provided", async () => {
    configService.pusherAppId = undefined;
    
    const brokenModule: TestingModule = await Test.createTestingModule({
      providers: [
        PusherInAppProvider,
        { provide: NotificationConfigService, useValue: configService },
      ],
    }).compile();
    const brokenProvider = brokenModule.get<PusherInAppProvider>(PusherInAppProvider);

    await expect(
      brokenProvider.send({ recipientId: "channel", body: "hi" })
    ).rejects.toThrow(NotificationProviderError);
  });

  it("should throw NotificationClientError if recipientId is missing", async () => {
    await expect(
      provider.send({ recipientId: "", body: "hi" })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError on parameter validation exceptions", async () => {
    mockTrigger.mockRejectedValue(new Error("Invalid channel name format"));

    await expect(
      provider.send({ recipientId: "user-channel", body: "hi" })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on network or auth exceptions", async () => {
    mockTrigger.mockRejectedValue(new Error("Connection timeout"));

    await expect(
      provider.send({ recipientId: "user-channel", body: "hi" })
    ).rejects.toThrow(NotificationProviderError);
  });
});
