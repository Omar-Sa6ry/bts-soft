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
  success?: boolean = true;

  /** ISO timestamp representing when the response was generated. */
  timeStamp?: string = new Date().toISOString();

  /** HTTP status code or equivalent numeric result. */
  statusCode?: number = 200;
}
