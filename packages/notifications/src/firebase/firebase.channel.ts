import * as admin from "firebase-admin";
import { INotificationChannel } from "../telegram/channels/INotificationChannel.interface";
import { NotificationMessage } from "../core/models/NotificationMessage.interface";

interface FirebaseConfig {
  serviceAccountPath: string;
}

/**
 * FirebaseChannel class implements the INotificationChannel interface.
 * It is responsible for sending push notifications via Firebase Cloud Messaging (FCM).
 */
export class FirebaseChannel implements INotificationChannel {
  public name: string = "firebase";
  private isInitialized: boolean = false;

  /**
   * Constructor initializes Firebase Admin SDK using the provided service account file.
   * Ensures that initialization happens only once across all instances.
   *
   * @param config - Object containing the path to the Firebase service account JSON file.
   */
  constructor(config: FirebaseConfig) {
    // Initialize Firebase Admin SDK only if it has not been initialized yet.
    if (!admin.apps.length) {
      try {
        // Load the service account credentials from the provided path.
        const serviceAccount = require(config.serviceAccountPath);

        // Initialize the Firebase Admin SDK with the credentials.
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });

        this.isInitialized = true;
      } catch (error) {
        console.error(
          "Failed to initialize Firebase Admin SDK:",
          error.message
        );
        throw new Error(
          "Firebase initialization failed. Check service account path."
        );
      }
    } else {
      // If Firebase is already initialized, just mark as initialized.
      this.isInitialized = true;
    }
  }

  /**
   * Sends a push notification to a specific device token using Firebase Cloud Messaging.
   *
   * @param message - Object containing recipientId (device token), title, body, and channel options.
   */
  public async send(message: NotificationMessage): Promise<void> {
    const { recipientId: token, body, title, channelOptions } = message;

    // Ensure Firebase is initialized before attempting to send.
    if (!this.isInitialized)
      throw new Error("Firebase Admin SDK is not initialized.");

    // Ensure a valid FCM device token is provided.
    if (!token) throw new Error("FCM recipientId (device token) is required.");

    // Define the FCM message payload.
    const payload: admin.messaging.Message = {
      notification: {
        title: title || "New Notification",
        body: body,
      },
      token: token,
      data: channelOptions?.data || {},
      ...channelOptions?.options,
    };

    console.log(`Sending FCM notification to token: ${token}`);

    try {
      // Send the notification using Firebase Cloud Messaging.
      const response = await admin.messaging().send(payload);
      console.log(`FCM sent successfully. Message ID: ${response}`);
    } catch (error) {
      // Handle and log any errors that occur during the send process.
      console.error(`Failed to send FCM message to ${token}:`, error);
      throw new Error(`FCM send error: ${error.message}`);
    }
  }
}
