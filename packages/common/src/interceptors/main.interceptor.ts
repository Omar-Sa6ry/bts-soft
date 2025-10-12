import { INestApplication } from '@nestjs/common';
import { GeneralResponseInterceptor } from './generalResponse.interceptor';
import { SqlInjectionInterceptor } from './sqlInjection.interceptor';

export const setupInterceptors = (app: INestApplication): void => {
  app.useGlobalInterceptors(
    new SqlInjectionInterceptor(),
    new GeneralResponseInterceptor(),
  );
};
