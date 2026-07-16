import { Test, TestingModule } from "@nestjs/testing";
import { WebPushChannel } from "./webpush.channel";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";
import * as webpush from "web-push";

jest.mock("web-push");

describe("WebPushChannel", () => {
  let channel: WebPushChannel;
  let configService: any;
  const mockSubscription = {
    endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
    keys: {
      p256dh: "test-p256dh-key",
      auth: "test-auth-key",
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    configService = {
      webPushPublicKey: "test-public-key",
      webPushPrivateKey: "test-private-key",
      webPushSubject: "mailto:test@example.com",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebPushChannel,
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<WebPushChannel>(WebPushChannel);
  });

  it("should send a web push notification successfully with default config and JSON recipientId", async () => {
    (webpush.sendNotification as jest.Mock).mockResolvedValue({});

    await channel.send({
      recipientId: JSON.stringify(mockSubscription),
      title: "Hello Title",
      body: "Hello Body",
    });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: mockSubscription.endpoint,
        keys: expect.objectContaining({
          p256dh: mockSubscription.keys.p256dh,
          auth: mockSubscription.keys.auth,
        }),
      }),
      JSON.stringify({ title: "Hello Title", body: "Hello Body" }),
      expect.objectContaining({
        vapidDetails: {
          subject: "mailto:test@example.com",
          publicKey: "test-public-key",
          privateKey: "test-private-key",
        },
      })
    );
  });

  it("should send a web push notification using channelOptions.subscription when recipientId is default", async () => {
    (webpush.sendNotification as jest.Mock).mockResolvedValue({});

    await channel.send({
      recipientId: "default",
      title: "Hello Title",
      body: "Hello Body",
      channelOptions: {
        subscription: mockSubscription,
      },
    });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: mockSubscription.endpoint }),
      expect.any(String),
      expect.any(Object)
    );
  });

  it("should override VAPID credentials and TTL via channelOptions", async () => {
    (webpush.sendNotification as jest.Mock).mockResolvedValue({});

    await channel.send({
      recipientId: JSON.stringify(mockSubscription),
      title: "Override Title",
      body: "Override Body",
      channelOptions: {
        ttl: 3600,
        headers: { "X-Test": "Value" },
        vapidDetails: {
          publicKey: "opt-public-key",
          privateKey: "opt-private-key",
          subject: "mailto:override@example.com",
        },
      },
    });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      expect.any(Object),
      JSON.stringify({ title: "Override Title", body: "Override Body" }),
      expect.objectContaining({
        TTL: 3600,
        headers: { "X-Test": "Value" },
        vapidDetails: {
          subject: "mailto:override@example.com",
          publicKey: "opt-public-key",
          privateKey: "opt-private-key",
        },
      })
    );
  });

  it("should merge custom properties in payload from channelOptions", async () => {
    (webpush.sendNotification as jest.Mock).mockResolvedValue({});

    await channel.send({
      recipientId: JSON.stringify(mockSubscription),
      title: "Custom Payloads",
      body: "Check options",
      channelOptions: {
        icon: "/icon.png",
        badge: "/badge.png",
        data: { url: "https://example.com" },
      },
    });

    expect(webpush.sendNotification).toHaveBeenCalledWith(
      expect.any(Object),
      JSON.stringify({
        title: "Custom Payloads",
        body: "Check options",
        icon: "/icon.png",
        badge: "/badge.png",
        data: { url: "https://example.com" },
      }),
      expect.any(Object)
    );
  });

  it("should throw NotificationClientError if subscription is missing", async () => {
    await expect(
      channel.send({
        recipientId: "invalid-json",
        body: "No subscription",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError if subscription properties are missing", async () => {
    const invalidSub = { endpoint: "http://endpoint" };
    await expect(
      channel.send({
        recipientId: JSON.stringify(invalidSub),
        body: "Invalid sub keys",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError if VAPID credentials are not configured", async () => {
    configService.webPushPublicKey = undefined;

    await expect(
      channel.send({
        recipientId: JSON.stringify(mockSubscription),
        body: "Missing config",
      })
    ).rejects.toThrow(NotificationProviderError);
  });

  it("should throw NotificationClientError when web-push responds with 410 Gone", async () => {
    const error: any = new Error("Subscription no longer active");
    error.statusCode = 410;
    (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

    await expect(
      channel.send({
        recipientId: JSON.stringify(mockSubscription),
        body: "Status 410",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationClientError when web-push responds with 404 Not Found", async () => {
    const error: any = new Error("Not Found");
    error.statusCode = 404;
    (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

    await expect(
      channel.send({
        recipientId: JSON.stringify(mockSubscription),
        body: "Status 404",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError when web-push responds with 500 error", async () => {
    const error: any = new Error("Internal Server Error");
    error.statusCode = 500;
    (webpush.sendNotification as jest.Mock).mockRejectedValue(error);

    await expect(
      channel.send({
        recipientId: JSON.stringify(mockSubscription),
        body: "Status 500",
      })
    ).rejects.toThrow(NotificationProviderError);
  });
});
