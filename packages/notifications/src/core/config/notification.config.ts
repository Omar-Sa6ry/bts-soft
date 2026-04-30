import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { IsString, IsNotEmpty, IsOptional, IsNumber, validateSync, IsEnum } from "class-validator";
import { plainToInstance } from "class-transformer";

class NotificationConfigDto {
  @IsString() @IsOptional() TELEGRAM_BOT_TOKEN?: string;
  @IsString() @IsOptional() DISCORD_WEBHOOK_URL?: string;
  @IsString() @IsOptional() TEAMS_WEBHOOK_URL?: string;
  @IsString() @IsOptional() FB_PAGE_ACCESS_TOKEN?: string;
  @IsString() @IsOptional() FB_GRAPH_API_VERSION: string = "v18.0";
  @IsString() @IsOptional() TWILIO_ACCOUNT_SID?: string;
  @IsString() @IsOptional() TWILIO_AUTH_TOKEN?: string;
  @IsString() @IsOptional() TWILIO_WHATSAPP_NUMBER?: string;
  @IsString() @IsOptional() TWILIO_SMS_NUMBER?: string;
  @IsString() @IsOptional() FIREBASE_SERVICE_ACCOUNT_PATH?: string;
  @IsString() @IsOptional() EMAIL_USER?: string;
  @IsString() @IsOptional() EMAIL_PASS?: string;
  @IsString() @IsOptional() EMAIL_HOST?: string;
  @IsNumber() @IsOptional() EMAIL_PORT?: number;
  @IsString() @IsOptional() EMAIL_SERVICE?: string;
  @IsString() @IsOptional() EMAIL_SENDER?: string;
}

@Injectable()
export class NotificationConfigService implements OnModuleInit {
  private readonly logger = new Logger(NotificationConfigService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.validateConfig();
  }

  private validateConfig() {
    const config = plainToInstance(NotificationConfigDto, {
        TELEGRAM_BOT_TOKEN: this.telegramToken,
        DISCORD_WEBHOOK_URL: this.discordWebhookUrl,
        TEAMS_WEBHOOK_URL: this.teamsWebhookUrl,
        FB_PAGE_ACCESS_TOKEN: this.facebookPageAccessToken,
        FB_GRAPH_API_VERSION: this.facebookGraphApiVersion,
        TWILIO_ACCOUNT_SID: this.twilioAccountSid,
        TWILIO_AUTH_TOKEN: this.twilioAuthToken,
        TWILIO_WHATSAPP_NUMBER: this.twilioWhatsappNumber,
        TWILIO_SMS_NUMBER: this.twilioSmsNumber,
        FIREBASE_SERVICE_ACCOUNT_PATH: this.firebaseServiceAccountPath,
        EMAIL_USER: this.emailUser,
        EMAIL_PASS: this.emailPass,
        EMAIL_HOST: this.emailHost,
        EMAIL_PORT: this.emailPort,
        EMAIL_SERVICE: this.emailService,
        EMAIL_SENDER: this.emailSender,
    });

    const errors = validateSync(config);
    if (errors.length > 0) {
      this.logger.warn("Notification configuration validation warnings:");
      errors.forEach(err => this.logger.warn(JSON.stringify(err.constraints)));
    }
  }

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
