export class NotificationError extends Error {
  constructor(
    public readonly message: string,
    public readonly channel: string,
    public readonly originalError?: any,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = "NotificationError";
  }
}
