import { Test, TestingModule } from "@nestjs/testing";
import { SlackChannel } from "./slack.channel";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { HttpService } from "@nestjs/axios";
import { of } from "rxjs";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";

describe("SlackChannel", () => {
  let channel: SlackChannel;
  let configService: any;
  let httpService: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: { ok: true } })),
    };

    configService = {
      slackWebhookUrl: "https://hooks.slack.com/services/default-webhook",
      slackBotToken: undefined,
      slackDefaultChannel: undefined,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlackChannel,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: { register: jest.fn() } },
      ],
    }).compile();

    channel = module.get<SlackChannel>(SlackChannel);
  });

  describe("Webhook Flow", () => {
    it("should send notification using default webhook URL", async () => {
      await channel.send({
        recipientId: "default",
        body: "Hello Webhook",
      });

      expect(httpService.post).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/default-webhook",
        expect.objectContaining({ text: "Hello Webhook" })
      );
    });

    it("should override webhook URL if recipientId is a valid URL", async () => {
      await channel.send({
        recipientId: "https://hooks.slack.com/services/recipient-webhook",
        body: "Hello Recipient",
      });

      expect(httpService.post).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/recipient-webhook",
        expect.objectContaining({ text: "Hello Recipient" })
      );
    });

    it("should override webhook URL if channelOptions.webhookUrl is provided", async () => {
      await channel.send({
        recipientId: "default",
        body: "Hello Override",
        channelOptions: { webhookUrl: "https://hooks.slack.com/services/option-webhook" },
      });

      expect(httpService.post).toHaveBeenCalledWith(
        "https://hooks.slack.com/services/option-webhook",
        expect.objectContaining({ text: "Hello Override" })
      );
    });

    it("should format text with title if provided", async () => {
      await channel.send({
        recipientId: "default",
        title: "Test Title",
        body: "Hello Body",
      });

      expect(httpService.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ text: "*Test Title*\nHello Body" })
      );
    });
  });

  describe("Web API Flow", () => {
    beforeEach(() => {
      configService.slackWebhookUrl = undefined;
      configService.slackBotToken = "xoxb-test-token";
      configService.slackDefaultChannel = "#alerts";
    });

    it("should send notification to specified recipientId channel using Web API", async () => {
      await channel.send({
        recipientId: "#general",
        body: "Hello Web API",
      });

      expect(httpService.post).toHaveBeenCalledWith(
        "https://slack.com/api/chat.postMessage",
        expect.objectContaining({ channel: "#general", text: "Hello Web API" }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer xoxb-test-token",
          }),
        })
      );
    });

    it("should use default channel if recipientId is not a valid channel and options do not override it", async () => {
      await channel.send({
        recipientId: "default",
        body: "Hello Default Channel",
      });

      expect(httpService.post).toHaveBeenCalledWith(
        "https://slack.com/api/chat.postMessage",
        expect.objectContaining({ channel: "#alerts" }),
        expect.any(Object)
      );
    });

    it("should throw NotificationClientError if channel is not provided", async () => {
      configService.slackDefaultChannel = undefined;
      await expect(
        channel.send({
          recipientId: "",
          body: "No Channel",
        })
      ).rejects.toThrow(NotificationClientError);
    });

    it("should throw NotificationClientError if Slack API returns ok: false with client error", async () => {
      httpService.post.mockReturnValue(
        of({ data: { ok: false, error: "channel_not_found" } })
      );

      await expect(
        channel.send({
          recipientId: "#invalid",
          body: "Fail test",
        })
      ).rejects.toThrow(NotificationClientError);
    });

    it("should throw NotificationProviderError if Slack API returns ok: false with provider/other error", async () => {
      httpService.post.mockReturnValue(
        of({ data: { ok: false, error: "rate_limited" } })
      );

      await expect(
        channel.send({
          recipientId: "#general",
          body: "Fail test",
        })
      ).rejects.toThrow(NotificationProviderError);
    });
  });

  describe("Error Handling", () => {
    it("should throw NotificationProviderError if neither Webhook nor Token is configured", async () => {
      configService.slackWebhookUrl = undefined;
      configService.slackBotToken = undefined;

      await expect(
        channel.send({
          recipientId: "test",
          body: "No config",
        })
      ).rejects.toThrow(NotificationProviderError);
    });

    it("should throw NotificationClientError on HTTP 4xx response", async () => {
      const error: any = { response: { status: 400, data: "Bad Request" } };
      httpService.post.mockReturnValue({
        toPromise: () => Promise.reject(error),
        subscribe: (obs: any) => obs.error(error),
      });

      await expect(
        channel.send({
          recipientId: "default",
          body: "Test HTTP Error",
        })
      ).rejects.toThrow(NotificationClientError);
    });

    it("should throw NotificationProviderError on HTTP 5xx response", async () => {
      const error: any = { response: { status: 502, data: "Bad Gateway" } };
      httpService.post.mockReturnValue({
        toPromise: () => Promise.reject(error),
        subscribe: (obs: any) => obs.error(error),
      });

      await expect(
        channel.send({
          recipientId: "default",
          body: "Test HTTP Error",
        })
      ).rejects.toThrow(NotificationProviderError);
    });
  });
});
