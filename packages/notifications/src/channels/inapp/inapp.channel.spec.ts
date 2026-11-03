import { describe, it, expect, vi, beforeEach } from "vitest";
import { InAppChannel } from "./inapp.channel";
import { ChannelType } from "../../core/enums/ChannelType.enum";

describe("InAppChannel", () => {
  let channel: InAppChannel;
  let mockConfigService: any;
  let mockRegistry: any;
  let mockPusherProvider: any;

  beforeEach(() => {
    mockConfigService = { inAppProvider: "pusher" };
    mockRegistry = { register: vi.fn() };
    mockPusherProvider = { send: vi.fn().mockResolvedValue({ provider: "pusher", dispatchedAt: new Date() }) };

    channel = new InAppChannel(mockConfigService, mockRegistry, mockPusherProvider);
  });

  it("should register on module init", () => {
    channel.onModuleInit();
    expect(mockRegistry.register).toHaveBeenCalledWith(channel);
  });

  it("should send message via pusher provider", async () => {
    const res = await channel.send({
      recipientId: "user-1",
      body: "In-App alert",
    });

    expect(mockPusherProvider.send).toHaveBeenCalled();
    expect(res.provider).toBe("pusher");
  });

  it("should handle null return from provider and return fallback result", async () => {
    mockPusherProvider.send.mockResolvedValueOnce(null);
    const res = await channel.send({
      recipientId: "user-1",
      body: "In-App alert",
      channelOptions: { provider: "custom-provider" },
    });

    expect(res.provider).toBe("custom-provider");
    expect(res.dispatchedAt).toBeInstanceOf(Date);
  });
});
