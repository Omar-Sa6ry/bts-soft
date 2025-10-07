import * as nodemailer from 'nodemailer';

export const mailerProvider = {
    // Unique injection token used by the EmailProcessor
    provide: 'MAILER',
    // Factory function creates the actual instance dynamically
    useFactory: () => {
        
    // Extract environment variables
    const { MAIL_HOST, MAIL_PORT, MAIL_USER, MAIL_PASS } = process.env;

    // Check if all required environment variables exist
    const missingVars = [];
    if (!MAIL_HOST) missingVars.push('MAIL_HOST');
    if (!MAIL_PORT) missingVars.push('MAIL_PORT');
    if (!MAIL_USER) missingVars.push('MAIL_USER');
    if (!MAIL_PASS) missingVars.push('MAIL_PASS');

    // Throw error if any variable is missing
    if (missingVars.length > 0) {
      throw new Error(
        `Missing required mail environment variables: ${missingVars.join(', ')}`
      );
    }


        return nodemailer.createTransport({
            host: MAIL_HOST,
            // Ensures port is parsed as a number from environment string
            port: parseInt(MAIL_PORT, 10), 
            secure: false, // Use TLS/non-secure based on environment
            auth: {
                user: MAIL_USER,
                pass: MAIL_PASS,
            },
        });
    },
};

