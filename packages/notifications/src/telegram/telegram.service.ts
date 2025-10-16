import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { Transactional } from "typeorm-transactional";
import { I18nService } from "nestjs-i18n";
import * as crypto from "crypto";

@Injectable()
export class TelegramService<UserEntity = any, UserResponseDto = any> {
  private userRepo: Repository<UserEntity>;
  private UserResponseClass: new (...args: any[]) => UserResponseDto;

  constructor(private readonly i18n: I18nService) {}

  setUserRepository(userRepo: Repository<UserEntity>) {
    this.userRepo = userRepo;
  }

  setUserResponseClass(
    UserResponseClass: new (...args: any[]) => UserResponseDto
  ) {
    this.UserResponseClass = UserResponseClass;
  }

  @Transactional()
  async saveTelegramLinkToken(
    userId: string,
    token: string
  ): Promise<UserResponseDto> {
    if (!this.userRepo) {
      throw new Error(
        "User repository not set. Please call setUserRepository() first."
      );
    }

    await this.userRepo.update(
      userId as any,
      { telegramLinkToken: token } as any
    );

    console.log(`DB: Saved link token '${token}' for user ID ${userId}`);

    const message = await this.i18n.t("user.TELEGRAM_SAVE");

    return new this.UserResponseClass({ data: null, message });
  }

  async findUserByTelegramLinkToken(token: string): Promise<UserEntity | null> {
    if (!this.userRepo) {
      throw new Error("User repository not set.");
    }

    return this.userRepo.findOne({
      where: { telegramLinkToken: token } as any,
    });
  }

  @Transactional()
  async updateTelegramChatId(userId: string, chatId: string): Promise<void> {
    if (!this.userRepo) {
      throw new Error("User repository not set.");
    }

    await this.userRepo.update(
      userId as any,
      {
        telegram_chat_id: chatId,
        telegramLinkToken: null,
      } as any
    );

    console.log(
      `DB: Successfully linked user ${userId} with Chat ID: ${chatId}`
    );
  }

  async generateTelegramLinkToken(user) {
    const token = crypto.randomBytes(4).toString("hex").toUpperCase();
    await this.saveTelegramLinkToken(user.id, token);
    return token;
  }
}
