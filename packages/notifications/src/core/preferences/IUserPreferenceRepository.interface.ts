import { USER_PREFERENCE_REPOSITORY } from "../constants/injection-tokens.const";
import { NotificationCategory } from "../enums/NotificationCategory.enum";

export interface IUserPreferenceRepository {
  /**
   * Returns `true` if the recipient has opted out of the given channel or specific category.
   */
  isOptedOut(
    recipientId: string,
    channel: string,
    category?: NotificationCategory,
  ): Promise<boolean>;

  /**
   * Sets the opt-out preference for a recipient on a channel, optionally scoped to a category.
   * @param optOut - `true` to opt out, `false` to opt back in.
   */
  setOptOut(
    recipientId: string,
    channel: string,
    optOut: boolean,
    category?: NotificationCategory,
  ): Promise<void>;
}

export { USER_PREFERENCE_REPOSITORY };

