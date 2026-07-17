import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { INotificationChannel } from "../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { PusherInAppProvider } from "./providers/pusher-inapp.provider";
import { ChannelType } from "../core/enums/ChannelType.enum";

@Injectable()
export class InAppChannel implements INotificationChannel, OnModuleInit {
  public readonly name: string = ChannelType.IN_APP;
  private readonly logger = new Logger(InAppChannel.name);

  constructor(
    private readonly configService: NotificationConfigService,
    private readonly registry: ChannelRegistry,
    private readonly pusherProvider: PusherInAppProvider
  ) {}

  onModuleInit() {
    this.registry.register(this);
  }

  public async send(message: NotificationMessage): Promise<void> {
    const providerKey =
      (message.channelOptions?.provider as string | undefined) ||
      this.configService.inAppProvider;

    this.logger.log(`Routing In-App real-time notification using provider: ${providerKey}`);

    await this.pusherProvider.send(message);
    // if (providerKey === "pusher") {
    //   await this.pusherProvider.send(message);
    // } else {
    //   await this.pusherProvider.send(message);
    // }
  }
}
