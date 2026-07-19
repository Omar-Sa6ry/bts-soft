import { Expose } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

/**
 * Base response model providing default responses when fields are unpopulated.
 */
export class BaseResponse {
  @IsOptional()
  @IsString()
  @Expose()
  message?: string = 'Operation executed successfully';

  @IsOptional()
  @IsBoolean()
  @Expose()
  success?: boolean = true;

  @IsOptional()
  @IsString()
  @Expose()
  timeStamp?: string = new Date().toISOString();

  @IsOptional()
  @IsInt()
  @Expose()
  statusCode?: number = 200;
}
