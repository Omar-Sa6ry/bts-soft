import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq'; // Used for Queue management (Redis-based)
import { EmailProcessor } from './processor/email.processing';
import { SendEmailService } from './sendemail.service';
import { mailerProvider } from './provider/mailer.provider'; // Nodemailer Transporter factory

@Module({
    imports: [
        // Global BullMQ configuration (connecting to Redis server)
        // This configuration is applied globally for all queues defined in this module
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || '127.0.0.1',
                port: parseInt(process.env.REDIS_PORT, 10) || 6379,
            },
        }),
        // Registering a specific queue named 'email'
        BullModule.registerQueue({ name: 'email' }),
    ],
    providers: [
        EmailProcessor, // The Worker that executes queue jobs
        mailerProvider, // The Provider that initializes the Nodemailer transporter
        SendEmailService, // The Service responsible for adding jobs to the queue
    ],
    exports: [
        BullModule, // Exporting BullModule allows other modules to inject the 'email' queue
        SendEmailService // Exporting the service allows other modules to use sendEmail()
    ],
})
export class EmailModule {}