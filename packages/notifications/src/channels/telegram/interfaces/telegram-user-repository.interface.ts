/**
 * Abstract interface for Telegram user data management.
 * Implement this in your application using your preferred ORM (TypeORM, Prisma, etc.)
 * and inject it into the TelegramService.
 */
export abstract class ITelegramUserRepository<UserEntity = any> {
  /**
   * Updates a user by their ID with the given data.
   */
  abstract update(userId: string, data: Partial<UserEntity>): Promise<void>;

  /**
   * Finds a user by their unique Telegram link token.
   */
  abstract findByLinkToken(token: string): Promise<UserEntity | null>;
}

export const TELEGRAM_USER_REPOSITORY = Symbol('TELEGRAM_USER_REPOSITORY');
