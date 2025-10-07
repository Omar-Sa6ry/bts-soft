import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { SMTPEmailStrategy } from '../strategy/email.strategy';
import { IEmailStrategy } from '../interfaces/IemailStrategy.interface'; // Strategy Pattern Interface

@Processor('email') // Marks this class as the processor for the 'email' queue
@Injectable()
export class EmailProcessor extends WorkerHost {
    private strategy: IEmailStrategy; // The current email sending strategy

    constructor(@Inject('MAILER') private readonly transporter: any) {
        super();
        // Injecting the Nodemailer Transporter provided by mailerProvider
        // Initializing the concrete strategy (currently SMTP)
        this.strategy = new SMTPEmailStrategy(this.transporter);
    }

    /**
     * Executes the job when pulled from the 'email' queue.
     * @param job The BullMQ job object containing email data
     */
    async process(job: Job): Promise<void> {
        const { to, subject, text } = job.data;

        try {
            // Sending email using the chosen strategy
            await this.strategy.send(to, subject, text);
            console.log('Email sent successfully:', job.data.subject); // Should be replaced by Observer/Logger
        } catch (error) {
            console.error('Email sending failed:', error.message);
            throw error; // Throwing error tells BullMQ to potentially retry the job
        }
    }
}