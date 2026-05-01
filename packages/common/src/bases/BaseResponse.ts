import { Expose } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

/**
 * BaseResponse (Agnostic)
 *
 * A protocol-agnostic response model for standardized API structures.
 * Supports REST (via class-validator/transformer).
 * 
 * To use with GraphQL decorators, extend GraphqlBaseResponse instead.
 */
export class BaseResponse {
  /** Optional message to describe the response result. */
  @IsOptional()
  @IsString()
  @Expose()
  message?: string;

  /** Indicates whether the operation succeeded or failed. */
  @IsOptional()
  @IsBoolean()
  @Expose()
  success?: boolean;

  /** ISO timestamp representing when the response was generated. */
  @IsOptional()
  @IsString()
  @Expose()
  timeStamp?: string;

  /** HTTP status code or equivalent numeric result. */
  @IsOptional()
  @IsInt()
  @Expose()
  statusCode?: number;
}
