import * as nodemailer from 'nodemailer';

export const mailerProvider = {
    // Unique injection token used by the EmailProcessor
    provide: 'MAILER',
    // Factory function creates the actual instance dynamically
    useFactory: () => {
        return nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            // Ensures port is parsed as a number from environment string
            port: parseInt(process.env.MAIL_PORT, 10), 
            secure: false, // Use TLS/non-secure based on environment
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });
    },
};