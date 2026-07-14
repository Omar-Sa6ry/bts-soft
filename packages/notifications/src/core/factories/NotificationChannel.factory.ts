import { Injectable } from "@nestjs/common";
import { INotificationChannel } from "../../core/interfaces/INotificationChannel.interface";
import { ChannelType } from "../enums/ChannelType.enum";
import { ChannelRegistry } from "../registry/channel.registry";

@Injectable()
export class NotificationChannelFactory {
  constructor(private registry: ChannelRegistry) {}

  /**
   * Retrieves a notification channel from the registry.
   * Supports both enum values and string names.
   * 
   * @param channelType - The type or name of the channel
   * @returns The channel implementation
   */
  public getChannel(channelType: ChannelType | string): INotificationChannel {
    return this.registry.getChannel(channelType);
  }
}
