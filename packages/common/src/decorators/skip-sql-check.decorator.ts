import { SetMetadata } from "@nestjs/common";
export const SKIP_SQL_CHECK_KEY = "skipSqlCheck";
export const SkipSqlCheck = () => SetMetadata(SKIP_SQL_CHECK_KEY, true);
