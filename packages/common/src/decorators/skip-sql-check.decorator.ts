import { SetMetadata } from '@nestjs/common';

export const SKIP_SQL_CHECK_KEY = 'skipSqlCheck';

/**
 * SkipSqlCheck Decorator
 * 
 * Bypasses automated SQL injection scanning for trusted routes or raw payload endpoints.
 */
export const SkipSqlCheck = () => SetMetadata(SKIP_SQL_CHECK_KEY, true);
