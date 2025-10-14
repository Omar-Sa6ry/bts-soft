import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { NotificationMessage } from './core/models/NotificationMessage.interface';
import { ChannelType } from './core/models/ChannelType.const';

const NOTIFICATION_QUEUE_NAME = 'send-notification';

export interface NotificationJobData {
  channel: ChannelType;
  message: NotificationMessage;
}

@Injectable()
export class NotificationService {
  
  constructor(@InjectQueue(NOTIFICATION_QUEUE_NAME) private notificationQueue: Queue<NotificationJobData>) {}

  public async send(channel: ChannelType, message: NotificationMessage): Promise<void> {
    const jobData: NotificationJobData = { channel, message };
    
    await this.notificationQueue.add(channel, jobData, { 
        attempts: 3, 
        backoff: { type: 'exponential', delay: 5000 } 
    });
    
    console.log(`Notification request added to queue: ${channel}`);
  }
}