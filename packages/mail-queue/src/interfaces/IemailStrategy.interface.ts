export interface IEmailStrategy {
  send(to: string, subject: string, text: string): Promise<void>;
}
