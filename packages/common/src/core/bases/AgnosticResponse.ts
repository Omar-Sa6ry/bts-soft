/**
 * AgnosticResponse
 * 
 * A pure TypeScript base class for API responses.
 * Standardizes the response structure without protocol-specific decorators.
 */
export class AgnosticResponse {
  /** Optional message to describe the response result. */
  message?: string;

  /** Indicates whether the operation succeeded or failed. */
  success?: boolean;

  /** ISO timestamp representing when the response was generated. */
  timeStamp?: string;

  /** HTTP status code or equivalent numeric result. */
  statusCode?: number;
}
