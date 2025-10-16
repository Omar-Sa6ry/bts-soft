import {
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class TelegramChatDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  type: string;
}

export class TelegramMessageDto {
  @IsNumber()
  @IsNotEmpty()
  message_id: number;

  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TelegramChatDto)
  chat: TelegramChatDto;

  @IsString()
  @IsOptional()
  text?: string;
}

export class TelegramWebhookDto {
  @IsNumber()
  @IsNotEmpty()
  update_id: number;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => TelegramMessageDto)
  message?: TelegramMessageDto;
}
