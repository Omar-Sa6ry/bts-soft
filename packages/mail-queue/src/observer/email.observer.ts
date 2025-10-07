import { IEmailObserver } from '../interfaces/iEmailObserver.interface';

export class EmailLoggingObserver implements IEmailObserver {
    // Action when the email job is successfully queued (not necessarily sent yet)
    onEmailSent(jobData: any): void {
        console.log(`[Observer] Job successfully queued for: ${jobData.to}`);
    }

    // Action when the email job fails to be queued
    onEmailError(jobData: any, error: Error): void {
        console.error(`[Observer] Failed to queue job for ${jobData.to}:`, error.message);
    }
}