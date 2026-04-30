import { Injectable, Logger } from '@nestjs/common';
import { INotificationChannel } from '../../telegram/channels/INotificationChannel.interface';
import { ChannelType } from '../models/ChannelType.const';

@Injectable()
export class ChannelRegistry {
  private readonly logger = new Logger(ChannelRegistry.name);
  private readonly channels = new Map<string, INotificationChannel>();

  public register(channel: INotificationChannel) {
    this.logger.log(`Registering notification channel: ${channel.name}`);
    this.channels.set(channel.name, channel);
  }

  public getChannel(type: ChannelType | string): INotificationChannel {
    const channel = this.channels.get(type);
    if (!channel) {
      throw new Error(`Notification channel not found: ${type}`);
    }
    return channel;
  }

  public getAllChannels(): INotificationChannel[] {
    return Array.from(this.channels.values());
  }
}
