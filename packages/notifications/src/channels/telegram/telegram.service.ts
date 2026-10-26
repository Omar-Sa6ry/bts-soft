import { Injectable, Inject, Optional } from "@nestjs/common";
import { I18nService } from "nestjs-i18n";
import * as crypto from "crypto";
import { ITelegramUserRepository, TELEGRAM_USER_REPOSITORY } from "./interfaces/telegram-user-repository.interface";

@Injectable()
export class TelegramService<UserEntity = any, UserResponseDto = any> {
  private UserResponseClass: new (...args: any[]) => UserResponseDto;

  constructor(
    private readonly i18n: I18nService,
    @Optional() @Inject(TELEGRAM_USER_REPOSITORY) private userRepo: ITelegramUserRepository<UserEntity>
  ) {}

  /**
   * Manually set the repository if not injected via DI.
   */
  setUserRepository(userRepo: ITelegramUserRepository<UserEntity>) {
    this.userRepo = userRepo;
  }

  setUserResponseClass(
    UserResponseClass: new (...args: any[]) => UserResponseDto
  ) {
    this.UserResponseClass = UserResponseClass;
  }

  async saveTelegramLinkToken(
    userId: string,
    token: string
  ): Promise<UserResponseDto> {
    if (!this.userRepo) {
      throw new Error(
        "User repository not set. Please provide an implementation of ITelegramUserRepository."
      );
    }

    await this.userRepo.update(userId, { 
      telegramLinkToken: token 
    } as any);

    console.log(`DB: Saved link token '${token}' for user ID ${userId}`);

    const message = await this.i18n.t("user.TELEGRAM_SAVE");

    return new this.UserResponseClass({ data: null, message });
  }

  async findUserByTelegramLinkToken(token: string): Promise<UserEntity | null> {
    if (!this.userRepo) {
      throw new Error("User repository not set.");
    }

    return this.userRepo.findByLinkToken(token);
  }

  async updateTelegramChatId(userId: string, chatId: string): Promise<void> {
    if (!this.userRepo) {
      throw new Error("User repository not set.");
    }

    await this.userRepo.update(userId, {
      telegram_chat_id: chatId,
      telegramLinkToken: null,
    } as any);

    console.log(
      `DB: Successfully linked user ${userId} with Chat ID: ${chatId}`
    );
  }

  async generateTelegramLinkToken(user: any) {
    const token = crypto.randomBytes(4).toString("hex").toUpperCase();
    await this.saveTelegramLinkToken(user.id, token);
    return token;
  }
}
