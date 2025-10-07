// packages/mail-queue/src/index.ts

// Module: The main component to be imported into the application's AppModule
export * from './email.module';

// Services: The class application services will use to trigger email sending
export * from './sendemail.service';

// Observers: Export concrete observers (like EmailLoggingObserver)
export * from './observer/email.observer';

// Interfaces: Essential types for users to maintain type safety
export * from './interfaces/IEmailObserver.interface';
export * from './interfaces/IEmailStrategy.interface';
// NOTE: IEmailCommand interface removed

// Strategies: Export strategies if users might want to extend or override them
export * from './strategy/email.strategy' 

// Processor: Export the processor (less common, but useful for testing/introspection)
export * from './processor/email.processing'; 

// Provider: Export the provider token for advanced users
export * from './provider/mailer.provider';