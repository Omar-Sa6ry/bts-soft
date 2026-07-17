import { Injectable, Logger } from "@nestjs/common";
import Pusher from "pusher";
import { IInAppProvider } from "../interfaces/inapp-provider.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";

@Injectable()
export class PusherInAppProvider implements IInAppProvider {
  private defaultClient?: Pusher;
  private readonly logger = new Logger(PusherInAppProvider.name);

  constructor(private readonly configService: NotificationConfigService) {
    this.initializeDefaultClient();
  }

  private initializeDefaultClient() {
    const appId = this.configService.pusherAppId;
    const key = this.configService.pusherKey;
    const secret = this.configService.pusherSecret;
    const cluster = this.configService.pusherCluster;

    if (appId && key && secret && cluster) {
      try {
        this.defaultClient = new Pusher({
          appId,
          key,
          secret,
          cluster,
          useTLS: true,
        });
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new Error(String(e));
        this.logger.warn(`Failed to initialize default Pusher client: ${err.message}`);
      }
    } else {
      this.logger.warn("Pusher credentials missing. PusherInAppProvider will not function without dynamic credentials.");
    }
  }

  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: channel, body, title, context, channelOptions } = message;

    if (!channel) {
      throw new NotificationClientError("In-App recipientId (Pusher channel name) is required.");
    }

    let clientToUse = this.defaultClient;

    if (channelOptions?.appId && channelOptions?.key && channelOptions?.secret && channelOptions?.cluster) {
      this.logger.debug("Using dynamic Pusher credentials.");
      clientToUse = new Pusher({
        appId: channelOptions.appId as string,
        key: channelOptions.key as string,
        secret: channelOptions.secret as string,
        cluster: channelOptions.cluster as string,
        useTLS: true,
      });
    }

    if (!clientToUse) {
      throw new NotificationProviderError("Pusher client is not initialized and no dynamic credentials provided.");
    }

    const eventName = (channelOptions?.eventName as string | undefined) || (channelOptions?.event as string | undefined) || "notification";

    const payload = {
      title,
      body,
      context,
      timestamp: new Date().toISOString(),
      ...(channelOptions?.payload as Record<string, unknown> || {}),
    };

    this.logger.log(`Publishing real-time notification to channel "${channel}" on event "${eventName}" via Pusher`);

    try {
      await clientToUse.trigger(channel, eventName, payload);
      this.logger.log(`Pusher event successfully triggered on channel "${channel}"`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to trigger event via Pusher:`, err);

      const errMessage = err.message.toLowerCase();
      if (errMessage.includes("invalid") || errMessage.includes("missing")) {
        throw new NotificationClientError(`Pusher client error: ${err.message}`);
      }

      throw new NotificationProviderError(`Pusher provider error: ${err.message}`);
    }
  }
}
