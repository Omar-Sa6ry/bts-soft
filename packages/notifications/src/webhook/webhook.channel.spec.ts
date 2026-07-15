import { Test, TestingModule } from "@nestjs/testing";
import { WebhookChannel } from "./webhook.channel";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import * as crypto from "crypto";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";

describe("WebhookChannel", () => {
  let channel: WebhookChannel;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: {} })),
    };

    configService = {
      webhookDefaultSigningSecret: undefined,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookChannel,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<WebhookChannel>(WebhookChannel);
  });

  it("should throw NotificationClientError if recipientId is not a valid URL", async () => {
    await expect(
      channel.send({
        recipientId: "invalid-url",
        body: "Hello Webhook",
      })
    ).rejects.toThrow("Webhook recipientId must be a valid HTTP or HTTPS URL.");

    expect(httpService.post).not.toHaveBeenCalled();
  });

  it("should send POST request to the recipientId URL with correct structured payload", async () => {
    const targetUrl = "https://my-api.com/webhook-receiver";
    await channel.send({
      recipientId: targetUrl,
      body: "Action required",
      title: "Title Here",
      subject: "Subject Here",
      context: { orderId: 123 },
    });

    expect(httpService.post).toHaveBeenCalledWith(
      targetUrl,
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );

    const calledBody = JSON.parse(httpService.post.mock.calls[0][1]);
    expect(calledBody.event).toBe("notification.sent");
    expect(calledBody.timestamp).toBeDefined();
    expect(calledBody.data).toEqual({
      recipientId: targetUrl,
      body: "Action required",
      title: "Title Here",
      subject: "Subject Here",
      context: { orderId: 123 },
    });
  });

  it("should generate X-Webhook-Signature header when default signing secret is set", async () => {
    const secret = "default-secret-key";
    configService.webhookDefaultSigningSecret = secret;

    const targetUrl = "https://my-api.com/webhook-receiver";
    await channel.send({
      recipientId: targetUrl,
      body: "Action required",
    });

    const calls = httpService.post.mock.calls[0];
    const payloadString = calls[1];
    const headers = calls[2].headers;

    const expectedHmac = crypto.createHmac("sha256", secret).update(payloadString).digest("hex");
    expect(headers["X-Webhook-Signature"]).toBe(expectedHmac);
  });

  it("should override signing secret if provided in channelOptions", async () => {
    const defaultSecret = "default-secret-key";
    const customSecret = "custom-secret-key";
    configService.webhookDefaultSigningSecret = defaultSecret;

    const targetUrl = "https://my-api.com/webhook-receiver";
    await channel.send({
      recipientId: targetUrl,
      body: "Action required",
      channelOptions: { signingSecret: customSecret },
    });

    const calls = httpService.post.mock.calls[0];
    const payloadString = calls[1];
    const headers = calls[2].headers;

    const expectedHmac = crypto.createHmac("sha256", customSecret).update(payloadString).digest("hex");
    expect(headers["X-Webhook-Signature"]).toBe(expectedHmac);
  });

  it("should allow overriding the webhook event name in options", async () => {
    const targetUrl = "https://my-api.com/webhook-receiver";
    await channel.send({
      recipientId: targetUrl,
      body: "Body",
      channelOptions: { event: "user.created" },
    });

    const calledBody = JSON.parse(httpService.post.mock.calls[0][1]);
    expect(calledBody.event).toBe("user.created");
  });

  it("should throw NotificationClientError on HTTP 4xx response", async () => {
    const error: any = { response: { status: 404, data: "Not Found" } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error),
    });

    await expect(
      channel.send({
        recipientId: "https://my-api.com/webhook-receiver",
        body: "HTTP 404 test",
      })
    ).rejects.toThrow(NotificationClientError);
  });

  it("should throw NotificationProviderError on HTTP 5xx response", async () => {
    const error: any = { response: { status: 500, data: "Server Error" } };
    httpService.post.mockReturnValue({
      toPromise: () => Promise.reject(error),
      subscribe: (obs: any) => obs.error(error),
    });

    await expect(
      channel.send({
        recipientId: "https://my-api.com/webhook-receiver",
        body: "HTTP 500 test",
      })
    ).rejects.toThrow(NotificationProviderError);
  });
});
