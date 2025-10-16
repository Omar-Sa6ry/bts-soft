import { Module } from "@nestjs/common";
import { TelegramService } from "./telegram.service";
import { TelegramController } from "./telegram.controller";
import { NotificationModule } from "../notification.module";

@Module({
  imports: [NotificationModule],
  providers: [TelegramService],
  controllers: [TelegramController],
  exports: [TelegramService, NotificationModule],
})
export class TelegramModule {}
