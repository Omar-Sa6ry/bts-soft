import { Test, TestingModule } from "@nestjs/testing";
import { DiscordChannel } from "./discord.channel";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import { HttpService } from "@nestjs/axios";
import { of, throwError } from "rxjs";
import {
  NotificationClientError,
  NotificationProviderError,
} from "../../core/errors/NotificationError";
import { ChannelType } from "../../core/enums/ChannelType.enum";

describe("DiscordChannel", () => {
  let channel: DiscordChannel;
  let configService: any;
  let httpService: any;
  let registry: any;

  beforeEach(async () => {
    httpService = {
      post: jest.fn().mockReturnValue(of({ data: { id: "discord-msg-1" } })),
    };

    configService = {
      discordWebhookUrl: "https://discord.com/api/default",
    };

    registry = {
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordChannel,
        { provide: HttpService, useValue: httpService },
        { provide: NotificationConfigService, useValue: configService },
        { provide: ChannelRegistry, useValue: registry },
      ],
    }).compile();

    channel = module.get<DiscordChannel>(DiscordChannel);
  });

  it("should register on module init", () => {
    channel.onModuleInit();
    expect(registry.register).toHaveBeenCalledWith(channel);
  });

  it("should send notification to default webhook", async () => {
    const res = await channel.send({
      recipientId: "none",
      body: "Discord Hello",
      traceparent: "tp",
      tracestate: "ts",
      correlationId: "cid",
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://discord.com/api/default",
      expect.objectContaining({ content: "Discord Hello" }),
      expect.objectContaining({ timeout: 8000 }),
    );
    expect(res.provider).toBe(ChannelType.DISCORD);
    expect(res.providerMessageId).toBe("discord-msg-1");
  });

  it("should use recipientId if it is a webhook URL", async () => {
    await channel.send({
      recipientId: "https://discord.com/api/custom-hook",
      body: "Custom Webhook",
    });

    expect(httpService.post).toHaveBeenCalledWith(
      "https://discord.com/api/custom-hook",
      expect.anything(),
      expect.anything(),
    );
  });

  it("should throw NotificationProviderError if no webhook url configured or provided", async () => {
    configService.discordWebhookUrl = undefined;
    await expect(
      channel.send({
        recipientId: "not-a-url",
        body: "Test",
      }),
    ).rejects.toThrow(NotificationProviderError);
  });

  it("should wrap 4xx errors as NotificationClientError", async () => {
    httpService.post.mockReturnValue(
      throwError(() => ({
        response: { status: 400, data: { message: "Bad Request" } },
      })),
    );

    await expect(
      channel.send({
        recipientId: "none",
        body: "Test",
      }),
    ).rejects.toThrow(NotificationClientError);
  });

  it("should wrap 5xx or connection errors as NotificationProviderError", async () => {
    httpService.post.mockReturnValue(
      throwError(() => ({
        response: { status: 500, data: { message: "Internal Error" } },
      })),
    );

    await expect(
      channel.send({
        recipientId: "none",
        body: "Test",
      }),
    ).rejects.toThrow(NotificationProviderError);
  });
});
