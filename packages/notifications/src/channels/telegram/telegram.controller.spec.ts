import { Test, TestingModule } from "@nestjs/testing";
import { TelegramController } from "./telegram.controller";
import { TelegramService } from "./telegram.service";
import { NotificationService } from "../../notification.service";
import { ChannelType } from "../../core/enums/ChannelType.enum";

describe("TelegramController", () => {
  let controller: TelegramController;
  let telegramService: any;
  let notificationService: any;

  beforeEach(async () => {
    telegramService = {
      findUserByTelegramLinkToken: jest.fn(),
      updateTelegramChatId: jest.fn(),
    };
    notificationService = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TelegramController],
      providers: [
        { provide: TelegramService, useValue: telegramService },
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    controller = module.get<TelegramController>(TelegramController);
  });

  it("should respond to GET check endpoint", () => {
    const res = controller.check();
    expect(res).toEqual({ status: "OK" });
  });

  it("should ignore empty updates or messages without text", async () => {
    const resEmpty = await controller.handleWebhook({} as any);
    expect(resEmpty).toEqual({ ok: true });

    const resNoText = await controller.handleWebhook({ message: { chat: { id: 123 } } } as any);
    expect(resNoText).toEqual({ ok: true });
  });

  it("should link user on valid token", async () => {
    const mockUser = { id: "u1", firstName: "Omar" };
    telegramService.findUserByTelegramLinkToken.mockResolvedValue(mockUser);

    const update: any = {
      message: {
        chat: { id: 456 },
        text: "VALID_TOKEN",
      },
    };

    const result = await controller.handleWebhook(update);

    expect(telegramService.updateTelegramChatId).toHaveBeenCalledWith(
      "u1",
      "456",
    );
    expect(notificationService.send).toHaveBeenCalledWith(
      ChannelType.TELEGRAM,
      {
        recipientId: "456",
        body: "welcome Omar! your account is linked to Telegram.",
      },
    );
    expect(result).toEqual({ ok: true });
  });

  it("should send invalid code message if token does not match any user", async () => {
    telegramService.findUserByTelegramLinkToken.mockResolvedValue(null);

    const update: any = {
      message: {
        chat: { id: 999 },
        text: "INVALID_TOKEN",
      },
    };

    const result = await controller.handleWebhook(update);

    expect(telegramService.updateTelegramChatId).not.toHaveBeenCalled();
    expect(notificationService.send).toHaveBeenCalledWith(
      ChannelType.TELEGRAM,
      {
        recipientId: "999",
        body: "invalid Code",
      },
    );
    expect(result).toEqual({ ok: true });
  });
});
