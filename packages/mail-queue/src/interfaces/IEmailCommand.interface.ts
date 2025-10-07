export interface IEmailCommand {
  execute(): Promise<void>;
}
