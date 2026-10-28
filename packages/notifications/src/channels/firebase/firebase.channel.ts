import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as admin from "firebase-admin";
import { INotificationChannel } from "../../core/interfaces/INotificationChannel.interface";
import { NotificationMessage } from "../../core/models/NotificationMessage.interface";
import { NotificationDispatchResult } from "../../core/models/NotificationDispatchResult.interface";
import { NotificationConfigService } from "../../core/config/notification.config";
import { ChannelRegistry } from "../../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../../core/errors/NotificationError";
import { ChannelType } from "../../core/enums/ChannelType.enum";

@Injectable()
export class FirebaseChannel implements INotificationChannel, OnModuleInit {
  public name: string = "firebase_fcm";
  private readonly logger = new Logger(FirebaseChannel.name);
  private initialized = false;

  constructor(
    private configService: NotificationConfigService,
    private registry: ChannelRegistry
  ) {}

  onModuleInit() {
    this.initializeFirebase();
    this.registry.register(this);
  }

  private initializeFirebase() {
    const serviceAccountPath = this.configService.firebaseServiceAccountPath;
    const projectId = process.env.PROJECT_ID;
    const clientEmail = process.env.CLIENT_EMAIL;
    const privateKey = process.env.PRIVATE_KEY;

    try {
      if (admin.apps.length === 0) {
        if (serviceAccountPath) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
          });
          this.initialized = true;
          this.logger.log("Firebase Admin SDK initialized from service account path.");
        } else if (projectId && clientEmail && privateKey) {
          const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId,
              clientEmail,
              privateKey: formattedPrivateKey,
            }),
          });
          this.initialized = true;
          this.logger.log("Firebase Admin SDK initialized from inline credentials.");
        } else if (serviceAccountPath || projectId || clientEmail || privateKey) {
          this.logger.warn(
            "Firebase credentials are incomplete; provide FIREBASE_SERVICE_ACCOUNT_PATH or PROJECT_ID, CLIENT_EMAIL, and PRIVATE_KEY.",
          );
        }
      } else {
        this.initialized = true;
      }
    } catch (error) {
      this.logger.error("Failed to initialize Firebase Admin SDK:", error);
    }
  }

  public async send(
    message: NotificationMessage,
  ): Promise<NotificationDispatchResult> {
    const startTime = Date.now();
    if (!this.initialized) {
      throw new NotificationProviderError("Firebase Admin SDK is not initialized.");
    }

    const { recipientId: token, title, body, channelOptions } = message;

    if (!token) throw new NotificationClientError("FCM token (recipientId) is required.");

    this.logger.log(`Sending FCM notification to token: ${token.substring(0, 10)}...`);

    try {
      const response = await admin.messaging().send({
        token,
        notification: { title: title || "New Notification", body },
        ...channelOptions,
      });
      this.logger.log("FCM notification sent successfully.");

      return {
        provider:  ChannelType.FIREBASE_FCM,
        providerMessageId: typeof response === "string" ? response : undefined,
        rawResponse: response,
        dispatchedAt: new Date(),
        durationMs: Date.now() - startTime,
      };
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to send FCM notification: ${err.message}`, err.stack);
      
      // Categorize Firebase errors
      const fcmError = error as { code?: string };
      if (
        fcmError.code === 'messaging/invalid-registration-token' ||
        fcmError.code === 'messaging/registration-token-not-registered' ||
        fcmError.code === 'messaging/invalid-argument' ||
        fcmError.code === 'messaging/invalid-payload'
      ) {
        throw new NotificationClientError(`Firebase client error: ${err.message}`);
      }
      
      throw new NotificationProviderError(`Firebase provider error: ${err.message}`);
    }
  }
}
