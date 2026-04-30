import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import * as admin from "firebase-admin";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";
import { NotificationConfigService } from "../core/config/notification.config";
import { ChannelRegistry } from "../core/registry/channel.registry";
import { NotificationClientError, NotificationProviderError } from "../core/errors/NotificationError";

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
    if (!serviceAccountPath) {
      this.logger.warn("Firebase serviceAccountPath missing. FirebaseChannel will not function.");
      return;
    }

    try {
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
      }
      this.initialized = true;
      this.logger.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      this.logger.error("Failed to initialize Firebase Admin SDK:", error);
    }
  }

  public async send(message: NotificationMessage): Promise<void> {
    if (!this.initialized) {
      throw new NotificationProviderError("Firebase Admin SDK is not initialized.");
    }

    const { recipientId: token, title, body, channelOptions } = message;

    if (!token) throw new NotificationClientError("FCM token (recipientId) is required.");

    this.logger.log(`Sending FCM notification to token: ${token.substring(0, 10)}...`);

    try {
      await admin.messaging().send({
        token,
        notification: { title: title || "New Notification", body },
        ...channelOptions,
      });
      this.logger.log("FCM notification sent successfully.");
    } catch (error: any) {
      this.logger.error("Failed to send FCM notification:", error);
      
      // Categorize Firebase errors
      const code = error.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-argument' ||
        code === 'messaging/invalid-payload'
      ) {
        throw new NotificationClientError(`Firebase client error: ${error.message}`);
      }
      
      throw new NotificationProviderError(`Firebase provider error: ${error.message}`);
    }
  }
}

