import { Injectable, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IEmailObserver } from './interfaces/iEmailObserver.interface';
import { EmailLoggingObserver } from './observer/email.observer';

@Injectable()
export class SendEmailService {
    // Observer Pattern: Holds a list of observers (e.g., loggers, analytics trackers)
    private observers: IEmailObserver[] = [];

    constructor(@InjectQueue('email') private readonly emailQueue: Queue) {
        // Injecting the BullMQ 'email' queue
        // Initializing with a default observer for basic logging
        this.observers.push(new EmailLoggingObserver());
    }

    /**
     * Public method to initiate an email sending request.
     * This method immediately adds the request to the queue for asynchronous processing.
     * @param to Recipient email address
     * @param subject Email subject line
     * @param text Email body (plain text)
     */
    async sendEmail(to: string, subject: string, text: string): Promise<void> {
        // Direct implementation of queuing logic (Command Pattern logic is now integrated)
        try {
            // Add job to the 'email' queue
            await this.emailQueue.add('send-email', { to, subject, text });
            this.notifySuccess({ to, subject }); // Notify observers upon successful queuing
        } catch (error) {
            this.notifyError({ to, subject }, error); // Notify observers upon failed queuing
            throw error;
        }
    }

    /**
     * Allows other modules to attach new observers to this service.
     * @param observer The observer instance to add
     */
    addObserver(observer: IEmailObserver): void {
        this.observers.push(observer);
    }

    // --- Private Observer Notification Methods ---

    private notifySuccess(jobData: any): void {
        this.observers.forEach((observer) => observer.onEmailSent(jobData));
    }

    private notifyError(jobData: any, error: Error): void {
        this.observers.forEach((observer) => observer.onEmailError(jobData, error));
    }
}