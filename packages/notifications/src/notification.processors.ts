import { Processor } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { NotificationProcessor } from "./notification.processor";
import { ChannelType } from "./core/enums/ChannelType.enum";

@Processor(`send-notification-${ChannelType.FIREBASE_FCM}`)
@Injectable()
export class FirebaseFcmProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.MESSENGER}`)
@Injectable()
export class FacebookMessengerProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.WHATSAPP}`)
@Injectable()
export class WhatsAppProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.TELEGRAM}`)
@Injectable()
export class TelegramProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.DISCORD}`)
@Injectable()
export class DiscordProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.TEAMS}`)
@Injectable()
export class TeamsProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.EMAIL}`)
@Injectable()
export class EmailProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.SMS}`)
@Injectable()
export class SmsProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.SLACK}`)
@Injectable()
export class SlackProcessor extends NotificationProcessor {}

@Processor(`send-notification-${ChannelType.WEBHOOK}`)
@Injectable()
export class WebhookProcessor extends NotificationProcessor {}
