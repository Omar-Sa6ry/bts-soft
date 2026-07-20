import { SetMetadata } from '@nestjs/common';
import { IdempotentOptions } from '../interfaces/resilience.interface';

export const IDEMPOTENT_METADATA = 'IDEMPOTENT_METADATA';

export const Idempotent = (options: IdempotentOptions = {}) => SetMetadata(IDEMPOTENT_METADATA, options);
