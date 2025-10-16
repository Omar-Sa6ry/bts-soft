import { TelegramService } from "./telegram.service";
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
} from "@nestjs/common";
import { TelegramWebhookDto } from "./dto/Telegram-webhook.dto";
import { ChannelType } from "../core/models/ChannelType.const";
import { NotificationService } from "../notification.service";
console.log(`Telegram account linked successfully for user .`);

@Controller("telegram/webhook")
export class TelegramController {
  constructor(
    private readonly telegramService: TelegramService,
    private readonly notificationService: NotificationService
  ) {}

  @Get()
  check() {
    console.log("Webhook endpoint is reachable via GET.");
    return { status: "OK" };
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() update: TelegramWebhookDto) {
    console.log(`Telegram account linked successfully for user .`);
    if (!update.message || !update.message.text) {
      return { ok: true };
    }

    const telegramChatId = update.message.chat.id.toString();
    const receivedToken = update.message.text.trim().toUpperCase();

    const user = await this.telegramService.findUserByTelegramLinkToken(
      receivedToken
    );

    if (user) {
      await this.telegramService.updateTelegramChatId(user.id, telegramChatId);
      await this.notificationService.send(ChannelType.TELEGRAM, {
        recipientId: telegramChatId,
        body: `welcome ${user.firstName}! your account is linked to Telegram.`,
      });

      console.log(`Telegram account linked successfully for user ${user.id}.`);
    } else {
      await this.notificationService.send(ChannelType.TELEGRAM, {
        recipientId: telegramChatId,
        body: "invalid Code",
      });
    }

    return { ok: true };
  }
}
