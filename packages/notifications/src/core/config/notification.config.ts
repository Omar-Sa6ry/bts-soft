import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class NotificationConfigService {
  constructor(private configService: ConfigService) {}

  get telegramToken(): string | undefined {
    return this.configService.get<string>("TELEGRAM_BOT_TOKEN");
  }

  get discordWebhookUrl(): string | undefined {
    return this.configService.get<string>("DISCORD_WEBHOOK_URL");
  }

  get teamsWebhookUrl(): string | undefined {
    return this.configService.get<string>("TEAMS_WEBHOOK_URL");
  }

  get facebookPageAccessToken(): string | undefined {
    return this.configService.get<string>("FB_PAGE_ACCESS_TOKEN");
  }

  get facebookGraphApiVersion(): string {
    return this.configService.get<string>("FB_GRAPH_API_VERSION") || "v18.0";
  }

  get twilioAccountSid(): string | undefined {
    return this.configService.get<string>("TWILIO_ACCOUNT_SID");
  }

  get twilioAuthToken(): string | undefined {
    return this.configService.get<string>("TWILIO_AUTH_TOKEN");
  }

  get twilioWhatsappNumber(): string | undefined {
    return this.configService.get<string>("TWILIO_WHATSAPP_NUMBER");
  }

  get twilioSmsNumber(): string | undefined {
    return this.configService.get<string>("TWILIO_SMS_NUMBER");
  }

  get firebaseServiceAccountPath(): string | undefined {
    return this.configService.get<string>("FIREBASE_SERVICE_ACCOUNT_PATH");
  }

  get emailUser(): string | undefined {
    return this.configService.get<string>("EMAIL_USER");
  }

  get emailPass(): string | undefined {
    return this.configService.get<string>("EMAIL_PASS");
  }

  get emailHost(): string | undefined {
    return this.configService.get<string>("EMAIL_HOST");
  }

  get emailPort(): number | undefined {
    return this.configService.get<number>("EMAIL_PORT");
  }

  get emailService(): string | undefined {
    return this.configService.get<string>("EMAIL_SERVICE");
  }

  get emailSender(): string | undefined {
    return (
      this.configService.get<string>("EMAIL_SENDER") ||
      this.configService.get<string>("EMAIL_USER")
    );
  }
}
