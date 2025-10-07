export interface IEmailObserver {
  onEmailSent(jobData: any): void;
  onEmailError(jobData: any, error: Error): void;
}
