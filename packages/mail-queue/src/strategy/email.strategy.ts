import { IEmailStrategy } from '../interfaces/IemailStrategy.interface';

export class SMTPEmailStrategy implements IEmailStrategy {
    // Accepts the initialized Nodemailer transporter
    constructor(private transporter: any) {}

    /**
     * Sends the email using the configured SMTP transporter.
     */
    async send(to: string, subject: string, text: string): Promise<void> {
        // Nodemailer transport logic
        await this.transporter.sendMail({
            from: process.env.MAIL_USER, // Sender defined by environment variable
            to,
            subject,
            text,
        });
    }
}
// NOTE: This pattern allows easy swapping for other strategies (e.g., SendgridEmailStrategy) 
// without modifying the EmailProcessor code.