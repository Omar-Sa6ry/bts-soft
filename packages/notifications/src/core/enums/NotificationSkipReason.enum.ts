/** Reason a notification was skipped before delivery. */
export enum NotificationSkipReason {
  RATE_LIMITED = "rate_limited",
  OPTED_OUT = "opted_out",
  DUPLICATE = "duplicate",
  EXPIRED = "expired",
}
