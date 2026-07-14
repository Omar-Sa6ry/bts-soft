import { USER_PREFERENCE_REPOSITORY } from "../constants/injection-tokens.const";

export interface IUserPreferenceRepository {
  /**
   * Returns `true` if the recipient has opted out of the given channel.
   */
  isOptedOut(recipientId: string, channel: string): Promise<boolean>;

  /**
   * Sets the opt-out preference for a recipient on a channel.
   * @param optOut - `true` to opt out, `false` to opt back in.
   */
  setOptOut(recipientId: string, channel: string, optOut: boolean): Promise<void>;
}

export { USER_PREFERENCE_REPOSITORY };
